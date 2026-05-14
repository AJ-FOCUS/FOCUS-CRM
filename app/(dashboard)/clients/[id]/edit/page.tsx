import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClientForm from '@/components/ClientForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: profiles }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ])

  if (!client) notFound()

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/clients/${id}`} className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors" style={{ color: '#8888aa' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Client</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>{client.full_name}</p>
        </div>
      </div>
      <ClientForm profiles={profiles ?? []} client={client} />
    </div>
  )
}
