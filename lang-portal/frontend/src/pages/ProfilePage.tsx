import { useState } from 'react'
import { useProfile, useUpdateProfile } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  
  const [name, setName] = useState(profile?.name || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.dailyGoal || 30)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile.mutateAsync({
      name,
      dailyGoal
    })
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Daily Practice Goal (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="240"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Level</p>
            <p className="text-lg font-medium">{profile?.level || 'Beginner'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-lg font-medium">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 