import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, TrendingUp, Trophy, Plus, Phone, Mail, Video,
  MessageSquare, Calendar, Globe, AlertCircle, UserPlus, DollarSign,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { InteractionType } from '@/lib/types'

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  call: <Phone size={14} />,
  email: <Mail size={14} />,
  meeting: <Calendar size={14} />,
  zoom: <Video size={14} />,
  whatsapp: <MessageSquare size={14} />,
  other: <Globe size={14} />,
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const todayStr = new Date().toISOString().split('T')[0]

  const [
    { count: totalClients },
    { count: activeDeals },
    { count: dealsWon },
    { count: overdueActions },
    { data: recentInteractions },
    { data: recentClients },
    { data: recentDeals },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('*', { count: 'exact', head: true }).not('stage', 'in', '("won","lost")'),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('stage', 'won').gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('clients').select('*', { count: 'exact', head: true }).not('next_action_date', 'is', null).lt('next_action_date', todayStr),
    supabase.from('interactions')
      .select('*, clients(full_name, id), profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('clients')
      .select('id, full_name, company, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('deals')
      .select('id, name, value, stage, created_at, clients(id, full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Total Clients', value: totalClients ?? 0, icon: Users, color: '#0066FF' },
    { label: 'Active Deals', value: activeDeals ?? 0, icon: TrendingUp, color: '#ffaa00' },
    { label: 'Deals Won This Month', value: dealsWon ?? 0, icon: Trophy, color: '#00cc66' },
    { label: 'Overdue Actions', value: overdueActions ?? 0, icon: AlertCircle, color: '#ff4444' },
  ]

  // Merge activity feed: interactions + new clients + new deals, sort by date desc
  type FeedItem =
    | { kind: 'interaction'; ts: string; data: any }
    | { kind: 'client'; ts: string; data: any }
    | { kind: 'deal'; ts: string; data: any }

  const feed: FeedItem[] = [
    ...(recentInteractions ?? []).map(i => ({ kind: 'interaction' as const, ts: i.created_at, data: i })),
    ...(recentClients ?? []).map(c => ({ kind: 'client' as const, ts: c.created_at, data: c })),
    ...(recentDeals ?? []).map(d => ({ kind: 'deal' as const, ts: d.created_at, data: d })),
  ]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 12)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>{format(now, 'EEEE, d MMMM yyyy')}</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: '#111118', border: `1px solid ${color === '#ff4444' && value > 0 ? 'rgba(255,68,68,0.3)' : '#1e1e2e'}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium leading-tight" style={{ color: '#8888aa' }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: color === '#ff4444' && value > 0 ? '#ff4444' : 'white' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Team Activity</h2>
          <Link href="/clients" className="text-xs font-medium" style={{ color: '#0066FF' }}>
            View all clients →
          </Link>
        </div>

        {!feed.length ? (
          <div className="px-6 py-12 text-center" style={{ color: '#8888aa' }}>
            <p className="text-sm">No activity yet. Start adding clients and logging interactions.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {feed.map((item, idx) => {
              if (item.kind === 'interaction') {
                const i = item.data
                return (
                  <div key={`i-${i.id}`} className="flex items-start gap-4 px-6 py-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#1e1e2e', color: '#8888aa' }}>
                      {interactionIcons[i.type as InteractionType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: '#8888aa' }}>
                          {i.profiles?.full_name ?? 'Someone'}
                        </span>
                        <span className="text-xs" style={{ color: '#555570' }}>logged a {i.type} with</span>
                        <Link href={`/clients/${i.clients?.id}`} className="text-sm font-medium text-white hover:underline">
                          {i.clients?.full_name}
                        </Link>
                      </div>
                      {i.notes && <p className="text-xs truncate" style={{ color: '#555570' }}>{i.notes}</p>}
                      <span className="text-xs" style={{ color: '#555570' }}>
                        {format(new Date(i.created_at), 'd MMM yyyy, HH:mm')}
                      </span>
                    </div>
                  </div>
                )
              }
              if (item.kind === 'client') {
                const c = item.data
                return (
                  <div key={`c-${c.id}`} className="flex items-start gap-4 px-6 py-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0,204,102,0.15)', color: '#00cc66' }}>
                      <UserPlus size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: '#555570' }}>New client added:</span>
                        <Link href={`/clients/${c.id}`} className="text-sm font-medium text-white hover:underline">
                          {c.full_name}
                        </Link>
                        {c.company && <span className="text-xs" style={{ color: '#555570' }}>· {c.company}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#555570' }}>
                        {c.profiles?.full_name && <span>by {c.profiles.full_name}</span>}
                        <span>{format(new Date(c.created_at), 'd MMM yyyy, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              if (item.kind === 'deal') {
                const d = item.data
                return (
                  <div key={`d-${d.id}`} className="flex items-start gap-4 px-6 py-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(0,102,255,0.15)', color: '#0066FF' }}>
                      <DollarSign size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: '#555570' }}>New deal:</span>
                        <span className="text-sm font-medium text-white">{d.name}</span>
                        <span className="text-xs font-semibold" style={{ color: '#0066FF' }}>£{d.value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#555570' }}>
                        {d.clients?.full_name && (
                          <Link href={`/clients/${d.clients.id}`} className="hover:text-white transition-colors">
                            {d.clients.full_name}
                          </Link>
                        )}
                        <span>{format(new Date(d.created_at), 'd MMM yyyy, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
