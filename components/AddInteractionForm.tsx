'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InteractionType, Profile } from '@/lib/types'
import { Plus, ChevronDown } from 'lucide-react'

const interactionTypes: { value: InteractionType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'other', label: 'Other' },
]

interface Props {
  clientId: string
  profiles: Pick<Profile, 'id' | 'full_name'>[]
  currentUserId: string
}

export default function AddInteractionForm({ clientId, profiles, currentUserId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const [form, setForm] = useState({
    type: 'call' as InteractionType,
    date: localISO,
    handled_by: currentUserId,
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('interactions').insert({
      client_id: clientId,
      type: form.type,
      date: new Date(form.date).toISOString(),
      handled_by: form.handled_by || null,
      notes: form.notes,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setOpen(false)
      setForm({ type: 'call', date: localISO, handled_by: currentUserId, notes: '' })
      router.refresh()
    }
  }

  const inputClass = "w-full bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]"

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: '#0066FF' }}
      >
        <Plus size={16} /> Log Interaction
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label>Type</label>
          <select className={inputClass} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as InteractionType }))}>
            {interactionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label>Date & Time</label>
          <input type="datetime-local" className={inputClass} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
      </div>
      <div>
        <label>Handled By</label>
        <select className={inputClass} value={form.handled_by} onChange={e => setForm(f => ({ ...f, handled_by: e.target.value }))}>
          <option value="">Select team member</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>
      <div>
        <label>Notes / Summary *</label>
        <textarea
          className={inputClass}
          rows={3}
          required
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="What was discussed?"
        />
      </div>
      {error && <p className="text-xs" style={{ color: '#ff4444' }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#1e1e2e', color: '#8888aa' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#0066FF' }}>
          {loading ? 'Saving...' : 'Log Interaction'}
        </button>
      </div>
    </form>
  )
}
