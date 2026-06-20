import os
import shutil
from pathlib import Path
from typing import List, Dict, Any

from google import genai
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from app.core.config import settings

# Initialize ChromaDB
client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# Track uploaded documents in memory
uploaded_docs: Dict[str, Dict] = {}


def get_or_create_collection(collection_name: str):
    return client.get_or_create_collection(
        name=collection_name,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def process_and_index_document(file_path: str, doc_id: str, filename: str) -> Dict[str, Any]:
    """Process PDF and index into ChromaDB."""
    # Extract text
    raw_text = extract_text_from_pdf(file_path)
    
    if not raw_text.strip():
        raise ValueError("No text could be extracted from the PDF.")

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_text(raw_text)

    # Index into ChromaDB
    collection = get_or_create_collection(f"doc_{doc_id}")
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    
    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=[{"source": filename, "chunk_index": i} for i in range(len(chunks))]
    )

    # Store metadata
    uploaded_docs[doc_id] = {
        "doc_id": doc_id,
        "filename": filename,
        "chunk_count": len(chunks),
        "char_count": len(raw_text),
        "collection_name": f"doc_{doc_id}"
    }

    return uploaded_docs[doc_id]


def retrieve_relevant_chunks(doc_id: str, query: str, k: int = None) -> List[str]:
    """Retrieve top-k relevant chunks for a query."""
    k = k or settings.RETRIEVER_K
    collection = get_or_create_collection(f"doc_{doc_id}")
    results = collection.query(query_texts=[query], n_results=min(k, collection.count()))
    return results["documents"][0] if results["documents"] else []


def answer_question(doc_id: str, question: str, chat_history: List[Dict] = None) -> Dict[str, Any]:
    """Answer a question using RAG + Claude."""
    # Retrieve relevant context
    chunks = retrieve_relevant_chunks(doc_id, question)
    
    if not chunks:
        return {
            "answer": "I couldn't find relevant information in the document to answer your question.",
            "sources": [],
            "context_used": 0
        }

    context = "\n\n---\n\n".join(chunks)
    
    # Build system prompt
    system_prompt = """You are an expert technical assistant that answers questions about technical manuals and documents.
    
Your task:
- Answer questions ONLY based on the provided document context
- Be precise, clear, and helpful
- If the answer is not in the context, say so honestly
- Reference specific parts of the manual when relevant
- Format your response clearly with bullet points or numbered lists when appropriate"""

    # Build chat history as plain text (Gemini's simple text-prompt style)
    history_text = ""
    if chat_history:
        for msg in chat_history[-6:]:  # Last 3 exchanges
            role_label = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role_label}: {msg['content']}\n\n"

    history_block = f"Previous conversation:\n{history_text}" if history_text else ""

    # Build the full prompt (Gemini doesn't require a separate system param for this simple case)
    full_prompt = f"""{system_prompt}

{history_block}
Context from the technical manual:
{context}

Question: {question}

Please answer based on the above context."""

    # Call Gemini API
    gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt
    )

    return {
        "answer": response.text,
        "sources": chunks[:3],  # Return top 3 chunks as sources
        "context_used": len(chunks)
    }


def list_documents() -> List[Dict]:
    """List all uploaded documents."""
    # Also check ChromaDB for persisted collections
    collections = client.list_collections()
    result = []
    for col in collections:
        doc_id = col.name.replace("doc_", "")
        if doc_id in uploaded_docs:
            result.append(uploaded_docs[doc_id])
        else:
            result.append({
                "doc_id": doc_id,
                "filename": f"Document {doc_id}",
                "chunk_count": col.count(),
                "collection_name": col.name
            })
    return result


def delete_document(doc_id: str) -> bool:
    """Delete a document and its index."""
    try:
        client.delete_collection(f"doc_{doc_id}")
        uploaded_docs.pop(doc_id, None)
        return True
    except Exception:
        return False
