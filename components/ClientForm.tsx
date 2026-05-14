'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, ClientStatus, Profile, ServiceType } from '@/lib/types'

const services: { value: ServiceType; label: string }[] = [
  { value: 'websites', label: 'Websites' },
  { value: 'automation', label: 'Automation' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
]

interface Props {
  profiles: Pick<Profile, 'id' | 'full_name'>[]
  client?: Client
}

export default function ClientForm({ profiles, client }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: client?.full_name ?? '',
    company: client?.company ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    instagram: client?.instagram ?? '',
    tiktok: client?.tiktok ?? '',
    linkedin: client?.linkedin ?? '',
    twitter: client?.twitter ?? '',
    services_interested: client?.services_interested ?? [] as ServiceType[],
    notes: client?.notes ?? '',
    assigned_to: client?.assigned_to ?? '',
    status: client?.status ?? 'lead' as ClientStatus,
  })

  function toggleService(service: ServiceType) {
    setForm(f => ({
      ...f,
      services_interested: f.services_interested.includes(service)
        ? f.services_interested.filter(s => s !== service)
        : [...f.services_interested, service],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      assigned_to: form.assigned_to || null,
      company: form.company || null,
      email: form.email || null,
      phone: form.phone || null,
      instagram: form.instagram || null,
      tiktok: form.tiktok || null,
      linkedin: form.linkedin || null,
      twitter: form.twitter || null,
      notes: form.notes || null,
    }

    let result
    if (client) {
      result = await supabase.from('clients').update(payload).eq('id', client.id).select().single()
    } else {
      result = await supabase.from('clients').insert(payload).select().single()
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      router.push(`/clients/${result.data.id}`)
      router.refresh()
    }
  }

  const inputClass = "w-full bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl p-6 space-y-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Basic Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Full Name *</label>
            <input className={inputClass} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required placeholder="Jane Smith" />
          </div>
          <div>
            <label>Company</label>
            <input className={inputClass} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Ltd" />
          </div>
          <div>
            <label>Email</label>
            <input className={inputClass} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@acme.com" />
          </div>
          <div>
            <label>Phone</label>
            <input className={inputClass} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+44 7700 900000" />
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6 space-y-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Social Media</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Instagram</label>
            <input className={inputClass} value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@username" />
          </div>
          <div>
            <label>TikTok</label>
            <input className={inputClass} value={form.tiktok} onChange={e => setForm(f => ({ ...f, tiktok: e.target.value }))} placeholder="@username" />
          </div>
          <div>
            <label>LinkedIn</label>
            <input className={inputClass} value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/username" />
          </div>
          <div>
            <label>Twitter / X</label>
            <input className={inputClass} value={form.twitter} onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))} placeholder="@username" />
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6 space-y-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Services Interested In</h2>
        <div className="flex flex-wrap gap-2">
          {services.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleService(value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all border"
              style={{
                background: form.services_interested.includes(value) ? 'rgba(0,102,255,0.2)' : '#0f0f1a',
                borderColor: form.services_interested.includes(value) ? '#0066FF' : '#1e1e2e',
                color: form.services_interested.includes(value) ? '#0066FF' : '#8888aa',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-6 space-y-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">CRM Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Status</label>
            <select className={inputClass} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label>Assigned To</label>
            <select className={inputClass} value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
              <option value="">Unassigned</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label>Personal Notes</label>
          <textarea
            className={inputClass}
            rows={4}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Personality, communication style, interests, how they prefer to be contacted..."
          />
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: '#ff4444' }}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all"
          style={{ borderColor: '#1e1e2e', color: '#8888aa' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: '#0066FF' }}
        >
          {loading ? 'Saving...' : client ? 'Save Changes' : 'Create Client'}
        </button>
      </div>
    </form>
  )
}
