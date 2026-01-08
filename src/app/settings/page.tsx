import Navbar from '@/components/Navbar'
import ProfileSettings from '@/components/ProfileSettings'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProfileSettings />
      </div>
    </div>
  )
}
