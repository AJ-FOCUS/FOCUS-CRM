import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ChevronRight, Building2, Phone, Mail, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge, ServiceBadge, TagBadge } from '@/components/Badge'
import { Client, ClientStatus, ClientTag } from '@/lib/types'

const inputClass = "w-full bg-[#0f0f1a] text-white border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0066FF] transition-colors placeholder-[#555570]"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const statusFilter = params.status as ClientStatus | undefined
  const searchQuery = params.search || ''

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  let query = supabase
    .from('clients')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }
  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    )
  }

  const { data: clients } = await query

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>{clients?.length ?? 0} total</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#0066FF' }}
        >
          <Plus size={16} />
          Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form method="GET" className="flex-1">
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by name, company, email, phone..."
            className={inputClass}
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          {(['', 'lead', 'active', 'inactive'] as const).map(s => (
            <Link
              key={s}
              href={s ? `/clients?status=${s}` : '/clients'}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: statusFilter === s || (!statusFilter && !s) ? '#0066FF' : '#1e1e2e',
                color: statusFilter === s || (!statusFilter && !s) ? 'white' : '#8888aa',
              }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Client List */}
      {!clients?.length ? (
        <div className="rounded-xl p-12 text-center" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <p className="text-sm" style={{ color: '#8888aa' }}>No clients found.</p>
          <Link href="/clients/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0066FF' }}>
            <Plus size={14} /> Add your first client
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
          <div className="divide-y divide-[#1e1e2e]">
            {clients.map((client: any) => {
              const isOverdue = client.next_action_date && new Date(client.next_action_date + 'T00:00:00') < today
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#1a1a28] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: '#0066FF' }}>
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white">{client.full_name}</span>
                      <StatusBadge status={client.status} />
                      {(client.tags ?? []).map((tag: ClientTag) => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#8888aa' }}>
                      {client.company && (
                        <span className="flex items-center gap-1">
                          <Building2 size={11} /> {client.company}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1 hidden sm:flex">
                          <Phone size={11} /> {client.phone}
                        </span>
                      )}
                    </div>
                    {client.services_interested?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {client.services_interested.map((s: string) => (
                          <ServiceBadge key={s} service={s as any} />
                        ))}
                      </div>
                    )}
                    {client.next_action_description && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle size={11} style={{ color: isOverdue ? '#ff4444' : '#555570', flexShrink: 0 }} />
                        <span className="text-xs truncate" style={{ color: isOverdue ? '#ff4444' : '#555570' }}>
                          {client.next_action_description}
                          {client.next_action_date && (
                            <> &middot; {format(new Date(client.next_action_date + 'T00:00:00'), 'd MMM yyyy')}{isOverdue && ' (overdue)'}</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs" style={{ color: '#555570' }}>
                      {client.profiles?.full_name && <div>{client.profiles.full_name}</div>}
                      <div>{format(new Date(client.created_at), 'd MMM yyyy')}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: '#555570' }} className="flex-shrink-0 group-hover:text-white transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
