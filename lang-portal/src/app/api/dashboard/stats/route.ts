import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get basic stats
    const [totalWords, activities] = await Promise.all([
      prisma.word.count(),
      prisma.activity.findMany({
        include: {
          word: {
            include: {
              group: true
            }
          }
        }
      })
    ])

    // Calculate success rate
    const successfulActivities = activities.filter(a => a.success).length
    const successRate = activities.length > 0
      ? Math.round((successfulActivities / activities.length) * 100)
      : 0

    // Get active groups
    const activeGroups = await prisma.group.count({
      where: {
        words: {
          some: {}
        }
      }
    })

    // Get last session
    const lastActivity = activities[0]
    const lastSession = lastActivity ? {
      type: lastActivity.type,
      date: lastActivity.createdAt.toISOString(),
      correct: activities.filter(a => 
        a.createdAt.getTime() === lastActivity.createdAt.getTime() && a.success
      ).length,
      wrong: activities.filter(a => 
        a.createdAt.getTime() === lastActivity.createdAt.getTime() && !a.success
      ).length,
      groupId: lastActivity.word.groupId
    } : undefined

    // Calculate study sessions (unique dates)
    const uniqueDates = new Set(
      activities.map(a => a.createdAt.toISOString().split('T')[0])
    )
    const studySessions = uniqueDates.size

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
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
} 