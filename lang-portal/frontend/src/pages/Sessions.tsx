import { useState } from 'react'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useSessions } from '../hooks/useApi'
import { format } from 'date-fns'
import { Session, SessionFilters } from '../types/session'
import SessionDetails from '../components/sessions/SessionDetails'

export default function Sessions() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<SessionFilters>({
    startDate: null,
    endDate: null,
  })
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const itemsPerPage = 10

  const { data: sessions, isLoading, isError, refetch } = useSessions()

  const filteredSessions = sessions?.filter(session => {
    if (!filters.startDate || !filters.endDate) return true
    const sessionDate = new Date(session.date)
    return sessionDate >= filters.startDate && sessionDate <= filters.endDate
  })

  const totalPages = Math.ceil((filteredSessions?.length || 0) / itemsPerPage)
  const paginatedSessions = filteredSessions?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading sessions</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Learning Sessions</h1>
        <div className="flex gap-4">
          <input
            type="date"
            className="px-3 py-2 border rounded"
            onChange={(e) => setFilters({ ...filters, startDate: new Date(e.target.value) })}
          />
          <input
            type="date"
            className="px-3 py-2 border rounded"
            onChange={(e) => setFilters({ ...filters, endDate: new Date(e.target.value) })}
          />
          <Button onClick={() => setFilters({ startDate: null, endDate: null })}>Clear Filters</Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {paginatedSessions?.map(session => (
          <Card 
            key={session.id} 
            className="p-4 hover:bg-gray-50 cursor-pointer transition"
            onClick={() => setSelectedSession(session)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold">
                  {format(new Date(session.date), 'PPP')}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {session.activities.length} activities completed
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(session.overallScore * 100).toFixed(1)}%
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              variant={currentPage === i + 1 ? 'primary' : 'secondary'}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetails
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
} 