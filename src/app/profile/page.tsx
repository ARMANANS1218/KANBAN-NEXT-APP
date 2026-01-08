import Navbar from '@/components/Navbar'
import ProfileSettings from '@/components/ProfileSettings'

export default function ProfilePage() {
  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProfileSettings />
      </div>
    </div>
  )
}
