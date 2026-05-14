'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DealStage, ServiceType } from '@/lib/types'
import { Plus } from 'lucide-react'

const stages: { value: DealStage; label: string }[] = [
  { value: 'new_enquiry', label: 'New Enquiry' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

const services: { value: ServiceType; label: string }[] = [
  { value: 'websites', label: 'Websites' },
  { value: 'automation', label: 'Automation' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
]

export default function AddDealForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    service_type: 'websites' as ServiceType,
    value: '',
    stage: 'new_enquiry' as DealStage,
    notes: '',
    expected_close_date: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('deals').insert({
      client_id: clientId,
      name: form.name,
      service_type: form.service_type,
      value: parseFloat(form.value) || 0,
      stage: form.stage,
      notes: form.notes || null,
      expected_close_date: form.expected_close_date || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setOpen(false)
      setForm({ name: '', service_type: 'websites', value: '', stage: 'new_enquiry', notes: '', expected_close_date: '' })
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
        <Plus size={16} /> Add Deal
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label>Deal Name *</label>
          <input className={inputClass} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Website Redesign" />
        </div>
        <div>
          <label>Service</label>
          <select className={inputClass} value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value as ServiceType }))}>
            {services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label>Value (£)</label>
          <input className={inputClass} type="number" min="0" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="2500" />
        </div>
        <div>
          <label>Stage</label>
          <select className={inputClass} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}>
            {stages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label>Expected Close</label>
          <input type="date" className={inputClass} value={form.expected_close_date} onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label>Notes</label>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context..." />
        </div>
      </div>
      {error && <p className="text-xs" style={{ color: '#ff4444' }}>{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: '#1e1e2e', color: '#8888aa' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#0066FF' }}>
          {loading ? 'Saving...' : 'Add Deal'}
        </button>
      </div>
    </form>
  )
}
