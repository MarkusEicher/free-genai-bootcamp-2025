import { useState } from 'react'
import { Card, Button } from '../components/common'
import { useProfile, useUpdateProfile } from '../hooks/useApi'
import { ProfileStats } from '../components/ProfileStats'
import { AchievementsList } from '../components/AchievementsList'

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateMutation = useUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await updateMutation.mutateAsync({
        displayName: formData.get('displayName') as string,
        bio: formData.get('bio') as string,
        nativeLanguage: formData.get('nativeLanguage') as string,
        learningLanguages: (formData.get('learningLanguages') as string)
          .split(',')
          .map(lang => lang.trim())
          .filter(Boolean),
        dailyGoal: Number(formData.get('dailyGoal')),
        publicProfile: formData.get('publicProfile') === 'true'
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {isEditing ? (
        <Card className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <input
                name="displayName"
                type="text"
                defaultValue={profile?.displayName}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                defaultValue={profile?.bio}
                className="mt-1 w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Native Language</label>
              <input
                name="nativeLanguage"
                type="text"
                defaultValue={profile?.nativeLanguage}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Learning Languages</label>
              <input
                name="learningLanguages"
                type="text"
                defaultValue={profile?.learningLanguages.join(', ')}
                className="mt-1 w-full p-2 border rounded"
                placeholder="Separate languages with commas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Daily Goal (minutes)</label>
              <input
                name="dailyGoal"
                type="number"
                defaultValue={profile?.dailyGoal}
                min="1"
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                name="publicProfile"
                type="checkbox"
                defaultChecked={profile?.publicProfile}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="text-sm text-gray-700">Make profile public</label>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Display Name</div>
                <div className="text-lg font-medium">{profile?.displayName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Bio</div>
                <div className="text-lg">{profile?.bio}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Native Language</div>
                <div className="text-lg">{profile?.nativeLanguage}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Learning Languages</div>
                <div className="flex flex-wrap gap-2">
                  {profile?.learningLanguages.map(lang => (
                    <span
                      key={lang}
                      className="px-2 py-1 bg-blue-100 rounded-full text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Daily Goal</div>
                <div className="text-lg">{profile?.dailyGoal} minutes</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Profile Visibility</div>
                <div className="text-lg">
                  {profile?.publicProfile ? 'Public' : 'Private'}
                </div>
              </div>
            </div>
          </Card>

          {profile?.id && (
            <>
              <ProfileStats userId={profile.id} />
              <AchievementsList userId={profile.id} />
            </>
          )}
        </>
      )}
    </div>
  )
} 