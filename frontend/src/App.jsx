import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import DocumentUploader from './components/DocumentUploader'
import ChatInterface from './components/ChatInterface'
import DocumentList from './components/DocumentList'

export default function App() {
  const [activeDoc, setActiveDoc] = useState(null)
  const [docs, setDocs] = useState([])
  const [view, setView] = useState('home') // 'home' | 'chat'

  const handleDocSelected = (doc) => {
    setActiveDoc(doc)
    setView('chat')
  }

  const handleBack = () => {
    setView('home')
    setActiveDoc(null)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }
      }}/>

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">📚</div>
          <div>
            <h1 className="text-xl font-bold text-white">Technical Manual Intelligence</h1>
            <p className="text-xs text-slate-400">RAG-powered Document Q&A System</p>
          </div>
          {view === 'chat' && (
            <button onClick={handleBack}
              className="ml-auto bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition">
              ← Back to Documents
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {view === 'home' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Panel */}
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Upload Technical Manual</h2>
              <DocumentUploader onUploaded={(doc) => setDocs(prev => [...prev, doc])} />
            </div>

            {/* Documents Panel */}
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Uploaded Documents</h2>
              <DocumentList
                docs={docs}
                setDocs={setDocs}
                onSelect={handleDocSelected}
              />
            </div>

            {/* How it works */}
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-base font-semibold text-slate-200 mb-4">🔧 How It Works (RAG Pipeline)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: '1', icon: '📄', title: 'PDF Upload', desc: 'Upload any technical PDF manual (up to 50MB)' },
                  { step: '2', icon: '✂️', title: 'Chunking', desc: 'Document is split into overlapping text chunks' },
                  { step: '3', icon: '🧮', title: 'Embedding', desc: 'Chunks embedded via SentenceTransformer & stored in ChromaDB' },
                  { step: '4', icon: '🤖', title: 'RAG + Claude', desc: 'Your query retrieves top chunks → Claude generates answer' },
                ].map(item => (
                  <div key={item.step} className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs font-bold text-blue-400 mb-1">Step {item.step}</div>
                    <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ChatInterface doc={activeDoc} />
        )}
      </main>
    </div>
  )
}
