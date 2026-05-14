import Sidebar from '@/components/Sidebar'
import GlobalSearch from '@/components/GlobalSearch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0f' }}>
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header
          className="sticky top-0 z-30 flex items-center pl-14 lg:pl-6 pr-4 py-3 border-b border-[#1e1e2e]"
          style={{ background: '#111118' }}
        >
          <GlobalSearch />
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
