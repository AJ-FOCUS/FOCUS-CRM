import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, TrendingUp, Trophy, Plus, Phone, Mail, Video, MessageSquare, Calendar, Globe } from 'lucide-react'
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

  const [
    { count: totalClients },
    { count: activeDeals },
    { count: dealsWon },
    { data: recentInteractions },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('*', { count: 'exact', head: true }).not('stage', 'in', '("won","lost")'),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('stage', 'won').gte('created_at', monthStart).lte('created_at', monthEnd),
    supabase.from('interactions')
      .select('*, clients(full_name, id), profiles(full_name)')
      .order('date', { ascending: false })
      .limit(8),
  ])

  const stats = [
    { label: 'Total Clients', value: totalClients ?? 0, icon: Users, color: '#0066FF' },
    { label: 'Active Deals', value: activeDeals ?? 0, icon: TrendingUp, color: '#ffaa00' },
    { label: 'Deals Won This Month', value: dealsWon ?? 0, icon: Trophy, color: '#00cc66' },
  ]

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#8888aa' }}>{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl" style={{ background: '#111118', border: '1px solid #1e1e2e' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Recent Interactions</h2>
          <Link href="/clients" className="text-xs font-medium" style={{ color: '#0066FF' }}>
            View all clients →
          </Link>
        </div>

        {!recentInteractions?.length ? (
          <div className="px-6 py-12 text-center" style={{ color: '#8888aa' }}>
            <p className="text-sm">No interactions yet. Start logging client communications.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {recentInteractions.map((interaction: any) => (
              <div key={interaction.id} className="flex items-start gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#1e1e2e', color: '#8888aa' }}>
                  {interactionIcons[interaction.type as InteractionType]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/clients/${interaction.client_id}`} className="text-sm font-medium text-white hover:underline">
                      {interaction.clients?.full_name}
                    </Link>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: '#1e1e2e', color: '#8888aa' }}>
                      {interaction.type}
                    </span>
                  </div>
                  <p className="text-sm truncate" style={{ color: '#8888aa' }}>{interaction.notes}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: '#555570' }}>
                      {format(new Date(interaction.date), 'd MMM yyyy')}
                    </span>
                    {interaction.profiles?.full_name && (
                      <span className="text-xs" style={{ color: '#555570' }}>
                        by {interaction.profiles.full_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
