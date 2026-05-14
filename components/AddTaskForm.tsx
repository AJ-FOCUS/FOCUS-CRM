'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'
import { TaskPriority, Profile } from '@/lib/types'

interface Props {
  profiles: Pick<Profile, 'id' | 'full_name'>[]
  clientId?: string
  clients?: { id: string; full_name: string }[]
}

const inputClass =
  'w-full bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]'

export default function AddTaskForm({ profiles, clientId, clients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: '',
    client_id: clientId ?? '',
    priority: 'medium' as TaskPriority,
  })

  function reset() {
    setForm({ title: '', description: '', due_date: '', assigned_to: '', client_id: clientId ?? '', priority: 'medium' })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      client_id: form.client_id || null,
      priority: form.priority,
      status: 'pending',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setOpen(false)
      reset()
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: '#0066FF' }}
      >
        <Plus size={16} /> Add Task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-[#8888aa] mb-1">Task Title *</label>
          <input
            className={inputClass}
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Send revised proposal"
          />
        </div>

        {!clientId && clients && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#8888aa] mb-1">Client</label>
            <select
              className={inputClass}
              value={form.client_id}
              onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
            >
              <option value="">No client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-[#8888aa] mb-1">Priority</label>
          <select
            className={inputClass}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#8888aa] mb-1">Due Date</label>
          <input
            type="date"
            className={inputClass}
            value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-[#8888aa] mb-1">Assign To</label>
          <select
            className={inputClass}
            value={form.assigned_to}
            onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-[#8888aa] mb-1">Description</label>
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Optional details..."
          />
        </div>
      </div>

      {error && <p className="text-xs" style={{ color: '#ff4444' }}>{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor: '#1e1e2e', color: '#8888aa' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#0066FF' }}
        >
          {loading ? 'Saving...' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}
