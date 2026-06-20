from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import rag_service

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    doc_id: str
    question: str
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    context_used: int


@router.post("/ask", response_model=ChatResponse)
def ask_question(request: ChatRequest):
    """Ask a question about an uploaded document."""
    if not request.doc_id:
        raise HTTPException(status_code=400, detail="doc_id is required.")
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    history = [{"role": m.role, "content": m.content} for m in (request.chat_history or [])]

    try:
        result = rag_service.answer_question(request.doc_id, request.question, history)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to answer question: {str(e)}")


@router.get("/history/{doc_id}")
def get_suggestions(doc_id: str):
    """Get suggested questions for a document."""
    suggestions = [
        "What is the main purpose of this manual?",
        "What are the key features or specifications?",
        "What are the safety precautions mentioned?",
        "How do I troubleshoot common issues?",
        "What are the installation or setup steps?",
        "What maintenance is required?"
    ]
    return {"doc_id": doc_id, "suggestions": suggestions}
