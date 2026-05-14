'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Building2, Mail } from 'lucide-react'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('clients')
        .select('id, full_name, company, email, phone')
        .or(`full_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6)
      setResults(data ?? [])
      setOpen(true)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    setQuery('')
    setOpen(false)
    setResults([])
    router.push(`/clients/${id}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#555570' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
          placeholder="Search clients by name, email, phone..."
          className="w-full bg-[#0a0a0f] text-white border border-[#1e1e2e] rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); setResults([]) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#1e1e2e] transition-colors"
          >
            <X size={12} style={{ color: '#555570' }} />
          </button>
        )}
      </div>

      {open && query && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ background: '#111118', border: '1px solid #1e1e2e' }}
        >
          {loading ? (
            <div className="px-4 py-3 text-xs" style={{ color: '#8888aa' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs" style={{ color: '#8888aa' }}>No clients found for &ldquo;{query}&rdquo;</div>
          ) : (
            results.map((client, i) => (
              <button
                key={client.id}
                onClick={() => handleSelect(client.id)}
                className="w-full text-left px-4 py-3 hover:bg-[#1a1a28] transition-colors"
                style={{ borderBottom: i < results.length - 1 ? '1px solid #1e1e2e' : 'none' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#0066FF' }}
                  >
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{client.full_name}</div>
                    <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                      {client.company && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#8888aa' }}>
                          <Building2 size={10} /> {client.company}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#8888aa' }}>
                          <Mail size={10} /> {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
