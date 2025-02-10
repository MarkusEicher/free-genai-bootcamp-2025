import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all activities with their related words and groups
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

    // Group activities by date
    const sessionMap = activities.reduce((acc, activity) => {
      const date = new Date(activity.createdAt)
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString()

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          activities: [],
          stats: {
            total: 0,
            correct: 0,
            wrong: 0
          }
        }
      }

      acc[dateKey].activities.push(activity)
      acc[dateKey].stats.total++
      if (activity.success) {
        acc[dateKey].stats.correct++
      } else {
        acc[dateKey].stats.wrong++
      }

      return acc
    }, {} as Record<string, any>)

    // Convert map to array and sort by date
    const sessions = Object.values(sessionMap).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({ data: sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
} 