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
      const timestamp = new Date(activity.createdAt).toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
      if (!acc.has(timestamp)) {
        acc.set(timestamp, [])
      }
      acc.get(timestamp)?.push(activity)
      return acc
    }, new Map<string, any[]>())

    // Calculate total statistics
    const totalWords = await prisma.word.count()
    const totalGroups = await prisma.group.count()
    const sessionCount = sessions.size
    
    // Calculate overall success rate
    const totalAttempts = activities.length
    const successfulAttempts = activities.filter(a => a.success).length
    const successRate = totalAttempts > 0 
      ? Math.round((successfulAttempts / totalAttempts) * 100)
      : 0

    return NextResponse.json({
      data: {
        totalWords,
        totalGroups,
        studySessions: sessionCount,
        successRate
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
} 