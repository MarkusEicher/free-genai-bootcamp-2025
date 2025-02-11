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
      
      if (!acc.has(key)) {
        acc.set(key, {
          id: key,
          type: activity.type,
          createdAt: key,
          activities: [],
          groupName: activity.word?.group?.name || 'No Group',
          groupId: activity.word?.group?.id
        })
      }
      acc.get(key)?.activities.push(activity)
      return acc
    }, new Map<string, any>())

    // Get the most recent session
    const lastSession = sessions.size > 0 ? {
      ...Array.from(sessions.values())[0],
      totalWords: Array.from(sessions.values())[0].activities.length,
      successfulWords: Array.from(sessions.values())[0].activities.filter((a: any) => a.success).length
    } : null

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

    // Format the last session data ensuring id is included
    const formattedLastSession = lastSession ? {
      id: lastSession.id,
      type: lastSession.type || 'Study Session',
      createdAt: lastSession.createdAt,
      groupName: lastSession.groupName,
      totalWords: lastSession.totalWords,
      successfulWords: lastSession.successfulWords,
      successRate: Math.round((lastSession.successfulWords / lastSession.totalWords) * 100)
    } : null

    return NextResponse.json({
      data: {
        totalWords,
        totalGroups,
        studySessions: sessionCount,
        successRate,
        lastSession: formattedLastSession
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