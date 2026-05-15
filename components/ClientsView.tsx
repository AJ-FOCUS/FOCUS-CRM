'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Plus, ChevronRight, Building2, Phone, Mail, AlertCircle, Globe,
  LayoutList, Table2, ChevronUp, ChevronDown, ChevronsUpDown,
  MessageSquare, ClipboardList, FileText,
} from 'lucide-react'
import { StatusBadge, ServiceBadge, TagBadge } from '@/components/Badge'
import { ClientStatus, ClientTag } from '@/lib/types'
import QuickActionsModal, { QuickAction, QuickClient } from '@/components/QuickActionsModal'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

type EnrichedClient = {
  id: string
  full_name: string
  company: string | null
  email: string | null
  phone: string | null
  notes: string | null
  website_url: string | null
  status: ClientStatus
  assigned_to: string | null
  tags: ClientTag[]
  services_interested: string[]
  next_action_description: string | null
  next_action_date: string | null
  source: string | null
  created_at: string
  profiles: { full_name: string } | null
  wonValue: number
  lastInteractionDate: string | null
  lastInteractionType: string | null
}

type Filters = { search: string; status: string; assigned_to: string }

type SortCol =
  | 'full_name' | 'company' | 'industry' | 'wonValue'
  | 'contactMethod' | 'lastInteraction' | 'status' | 'assignedTo' | 'website'

type SortState = { col: SortCol; dir: 'asc' | 'desc' }

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTERACTION_LABELS: Record<string, string> = {
  call: 'Call', email: 'Email', meeting: 'Meeting',
  whatsapp: 'WhatsApp', zoom: 'Zoom', other: 'Other',
}

const VIEW_KEY = 'clients_view_pref'

function extractIndustry(notes: string | null): string {
  if (!notes) return ''
  return notes.startsWith('Industry: ') ? notes.slice(10).split('\n')[0] : ''
}

function ensureUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function waUrl(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function WhatsAppBtn({
  phone,
  stopProp = true,
}: {
  phone: string | null
  stopProp?: boolean
}) {
  const url = waUrl(phone)
  const base = 'p-1.5 rounded-lg flex items-center justify-center transition-colors'
  if (!url) {
    return (
      <span
        title="No phone number saved"
        className={`${base} cursor-not-allowed`}
        style={{ color: '#2a2a3a' }}
      >
        <WhatsAppIcon />
      </span>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Open WhatsApp"
      onClick={stopProp ? e => e.stopPropagation() : undefined}
      className={`${base} hover:bg-[#1e1e2e]`}
      style={{ color: '#25D366' }}
    >
      <WhatsAppIcon />
    </a>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof MessageSquare
  label: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={label}
      onClick={e => { e.stopPropagation(); onClick(e) }}
      className="p-1.5 rounded-lg flex items-center justify-center transition-colors hover:bg-[#1e1e2e]"
      style={{ color: '#555570' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#0066FF')}
      onMouseLeave={e => (e.currentTarget.style.color = '#555570')}
    >
      <Icon size={14} />
    </button>
  )
}

function sortClients(clients: EnrichedClient[], s: SortState): EnrichedClient[] {
  return [...clients].sort((a, b) => {
    let av: string | number = ''
    let bv: string | number = ''
    switch (s.col) {
      case 'full_name':       av = a.full_name.toLowerCase();                  bv = b.full_name.toLowerCase();                  break
      case 'company':         av = (a.company ?? '').toLowerCase();             bv = (b.company ?? '').toLowerCase();             break
      case 'industry':        av = extractIndustry(a.notes).toLowerCase();      bv = extractIndustry(b.notes).toLowerCase();      break
      case 'wonValue':        av = a.wonValue;                                   bv = b.wonValue;                                   break
      case 'contactMethod':   av = (a.lastInteractionType ?? '').toLowerCase(); bv = (b.lastInteractionType ?? '').toLowerCase(); break
      case 'lastInteraction': av = a.lastInteractionDate ?? '';                  bv = b.lastInteractionDate ?? '';                  break
      case 'status':          av = a.status;                                     bv = b.status;                                     break
      case 'assignedTo':      av = (a.profiles?.full_name ?? '').toLowerCase(); bv = (b.profiles?.full_name ?? '').toLowerCase(); break
      case 'website':         av = a.website_url ? 1 : 0;                       bv = b.website_url ? 1 : 0;                       break
    }
    if (av < bv) return s.dir === 'asc' ? -1 : 1
    if (av > bv) return s.dir === 'asc' ? 1 : -1
    return 0
  })
}

const TH: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: '#8888aa',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #1e1e2e',
  whiteSpace: 'nowrap',
  background: '#0d0d14',
  cursor: 'pointer',
  userSelect: 'none',
}

const TD: React.CSSProperties = {
  padding: '9px 12px',
  borderBottom: '1px solid #161622',
  verticalAlign: 'middle',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientsView({
  clients,
  profiles,
  filters,
}: {
  clients: EnrichedClient[]
  profiles: { id: string; full_name: string }[]
  filters: Filters
}) {
  const router = useRouter()

  const [view, setView] = useState<'card' | 'spreadsheet'>('card')
  const [mounted, setMounted] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [sort, setSort] = useState<SortState>({ col: 'full_name', dir: 'asc' })
  const [currentUserId, setCurrentUserId] = useState('')
  const [modal, setModal] = useState<{ client: QuickClient; action: QuickAction } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'spreadsheet' || saved === 'card') setView(saved)
    setMounted(true)
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? '')
    })
  }, [])

  function switchView(v: 'card' | 'spreadsheet') {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  function buildUrl(updates: Partial<Filters>): string {
    const merged = { ...filters, ...updates }
    const p = new URLSearchParams()
    if (merged.search) p.set('search', merged.search)
    if (merged.status) p.set('status', merged.status)
    if (merged.assigned_to) p.set('assigned_to', merged.assigned_to)
    const qs = p.toString()
    return qs ? `/clients?${qs}` : '/clients'
  }

  function toggleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
  }

  function openModal(client: EnrichedClient, action: QuickAction) {
    setModal({ client: { id: client.id, full_name: client.full_name, notes: client.notes }, action })
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sort.col !== col) return <ChevronsUpDown size={11} style={{ color: '#3a3a4a', flexShrink: 0 }} />
    return sort.dir === 'asc'
      ? <ChevronUp size={11} style={{ color: '#0066FF', flexShrink: 0 }} />
      : <ChevronDown size={11} style={{ color: '#0066FF', flexShrink: 0 }} />
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const display = view === 'spreadsheet' ? sortClients(clients, sort) : clients

  const COLS: { col: SortCol; label: string }[] = [
    { col: 'full_name',       label: 'Name' },
    { col: 'company',         label: 'Company' },
    { col: 'industry',        label: 'Industry' },
    { col: 'wonValue',        label: 'Deal Value' },
    { col: 'contactMethod',   label: 'Contact' },
    { col: 'lastInteraction', label: 'Last Interaction' },
    { col: 'status',          label: 'Status' },
    { col: 'assignedTo',      label: 'Assigned To' },
    { col: 'website',         label: 'Website' },
  ]

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>{clients.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          {mounted && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1e1e2e' }}>
              <button
                onClick={() => switchView('card')}
                title="Card view"
                className="p-2 transition-colors"
                style={{ background: view === 'card' ? '#0066FF' : '#111118', color: view === 'card' ? 'white' : '#555570' }}
              >
                <LayoutList size={15} />
              </button>
              <button
                onClick={() => switchView('spreadsheet')}
                title="Spreadsheet view"
                className="p-2 transition-colors"
                style={{ background: view === 'spreadsheet' ? '#0066FF' : '#111118', color: view === 'spreadsheet' ? 'white' : '#555570', borderLeft: '1px solid #1e1e2e' }}
              >
                <Table2 size={15} />
              </button>
            </div>
          )}
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#0066FF' }}
          >
            <Plus size={16} /> Add Client
          </Link>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <form
          className="flex gap-2 flex-1 min-w-0"
          onSubmit={e => { e.preventDefault(); router.push(buildUrl({ search: searchInput })) }}
        >
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name, company, email, phone..."
            className="flex-1 min-w-0 bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]"
          />
          <select
            value={filters.assigned_to}
            onChange={e => router.push(buildUrl({ assigned_to: e.target.value }))}
            className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors"
            style={{ color: filters.assigned_to ? 'white' : '#8888aa' }}
          >
            <option value="">All members</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </form>
        <div className="flex gap-2 flex-wrap">
          {(['', 'lead', 'active', 'inactive'] as const).map(s => (
            <Link
              key={s}
              href={buildUrl({ status: s })}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: filters.status === s || (!filters.status && !s) ? '#0066FF' : '#1e1e2e',
                color: filters.status === s || (!filters.status && !s) ? 'white' : '#8888aa',
              }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!clients.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <p className="text-sm" style={{ color: '#8888aa' }}>No clients found.</p>
          <Link href="/clients/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0066FF' }}>
            <Plus size={14} /> Add your first client
          </Link>
        </div>

      ) : view === 'spreadsheet' ? (
        /* ── SPREADSHEET ── */
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e1e2e' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
              <thead>
                <tr>
                  {COLS.map(({ col, label }) => (
                    <th key={col} style={TH} onClick={() => toggleSort(col)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {label} <SortIcon col={col} />
                      </div>
                    </th>
                  ))}
                  <th style={{ ...TH, cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {display.map((client, i) => {
                  const rowBg = i % 2 === 0 ? '#111118' : '#0d0d14'
                  const industry = extractIndustry(client.notes)
                  return (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      style={{ background: rowBg, cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#1a1a28')}
                      onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                    >
                      <td style={TD}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                            {client.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: 'white', whiteSpace: 'nowrap' }}>{client.full_name}</span>
                        </div>
                      </td>
                      <td style={TD}><span style={{ fontSize: '13px', color: client.company ? '#ccccdd' : '#3a3a4a' }}>{client.company ?? '—'}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: industry ? '#ccccdd' : '#3a3a4a' }}>{industry || '—'}</span></td>
                      <td style={TD}><span style={{ fontSize: '13px', fontWeight: '600', color: client.wonValue > 0 ? '#00cc66' : '#3a3a4a' }}>{client.wonValue > 0 ? `£${client.wonValue.toLocaleString()}` : '—'}</span></td>
                      {/* Contact: method label + WhatsApp icon */}
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', color: client.lastInteractionType ? '#ccccdd' : '#3a3a4a' }}>
                            {client.lastInteractionType ? (INTERACTION_LABELS[client.lastInteractionType] ?? client.lastInteractionType) : '—'}
                          </span>
                          <WhatsAppBtn phone={client.phone} />
                        </div>
                      </td>
                      <td style={TD}><span style={{ fontSize: '13px', color: client.lastInteractionDate ? '#8888aa' : '#3a3a4a' }}>{client.lastInteractionDate ? format(new Date(client.lastInteractionDate), 'd MMM yyyy') : '—'}</span></td>
                      <td style={TD}><StatusBadge status={client.status} /></td>
                      <td style={TD}><span style={{ fontSize: '13px', color: client.profiles?.full_name ? '#ccccdd' : '#3a3a4a' }}>{client.profiles?.full_name ?? 'Unassigned'}</span></td>
                      {/* Website */}
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        {client.website_url ? (
                          <a href={ensureUrl(client.website_url)} target="_blank" rel="noopener noreferrer" title={client.website_url}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#0066FF', textDecoration: 'none' }}>
                            <Globe size={13} style={{ flexShrink: 0 }} />
                            <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {client.website_url.replace(/^https?:\/\//, '')}
                            </span>
                          </a>
                        ) : <span style={{ color: '#2a2a3a' }}>—</span>}
                      </td>
                      {/* Quick actions */}
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <ActionBtn icon={MessageSquare} label="Log Interaction" onClick={() => openModal(client, 'interaction')} />
                          <ActionBtn icon={ClipboardList}  label="Add Task"        onClick={() => openModal(client, 'task')} />
                          <ActionBtn icon={FileText}       label="Add Note"        onClick={() => openModal(client, 'note')} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        /* ── CARD VIEW ── */
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div className="divide-y divide-[#1e1e2e]">
            {display.map(client => {
              const isOverdue = client.next_action_date
                ? new Date(client.next_action_date + 'T00:00:00') < today
                : false
              return (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-[#1a1a28] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: '#0066FF' }}>
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{client.full_name}</span>
                      <StatusBadge status={client.status} />
                      {client.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: '#8888aa' }}>
                      {client.company && <span className="flex items-center gap-1"><Building2 size={11} /> {client.company}</span>}
                      {client.email && <span className="flex items-center gap-1 hidden sm:flex"><Mail size={11} /> {client.email}</span>}
                      {client.website_url && (
                        <a href={ensureUrl(client.website_url)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="hidden sm:flex items-center gap-1 transition-colors hover:text-[#0066FF]">
                          <Globe size={11} /> {client.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                    {client.services_interested.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {client.services_interested.map(s => <ServiceBadge key={s} service={s as any} />)}
                      </div>
                    )}
                    {client.next_action_description && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <AlertCircle size={11} style={{ color: isOverdue ? '#ff4444' : '#555570', flexShrink: 0 }} />
                        <span className="text-xs truncate" style={{ color: isOverdue ? '#ff4444' : '#555570' }}>
                          {client.next_action_description}
                          {client.next_action_date && <> &middot; {format(new Date(client.next_action_date + 'T00:00:00'), 'd MMM yyyy')}{isOverdue && ' (overdue)'}</>}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick actions + WhatsApp */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <WhatsAppBtn phone={client.phone} />
                    <ActionBtn icon={MessageSquare} label="Log Interaction" onClick={() => openModal(client, 'interaction')} />
                    <ActionBtn icon={ClipboardList}  label="Add Task"        onClick={() => openModal(client, 'task')} />
                    <ActionBtn icon={FileText}       label="Add Note"        onClick={() => openModal(client, 'note')} />
                  </div>

                  {/* Assigned / date (desktop) */}
                  <div className="text-right flex-shrink-0 hidden lg:block">
                    <div className="text-xs" style={{ color: '#555570' }}>
                      {client.profiles?.full_name && <div>{client.profiles.full_name}</div>}
                      <div>{format(new Date(client.created_at), 'd MMM yyyy')}</div>
                    </div>
                  </div>

                  <ChevronRight size={15} style={{ color: '#555570' }} className="flex-shrink-0 group-hover:text-white transition-colors hidden sm:block" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Quick Actions Modal ── */}
      {modal && (
        <QuickActionsModal
          client={modal.client}
          action={modal.action}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  )
}
