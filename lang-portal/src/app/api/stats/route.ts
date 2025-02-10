import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all required data in parallel
    const [totalWords, activities, activeGroups] = await Promise.all([
      prisma.word.count(),
      prisma.activity.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          word: {
            include: {
              group: true
            }
          }
        }
      }),
      prisma.group.count({
        where: {
          words: {
            some: {} // Only count groups that have words
          }
        }
      })
    ])

    // Calculate success rate
    const successRate = activities.length > 0
      ? Math.round((activities.filter(a => a.success).length / activities.length) * 100)
      : 0

    // Calculate unique study sessions (by date)
    const uniqueDates = new Set(
      activities.map(a => 
        new Date(a.createdAt).toISOString().split('T')[0]
      )
    )
    const studySessions = uniqueDates.size

    // Get last session details
    const lastActivity = activities[0]
    const lastSessionDate = lastActivity ? new Date(lastActivity.createdAt) : null
    const lastSessionActivities = lastSessionDate
      ? activities.filter(a => 
          new Date(a.createdAt).toISOString().split('T')[0] === 
          lastSessionDate.toISOString().split('T')[0]
        )
      : []

    const lastSession = lastActivity ? {
      type: lastActivity.type,
      date: lastActivity.createdAt.toISOString(),
      correct: lastSessionActivities.filter(a => a.success).length,
      wrong: lastSessionActivities.filter(a => !a.success).length,
      groupId: lastActivity.word.groupId
    } : undefined

    // Calculate study streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sessionDates = [...uniqueDates].sort().reverse()
    let studyStreak = 0
    
    for (let i = 0; i < sessionDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]
      
      if (sessionDates[i] === expectedDateStr) {
        studyStreak++
      } else {
        break
      }
    }

    return NextResponse.json({
      data: {
        totalWords,
        successRate,
        studySessions,
        activeGroups,
        studyStreak,
        lastSession
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}