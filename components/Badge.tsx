import { ClientStatus, DealStage, InteractionType, ServiceType } from '@/lib/types'

const statusStyles: Record<ClientStatus, { bg: string; text: string; label: string }> = {
  lead: { bg: 'rgba(255,170,0,0.15)', text: '#ffaa00', label: 'Lead' },
  active: { bg: 'rgba(0,204,102,0.15)', text: '#00cc66', label: 'Active' },
  inactive: { bg: 'rgba(136,136,170,0.15)', text: '#8888aa', label: 'Inactive' },
}

const stageStyles: Record<DealStage, { bg: string; text: string; label: string }> = {
  new_enquiry: { bg: 'rgba(136,136,170,0.15)', text: '#8888aa', label: 'New Enquiry' },
  proposal_sent: { bg: 'rgba(0,102,255,0.15)', text: '#0066FF', label: 'Proposal Sent' },
  negotiating: { bg: 'rgba(255,170,0,0.15)', text: '#ffaa00', label: 'Negotiating' },
  won: { bg: 'rgba(0,204,102,0.15)', text: '#00cc66', label: 'Won' },
  lost: { bg: 'rgba(255,68,68,0.15)', text: '#ff4444', label: 'Lost' },
}

const serviceStyles: Record<ServiceType, { bg: string; text: string; label: string }> = {
  websites: { bg: 'rgba(0,102,255,0.15)', text: '#0066FF', label: 'Websites' },
  automation: { bg: 'rgba(160,80,255,0.15)', text: '#a050ff', label: 'Automation' },
  advertising: { bg: 'rgba(255,100,0,0.15)', text: '#ff6400', label: 'Advertising' },
  tiktok_shop: { bg: 'rgba(0,200,200,0.15)', text: '#00c8c8', label: 'TikTok Shop' },
}

const interactionStyles: Record<InteractionType, { label: string }> = {
  call: { label: 'Call' },
  email: { label: 'Email' },
  meeting: { label: 'Meeting' },
  whatsapp: { label: 'WhatsApp' },
  zoom: { label: 'Zoom' },
  other: { label: 'Other' },
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const s = statusStyles[status]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

export function StageBadge({ stage }: { stage: DealStage }) {
  const s = stageStyles[stage]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

export function ServiceBadge({ service }: { service: ServiceType }) {
  const s = serviceStyles[service]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

export function InteractionBadge({ type }: { type: InteractionType }) {
  const s = interactionStyles[type]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e1e2e] text-[#8888aa]">
      {s.label}
    </span>
  )
}
