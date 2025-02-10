import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all activities
    const activities = await prisma.activity.findMany({
      include: {
        word: {
          include: {
            group: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group activities by timestamp (rounded to the nearest minute to group related activities)
    const sessions = activities.reduce((acc, activity) => {
      const timestamp = new Date(activity.createdAt)
      // Round to nearest minute
      timestamp.setSeconds(0, 0)
      const key = timestamp.toISOString()
      
      if (!acc[key]) {
        acc[key] = {
          id: key,
          type: activity.type || 'Study Session',
          createdAt: activity.createdAt,
          activities: [],
          groupName: activity.word?.group?.name || 'No Group'
        }
      }
      
      acc[key].activities.push(activity)
      return acc
    }, {} as Record<string, any>)

    // Calculate statistics for each session
    const sessionsList = Object.values(sessions).map((session: any) => {
      const totalWords = session.activities.length
      const successfulWords = session.activities.filter((a: any) => a.success).length
      const successRate = Math.round((successfulWords / totalWords) * 100)

      return {
        id: session.id,
        type: session.type,
        createdAt: session.createdAt.toISOString(),
        wordCount: totalWords,
        successRate: successRate,
        groupName: session.groupName
      }
    })

    return NextResponse.json({ data: sessionsList })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
} 