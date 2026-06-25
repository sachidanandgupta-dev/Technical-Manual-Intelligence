# 📚 Technical Manual Intelligence System

> RAG-powered document Q&A chatbot for technical PDF manuals

## 🏗️ Tech Stack
- **Backend:** Python, FastAPI, LangChain, ChromaDB, SentenceTransformers, Gemini API
- **Frontend:** React.js, Vite, Tailwind CSS, React Markdown
- **AI:** Retrieval-Augmented Generation (RAG) + Gemini (gemini-2.5-flash)

## 📐 Architecture 
```
PDF Upload → Text Extraction (pypdf) → Chunking (LangChain RecursiveCharacterTextSplitter)
    → Embedding (SentenceTransformer: all-MiniLM-L6-v2) → Vector Store (ChromaDB)
    → Query → Semantic Search → Top-K Chunks → Gemini API → Answer
```

## ⚠️ First-Run Note
On the very first request, `sentence-transformers` silently downloads the
`all-MiniLM-L6-v2` embedding model (~90MB) from Hugging Face. This requires
normal internet access and may take 30–60 seconds the first time only —
after that it's cached locally and starts instantly. If your network blocks
huggingface.co, the backend will fail to start with an `OSError`.

## 🚀 How to Run

### 1. Backend
```bash
cd backend
cp .env .env.local          # Add your GEMINI_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# OR: bash run.sh
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 🔑 Environment Variables
```
GEMINI_API_KEY=your_gemini_api_key_here   # Required
UPLOAD_DIR=uploads             # PDF storage
CHROMA_DIR=chroma_db           # Vector DB storage
CHUNK_SIZE=1000                # Chars per chunk
CHUNK_OVERLAP=200              # Overlap between chunks
```

## 📡 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload & index a PDF |
| GET | `/api/documents/list` | List all documents |
| DELETE | `/api/documents/{doc_id}` | Delete a document |
| POST | `/api/chat/ask` | Ask a question |
| GET | `/api/chat/history/{doc_id}` | Get suggested questions |
| GET | `/health` | Health check |

## 💡 Interview Talking Points
- **RAG Pipeline:** Explain chunking → embedding → retrieval → generation
- **Why ChromaDB:** Persistent vector store, cosine similarity, fast retrieval
- **Why SentenceTransformers:** Free, local, no API cost for embeddings
- **Chunk size tuning:** Larger chunks = more context but less precision
- **Chat history:** Last 3 exchanges passed for contextual follow-ups
