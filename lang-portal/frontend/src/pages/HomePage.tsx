import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/common'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to Language Portal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Activities</h2>
          <p className="text-gray-600 mb-4">
            Practice your language skills with interactive exercises
          </p>
          <Button onClick={() => navigate('/activities')}>
            View Activities
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Vocabulary</h2>
          <p className="text-gray-600 mb-4">
            Manage and learn new vocabulary words
          </p>
          <Button onClick={() => navigate('/vocabulary')}>
            View Vocabulary
          </Button>
        </Card>
      </div>
    </div>
  )
} 