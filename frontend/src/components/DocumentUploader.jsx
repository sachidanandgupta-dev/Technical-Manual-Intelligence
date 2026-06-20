import { useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function DocumentUploader({ onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef()

  const uploadFile = async (file) => {
    if (!file.name.endsWith('.pdf')) {
      toast.error('Only PDF files are supported!')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    setProgress('Uploading PDF...')

    try {
      setProgress('Processing & indexing chunks...')
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`✅ "${file.name}" indexed with ${res.data.chunks_indexed} chunks!`)
      onUploaded({ doc_id: res.data.doc_id, filename: file.name, chunk_count: res.data.chunks_indexed })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed!')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileRef.current.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all
        ${dragging ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600 bg-slate-800 hover:border-blue-500 hover:bg-slate-750'}
        ${uploading ? 'cursor-not-allowed opacity-70' : ''}
      `}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} />

      <div className="text-center">
        {uploading ? (
          <>
            <div className="text-4xl mb-3 animate-pulse">⚙️</div>
            <p className="text-blue-400 font-medium">{progress}</p>
            <p className="text-slate-500 text-sm mt-1">Please wait...</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-slate-200 font-semibold text-lg">Drop your PDF here</p>
            <p className="text-slate-400 text-sm mt-1">or click to browse</p>
            <p className="text-slate-500 text-xs mt-3">Supports PDF files up to 50MB</p>
          </>
        )}
      </div>
    </div>
  )
}
