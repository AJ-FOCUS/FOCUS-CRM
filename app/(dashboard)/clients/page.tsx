import { createClient } from '@/lib/supabase/server'
import ClientsView from '@/components/ClientsView'
import { ClientStatus } from '@/lib/types'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; assigned_to?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const statusFilter = (params.status ?? '') as ClientStatus | ''
  const searchQuery = params.search ?? ''
  const assignedToFilter = params.assigned_to ?? ''

  let query = supabase
    .from('clients')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (assignedToFilter) query = query.eq('assigned_to', assignedToFilter)
  if (searchQuery)
    query = query.or(
      `full_name.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    )

  const [
    { data: clients },
    { data: allInteractions },
    { data: wonDeals },
    { data: profiles },
  ] = await Promise.all([
    query,
    supabase
      .from('interactions')
      .select('client_id, type, date')
      .order('date', { ascending: false }),
    supabase
      .from('deals')
      .select('client_id, value')
      .eq('stage', 'won'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name'),
  ])

  // Last interaction per client (interactions are already sorted date desc)
  const lastInteractionMap: Record<string, { type: string; date: string }> = {}
  for (const i of allInteractions ?? []) {
    if (!lastInteractionMap[i.client_id]) {
      lastInteractionMap[i.client_id] = { type: i.type, date: i.date }
    }
  }

  // Total won deal value per client
  const wonValueMap: Record<string, number> = {}
  for (const d of wonDeals ?? []) {
    wonValueMap[d.client_id] = (wonValueMap[d.client_id] ?? 0) + d.value
  }

  const enrichedClients = (clients ?? []).map((c: any) => ({
    ...c,
    wonValue: wonValueMap[c.id] ?? 0,
    lastInteractionDate: lastInteractionMap[c.id]?.date ?? null,
    lastInteractionType: lastInteractionMap[c.id]?.type ?? null,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <ClientsView
        clients={enrichedClients}
        profiles={profiles ?? []}
        filters={{ search: searchQuery, status: statusFilter, assigned_to: assignedToFilter }}
      />
    </div>
  )
}
