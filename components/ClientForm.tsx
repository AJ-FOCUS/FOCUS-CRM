'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Client, ClientSource, ClientStatus, ClientTag, Profile, ServiceType } from '@/lib/types'

const services: { value: ServiceType; label: string }[] = [
  { value: 'websites', label: 'Websites' },
  { value: 'automation', label: 'Automation' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
]

const ALL_TAGS: ClientTag[] = ['Hot Lead', 'Follow Up', 'VIP', 'Cold Lead', 'Active Client', 'Inactive']

const tagColors: Record<ClientTag, { border: string; text: string; activeBg: string }> = {
  'Hot Lead': { border: '#ff4444', text: '#ff4444', activeBg: 'rgba(255,68,68,0.15)' },
  'Follow Up': { border: '#ffaa00', text: '#ffaa00', activeBg: 'rgba(255,170,0,0.15)' },
  'VIP': { border: '#a050ff', text: '#a050ff', activeBg: 'rgba(160,80,255,0.15)' },
  'Cold Lead': { border: '#8888aa', text: '#8888aa', activeBg: 'rgba(136,136,170,0.15)' },
  'Active Client': { border: '#00cc66', text: '#00cc66', activeBg: 'rgba(0,204,102,0.15)' },
  'Inactive': { border: '#555570', text: '#555570', activeBg: 'rgba(85,85,112,0.15)' },
}

const sources: ClientSource[] = ['Referral', 'TikTok', 'Instagram', 'Facebook', 'Google', 'Cold Outreach', 'Website', 'Other']

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
    tags: client?.tags ?? [] as ClientTag[],
    next_action_description: client?.next_action_description ?? '',
    next_action_date: client?.next_action_date ?? '',
    source: client?.source ?? '' as ClientSource | '',
    website_url: client?.website_url ?? '',
  })

  function toggleService(service: ServiceType) {
    setForm(f => ({
      ...f,
      services_interested: f.services_interested.includes(service)
        ? f.services_interested.filter(s => s !== service)
        : [...f.services_interested, service],
    }))
  }

  function toggleTag(tag: ClientTag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag],
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
      next_action_description: form.next_action_description || null,
      next_action_date: form.next_action_date || null,
      source: form.source || null,
      website_url: form.website_url || null,
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
          <div className="sm:col-span-2">
            <label>Website URL</label>
            <input className={inputClass} type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://example.com" />
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
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Labels</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map(tag => {
            const active = form.tags.includes(tag)
            const c = tagColors[tag]
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                style={{
                  background: active ? c.activeBg : '#0f0f1a',
                  borderColor: active ? c.border : '#1e1e2e',
                  color: active ? c.text : '#8888aa',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl p-6 space-y-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Next Action</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Description</label>
            <input
              className={inputClass}
              value={form.next_action_description}
              onChange={e => setForm(f => ({ ...f, next_action_description: e.target.value }))}
              placeholder="e.g. Send proposal"
            />
          </div>
          <div>
            <label>Date</label>
            <input
              className={inputClass}
              type="date"
              value={form.next_action_date}
              onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))}
            />
          </div>
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
            <label>How did they find us?</label>
            <select className={inputClass} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as ClientSource | '' }))}>
              <option value="">— Select source —</option>
              {sources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
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
