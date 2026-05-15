'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MessageSquare, ClipboardList, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InteractionType, TaskPriority } from '@/lib/types'
import { format } from 'date-fns'

export type QuickAction = 'interaction' | 'task' | 'note'

export interface QuickClient {
  id: string
  full_name: string
  notes: string | null
}

interface Props {
  client: QuickClient
  action: QuickAction
  profiles: { id: string; full_name: string }[]
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

const IC = 'w-full bg-[#0a0a0f] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]'

const TYPES: { value: InteractionType; label: string }[] = [
  { value: 'call',      label: 'Call' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'email',     label: 'Email' },
  { value: 'meeting',   label: 'Meeting' },
  { value: 'zoom',      label: 'Zoom' },
  { value: 'other',     label: 'Other' },
]

const TABS: { action: QuickAction; label: string; Icon: typeof MessageSquare }[] = [
  { action: 'interaction', label: 'Log Interaction', Icon: MessageSquare },
  { action: 'task',        label: 'Add Task',        Icon: ClipboardList },
  { action: 'note',        label: 'Add Note',        Icon: FileText },
]

export default function QuickActionsModal({
  client,
  action: initial,
  profiles,
  currentUserId,
  onClose,
  onSaved,
}: Props) {
  const supabase = createClient()
  const backdropRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<QuickAction>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const [interaction, setInteraction] = useState({
    type: 'call' as InteractionType,
    date: localISO,
    handled_by: currentUserId,
    notes: '',
  })

  const [task, setTask] = useState({
    title: '',
    due_date: '',
    priority: 'medium' as TaskPriority,
    assigned_to: currentUserId,
  })

  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let err: { message: string } | null = null

    if (tab === 'interaction') {
      const { error: e } = await supabase.from('interactions').insert({
        client_id: client.id,
        type: interaction.type,
        date: new Date(interaction.date).toISOString(),
        handled_by: interaction.handled_by || null,
        notes: interaction.notes,
      })
      err = e
    } else if (tab === 'task') {
      const { error: e } = await supabase.from('tasks').insert({
        title: task.title,
        client_id: client.id,
        assigned_to: task.assigned_to || null,
        due_date: task.due_date || null,
        priority: task.priority,
        status: 'pending',
      })
      err = e
    } else {
      const stamp = format(new Date(), 'd MMM yyyy')
      const updated = client.notes
        ? `${client.notes}\n\n${stamp}: ${noteText}`
        : `${stamp}: ${noteText}`
      const { error: e } = await supabase
        .from('clients')
        .update({ notes: updated })
        .eq('id', client.id)
      err = e
    }

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      onSaved()
      onClose()
    }
  }

  const tabLabel = TABS.find(t => t.action === tab)!.label

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          background: '#111118',
          border: '1px solid #1e1e2e',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #1e1e2e', background: '#0d0d14' }}
        >
          <div>
            <p className="text-xs font-medium" style={{ color: '#8888aa' }}>{client.full_name}</p>
            <p className="text-sm font-semibold text-white">{tabLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#1e1e2e]"
            style={{ color: '#555570' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #1e1e2e', background: '#0d0d14' }}>
          {TABS.map(({ action: a, label, Icon }) => (
            <button
              key={a}
              onClick={() => { setTab(a); setError('') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
              style={{
                color: tab === a ? '#0066FF' : '#555570',
                borderBottom: tab === a ? '2px solid #0066FF' : '2px solid transparent',
              }}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {tab === 'interaction' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Type</label>
                  <select className={IC} value={interaction.type} onChange={e => setInteraction(f => ({ ...f, type: e.target.value as InteractionType }))}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Date & Time</label>
                  <input type="datetime-local" className={IC} value={interaction.date} onChange={e => setInteraction(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Handled By</label>
                <select className={IC} value={interaction.handled_by} onChange={e => setInteraction(f => ({ ...f, handled_by: e.target.value }))}>
                  <option value="">Select member</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Notes *</label>
                <textarea className={IC} rows={3} required value={interaction.notes} onChange={e => setInteraction(f => ({ ...f, notes: e.target.value }))} placeholder="What was discussed?" />
              </div>
            </>
          )}

          {tab === 'task' && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Task Title *</label>
                <input className={IC} required value={task.title} onChange={e => setTask(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Send revised proposal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Priority</label>
                  <select className={IC} value={task.priority} onChange={e => setTask(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Due Date</label>
                  <input type="date" className={IC} value={task.due_date} onChange={e => setTask(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Assign To</label>
                <select className={IC} value={task.assigned_to} onChange={e => setTask(f => ({ ...f, assigned_to: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
            </>
          )}

          {tab === 'note' && (
            <div>
              <label className="block text-xs mb-1" style={{ color: '#8888aa' }}>Note *</label>
              <textarea className={IC} rows={5} required value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note about this client..." />
              <p className="text-xs mt-1.5" style={{ color: '#555570' }}>
                Appended to client notes with today's date.
              </p>
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#ff4444' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm border transition-colors hover:bg-[#1a1a28]"
              style={{ borderColor: '#1e1e2e', color: '#8888aa' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: '#0066FF' }}
            >
              {loading ? 'Saving…' : tabLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
