from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, documents

app = FastAPI(
    title="Technical Manual Intelligence System",
    description="RAG-based PDF Q&A chatbot for technical manuals",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "Technical Manual Intelligence System API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
