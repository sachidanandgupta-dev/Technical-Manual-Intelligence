import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services import rag_service

router = APIRouter()

# Ensure upload directory exists
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a PDF document."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")

    # Save file
    doc_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(settings.UPLOAD_DIR, f"{doc_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        f.write(content)

    try:
        result = rag_service.process_and_index_document(file_path, doc_id, file.filename)
        return {
            "success": True,
            "message": f"Document '{file.filename}' uploaded and indexed successfully.",
            "doc_id": doc_id,
            "chunks_indexed": result["chunk_count"],
            "filename": file.filename
        }
    except Exception as e:
        # Clean up file on error
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.get("/list")
def list_documents():
    """List all uploaded documents."""
    docs = rag_service.list_documents()
    return {"documents": docs, "count": len(docs)}


@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    """Delete a document and its index."""
    success = rag_service.delete_document(doc_id)
    if success:
        return {"success": True, "message": f"Document {doc_id} deleted."}
    raise HTTPException(status_code=404, detail="Document not found.")
