import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { CheckSquare, AlertCircle, User } from 'lucide-react'
import { PriorityBadge } from '@/components/Badge'
import TaskCompleteButton from '@/components/TaskCompleteButton'
import AddTaskForm from '@/components/AddTaskForm'
import { TaskPriority, TaskStatus } from '@/lib/types'

function filterHref(
  current: { status: string; priority: string; assigned_to: string },
  updates: Record<string, string>
) {
  const merged = { ...current, ...updates }
  const qs = Object.entries(merged)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return qs ? `/tasks?${qs}` : '/tasks'
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; assigned_to?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const statusFilter = params.status || ''
  const priorityFilter = params.priority || ''
  const assignedToFilter = params.assigned_to || ''
  const filters = { status: statusFilter, priority: priorityFilter, assigned_to: assignedToFilter }

  let query = supabase
    .from('tasks')
    .select('*, profiles(full_name), clients(id, full_name)')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (priorityFilter) query = query.eq('priority', priorityFilter)
  if (assignedToFilter) query = query.eq('assigned_to', assignedToFilter)

  const [{ data: tasks }, { data: profiles }, { data: clients }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('clients').select('id, full_name').order('full_name'),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allTasks = tasks ?? []
  const overdueCount = allTasks.filter(
    t => t.status === 'pending' && t.due_date && new Date(t.due_date + 'T00:00:00') < today
  ).length

  const statuses: [string, string][] = [['', 'All'], ['pending', 'Pending'], ['complete', 'Complete']]
  const priorities: [string, string][] = [['', 'Any'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
            {allTasks.length} task{allTasks.length !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <> &middot; <span style={{ color: '#ff4444' }}>{overdueCount} overdue</span></>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Status */}
        <div className="flex gap-1.5">
          {statuses.map(([v, l]) => (
            <Link
              key={v}
              href={filterHref(filters, { status: v })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: statusFilter === v ? '#0066FF' : '#1e1e2e',
                color: statusFilter === v ? 'white' : '#8888aa',
              }}
            >
              {l}
            </Link>
          ))}
        </div>

        {/* Priority */}
        <div className="flex gap-1.5">
          {priorities.map(([v, l]) => (
            <Link
              key={v}
              href={filterHref(filters, { priority: v })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: priorityFilter === v ? '#0066FF' : '#1e1e2e',
                color: priorityFilter === v ? 'white' : '#8888aa',
              }}
            >
              {l}
            </Link>
          ))}
        </div>

        {/* Assignee */}
        <form method="GET" className="flex items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {priorityFilter && <input type="hidden" name="priority" value={priorityFilter} />}
          <select
            name="assigned_to"
            defaultValue={assignedToFilter}
            className="bg-[#1e1e2e] text-white rounded-lg px-3 py-1.5 text-xs outline-none border border-[#1e1e2e] focus:border-[#0066FF] transition-colors"
          >
            <option value="">All members</option>
            {(profiles ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#1e1e2e', color: '#8888aa' }}
          >
            Apply
          </button>
          {assignedToFilter && (
            <Link
              href={filterHref(filters, { assigned_to: '' })}
              className="text-xs"
              style={{ color: '#555570' }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Add Task */}
      <div className="rounded-xl p-4 mb-4" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <AddTaskForm profiles={profiles ?? []} clients={clients ?? []} />
      </div>

      {/* Task List */}
      {!allTasks.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <CheckSquare size={32} className="mx-auto mb-3" style={{ color: '#1e1e2e' }} />
          <p className="text-sm" style={{ color: '#8888aa' }}>No tasks found.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div className="divide-y divide-[#1e1e2e]">
            {allTasks.map((task: any) => {
              const isOverdue =
                task.status === 'pending' &&
                task.due_date &&
                new Date(task.due_date + 'T00:00:00') < today
              const isDone = task.status === 'complete'

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#13131f]"
                  style={isOverdue ? { borderLeft: '3px solid #ff4444' } : {}}
                >
                  <TaskCompleteButton taskId={task.id} status={task.status} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={task.priority as TaskPriority} />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: isDone ? '#555570' : 'white',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.clients && (
                        <Link
                          href={`/clients/${task.clients.id}`}
                          className="text-xs hover:underline"
                          style={{ color: '#0066FF' }}
                        >
                          {task.clients.full_name}
                        </Link>
                      )}
                      {task.description && (
                        <span className="text-xs truncate max-w-xs" style={{ color: '#555570' }}>
                          {task.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    {task.due_date && (
                      <div
                        className="text-xs font-medium flex items-center gap-1"
                        style={{ color: isOverdue ? '#ff4444' : '#8888aa' }}
                      >
                        {isOverdue && <AlertCircle size={11} />}
                        {format(new Date(task.due_date + 'T00:00:00'), 'd MMM yyyy')}
                        {isOverdue && <span className="hidden sm:inline"> (overdue)</span>}
                      </div>
                    )}
                    {task.profiles?.full_name ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
                        style={{ background: '#1e1e2e', color: '#8888aa' }}
                      >
                        {task.profiles.full_name.split(' ')[0]}
                      </span>
                    ) : (
                      <User size={14} className="hidden sm:block" style={{ color: '#2a2a3a' }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
