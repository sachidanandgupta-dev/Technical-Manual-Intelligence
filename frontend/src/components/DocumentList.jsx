import axios from 'axios'
import toast from 'react-hot-toast'

export default function DocumentList({ docs, setDocs, onSelect }) {
  const handleDelete = async (e, doc_id) => {
    e.stopPropagation()
    try {
      await axios.delete(`/api/documents/${doc_id}`)
      setDocs(prev => prev.filter(d => d.doc_id !== doc_id))
      toast.success('Document deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  if (docs.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">📂</div>
        <p className="text-slate-400">No documents uploaded yet.</p>
        <p className="text-slate-500 text-sm mt-1">Upload a PDF to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {docs.map(doc => (
        <div key={doc.doc_id}
          onClick={() => onSelect(doc)}
          className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl p-4 cursor-pointer transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-2xl shrink-0">📄</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{doc.filename}</p>
            <p className="text-slate-400 text-xs mt-0.5">{doc.chunk_count} chunks indexed • ID: {doc.doc_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-sm opacity-0 group-hover:opacity-100 transition">Chat →</span>
            <button onClick={(e) => handleDelete(e, doc.doc_id)}
              className="text-slate-500 hover:text-red-400 transition text-sm px-2 py-1 rounded">
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
