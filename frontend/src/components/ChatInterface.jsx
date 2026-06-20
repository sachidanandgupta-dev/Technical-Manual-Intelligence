import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export default function ChatInterface({ doc }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I've loaded **"${doc.filename}"** with ${doc.chunk_count} indexed chunks.\n\nAsk me anything about this technical manual, and I'll find the most relevant information for you! 🤖`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef()

  useEffect(() => {
    // Load suggestions
    axios.get(`/api/chat/history/${doc.doc_id}`)
      .then(res => setSuggestions(res.data.suggestions))
      .catch(() => {})
  }, [doc.doc_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (question) => {
    const q = question || input.trim()
    if (!q) return

    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post('/api/chat/ask', {
        doc_id: doc.doc_id,
        question: q,
        chat_history: history
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        context_used: res.data.context_used
      }])
    } catch (err) {
      toast.error('Failed to get answer. Check your API key.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to process your question. Please check the backend and API key.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Doc info bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">📄</div>
        <div>
          <p className="text-white font-medium text-sm">{doc.filename}</p>
          <p className="text-slate-400 text-xs">{doc.chunk_count} chunks • Doc ID: {doc.doc_id}</p>
        </div>
        <div className="ml-auto text-xs bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-800">
          ● Active
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-200'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none prose-custom">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-3 text-xs">
                  <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                    📑 View source chunks ({msg.context_used} retrieved)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {msg.sources.map((src, j) => (
                      <div key={j} className="bg-slate-700/50 rounded-lg p-2 text-slate-300 text-xs">
                        <span className="text-blue-400 font-medium">Chunk {j + 1}:</span> {src.slice(0, 200)}...
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                <span className="text-slate-400 text-xs ml-2">Searching document...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)}
              className="text-xs bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 px-3 py-1.5 rounded-full transition">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl flex items-end gap-3 p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about this manual..."
          rows={1}
          disabled={loading}
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none text-sm py-1 max-h-32 scrollbar-thin"
          style={{ minHeight: '24px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-medium transition shrink-0"
        >
          {loading ? '...' : 'Ask ↵'}
        </button>
      </div>
    </div>
  )
}
