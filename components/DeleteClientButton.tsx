'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
}

export default function DeleteClientButton({ clientId, clientName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    setLoading(true)
    await supabase.from('interactions').delete().eq('client_id', clientId)
    await supabase.from('deals').delete().eq('client_id', clientId)
    await supabase.from('clients').delete().eq('id', clientId)
    router.push('/clients')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: '#8888aa' }}>Delete {clientName}?</span>
        <button onClick={handleDelete} disabled={loading} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#ff4444' }}>
          {loading ? '...' : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirming(false)} className="px-3 py-2 rounded-lg text-xs border" style={{ borderColor: '#1e1e2e', color: '#8888aa' }}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-[#1a1a28]"
      style={{ borderColor: '#1e1e2e', color: '#ff4444' }}
    >
      <Trash2 size={14} />
    </button>
  )
}
