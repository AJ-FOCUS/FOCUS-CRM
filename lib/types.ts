export type ClientStatus = 'lead' | 'active' | 'inactive'
export type InteractionType = 'call' | 'email' | 'meeting' | 'whatsapp' | 'zoom' | 'other'
export type DealStage = 'new_enquiry' | 'proposal_sent' | 'negotiating' | 'won' | 'lost'
export type ServiceType = 'websites' | 'automation' | 'advertising' | 'tiktok_shop'

export interface Profile {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Client {
  id: string
  full_name: string
  company: string | null
  email: string | null
  phone: string | null
  instagram: string | null
  tiktok: string | null
  linkedin: string | null
  twitter: string | null
  services_interested: ServiceType[]
  notes: string | null
  assigned_to: string | null
  status: ClientStatus
  created_at: string
  assigned_profile?: Profile
}

export interface Interaction {
  id: string
  client_id: string
  type: InteractionType
  date: string
  handled_by: string
  notes: string
  created_at: string
  handler_profile?: Profile
}

export interface Deal {
  id: string
  client_id: string
  name: string
  service_type: ServiceType
  value: number
  stage: DealStage
  notes: string | null
  expected_close_date: string | null
  created_at: string
}
