import { createClient } from '@/lib/supabase/server'
import ClientForm from '@/components/ClientForm'

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').order('full_name')

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Client</h1>
        <p className="text-sm mt-1" style={{ color: '#8888aa' }}>Add a new client or lead to the CRM</p>
      </div>
      <ClientForm profiles={profiles ?? []} />
    </div>
  )
}
