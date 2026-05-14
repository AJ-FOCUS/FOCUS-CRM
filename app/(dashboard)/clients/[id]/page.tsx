import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Edit, Building2, Mail, Phone, AtSign, Globe, Briefcase, AlertCircle, MapPin } from 'lucide-react'
import { StatusBadge, ServiceBadge, StageBadge, InteractionBadge, TagBadge } from '@/components/Badge'
import AddInteractionForm from '@/components/AddInteractionForm'
import AddDealForm from '@/components/AddDealForm'
import AddTaskForm from '@/components/AddTaskForm'
import TaskCompleteButton from '@/components/TaskCompleteButton'
import DeleteClientButton from '@/components/DeleteClientButton'
import { PriorityBadge } from '@/components/Badge'
import { ClientTag, ServiceType, TaskPriority } from '@/lib/types'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: client },
    { data: interactions },
    { data: deals },
    { data: profiles },
    { data: tasks },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('clients').select('*, profiles(full_name)').eq('id', id).single(),
    supabase.from('interactions').select('*, profiles(full_name)').eq('client_id', id).order('date', { ascending: false }),
    supabase.from('deals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('tasks').select('*, profiles(full_name)').eq('client_id', id).order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  if (!client) notFound()

  const totalDealValue = deals?.filter(d => d.stage === 'won').reduce((sum, d) => sum + d.value, 0) ?? 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const pendingTasks = (tasks ?? []).filter(t => t.status === 'pending')
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date + 'T00:00:00') < today)
  const isOverdue = client.next_action_date
    ? new Date(client.next_action_date + 'T00:00:00') < today
    : false

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/clients" className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors" style={{ color: '#8888aa' }}>
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{client.full_name}</h1>
            <StatusBadge status={client.status} />
            {(client.tags ?? []).map((tag: ClientTag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
          {client.company && (
            <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: '#8888aa' }}>
              <Building2 size={13} /> {client.company}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-[#1a1a28]"
            style={{ borderColor: '#1e1e2e', color: '#8888aa' }}
          >
            <Edit size={14} /> Edit
          </Link>
          <DeleteClientButton clientId={id} clientName={client.full_name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8888aa' }}>Contact</h3>
            <div className="space-y-3">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-white hover:text-[#0066FF] transition-colors">
                  <Mail size={14} style={{ color: '#555570' }} /> {client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-white hover:text-[#0066FF] transition-colors">
                  <Phone size={14} style={{ color: '#555570' }} /> {client.phone}
                </a>
              )}
              {client.instagram && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <AtSign size={14} style={{ color: '#555570' }} />
                  <span className="text-xs text-[#555570] mr-1">IG</span>{client.instagram}
                </div>
              )}
              {client.tiktok && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Globe size={14} style={{ color: '#555570' }} />
                  <span className="text-xs text-[#555570] mr-1">TT</span>{client.tiktok}
                </div>
              )}
              {client.linkedin && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Briefcase size={14} style={{ color: '#555570' }} /> {client.linkedin}
                </div>
              )}
              {client.twitter && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <AtSign size={14} style={{ color: '#555570' }} />
                  <span className="text-xs text-[#555570] mr-1">X</span>{client.twitter}
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {client.services_interested?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8888aa' }}>Services</h3>
              <div className="flex flex-wrap gap-2">
                {client.services_interested.map((s: ServiceType) => (
                  <ServiceBadge key={s} service={s} />
                ))}
              </div>
            </div>
          )}

          {/* CRM Info */}
          <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8888aa' }}>CRM Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#8888aa' }}>Assigned to</span>
                <span className="text-white">{(client as any).profiles?.full_name ?? 'Unassigned'}</span>
              </div>
              {client.source && (
                <div className="flex justify-between">
                  <span style={{ color: '#8888aa' }}>Source</span>
                  <span className="text-white flex items-center gap-1.5">
                    <MapPin size={12} style={{ color: '#555570' }} /> {client.source}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: '#8888aa' }}>Date added</span>
                <span className="text-white">{format(new Date(client.created_at), 'd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#8888aa' }}>Deals won</span>
                <span className="text-white font-semibold">£{totalDealValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Next Action */}
          {(client.next_action_description || client.next_action_date) && (
            <div
              className="rounded-xl p-5"
              style={{
                background: isOverdue ? 'rgba(255,68,68,0.08)' : '#111118',
                border: `1px solid ${isOverdue ? 'rgba(255,68,68,0.3)' : '#1e1e2e'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={13} style={{ color: isOverdue ? '#ff4444' : '#8888aa' }} />
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: isOverdue ? '#ff4444' : '#8888aa' }}>
                  Next Action{isOverdue ? ' — Overdue' : ''}
                </h3>
              </div>
              <div className="space-y-1">
                {client.next_action_description && (
                  <p className="text-sm text-white">{client.next_action_description}</p>
                )}
                {client.next_action_date && (
                  <p className="text-xs" style={{ color: isOverdue ? '#ff6666' : '#8888aa' }}>
                    Due: {format(new Date(client.next_action_date + 'T00:00:00'), 'd MMMM yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8888aa' }}>Notes</h3>
              <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Right column - Timeline + Deals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <div className="rounded-xl" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-white">Tasks</h2>
                {overdueTasks.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}>
                    {overdueTasks.length} overdue
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: '#555570' }}>
                {pendingTasks.length} pending
              </span>
            </div>

            {tasks && tasks.length > 0 && (
              <div className="divide-y divide-[#1e1e2e]">
                {tasks.map((task: any) => {
                  const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date + 'T00:00:00') < today
                  const isDone = task.status === 'complete'
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-5 py-3"
                      style={isOverdue ? { borderLeft: '3px solid #ff4444' } : {}}
                    >
                      <TaskCompleteButton taskId={task.id} status={task.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={task.priority as TaskPriority} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: isDone ? '#555570' : 'white', textDecoration: isDone ? 'line-through' : 'none' }}
                          >
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#555570' }}>{task.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {task.due_date && (
                          <div className="text-xs" style={{ color: isOverdue ? '#ff4444' : '#555570' }}>
                            {format(new Date(task.due_date + 'T00:00:00'), 'd MMM yyyy')}
                          </div>
                        )}
                        {task.profiles?.full_name && (
                          <div className="text-xs mt-0.5" style={{ color: '#555570' }}>{task.profiles.full_name}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="px-5 py-4 border-t border-[#1e1e2e]">
              <AddTaskForm clientId={id} profiles={profiles ?? []} />
            </div>
          </div>

          {/* Deals */}
          <div className="rounded-xl" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="px-5 py-4 border-b border-[#1e1e2e]">
              <h2 className="font-semibold text-white">Deals</h2>
            </div>

            {deals && deals.length > 0 && (
              <div className="divide-y divide-[#1e1e2e]">
                {deals.map((deal: any) => (
                  <div key={deal.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">{deal.name}</span>
                          <StageBadge stage={deal.stage} />
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: '#8888aa' }}>
                          <ServiceBadge service={deal.service_type} />
                          {deal.expected_close_date && (
                            <span>Close: {format(new Date(deal.expected_close_date), 'd MMM yyyy')}</span>
                          )}
                        </div>
                        {deal.notes && <p className="text-xs mt-1.5" style={{ color: '#8888aa' }}>{deal.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-white">£{deal.value.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4 border-t border-[#1e1e2e]">
              <AddDealForm clientId={id} />
            </div>
          </div>

          {/* Interaction Timeline */}
          <div className="rounded-xl" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="px-5 py-4 border-b border-[#1e1e2e]">
              <h2 className="font-semibold text-white">Interaction Timeline</h2>
            </div>

            {interactions && interactions.length > 0 ? (
              <div className="divide-y divide-[#1e1e2e]">
                {interactions.map((interaction: any) => (
                  <div key={interaction.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <InteractionBadge type={interaction.type} />
                          <span className="text-xs" style={{ color: '#555570' }}>
                            {format(new Date(interaction.date), 'd MMM yyyy, HH:mm')}
                          </span>
                          {interaction.profiles?.full_name && (
                            <span className="text-xs" style={{ color: '#555570' }}>
                              · {interaction.profiles.full_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{interaction.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: '#8888aa' }}>No interactions logged yet.</p>
              </div>
            )}

            <div className="px-5 py-4 border-t border-[#1e1e2e]">
              <AddInteractionForm clientId={id} profiles={profiles ?? []} currentUserId={user?.id ?? ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
