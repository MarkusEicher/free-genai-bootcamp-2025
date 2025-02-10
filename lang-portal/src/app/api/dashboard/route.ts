import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get last session
    const lastActivity = await prisma.activity.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        word: {
          include: {
            group: true
          }
        }
      }
    })

    // Get study progress
    const totalWords = await prisma.word.count()
    const studiedWords = await prisma.word.count({
      where: {
        activities: {
          some: {}
        }
      }
    })

    // Calculate success rate from all activities
    const [totalActivities, successfulActivities] = await Promise.all([
      prisma.activity.count(),
      prisma.activity.count({
        where: { success: true }
      })
    ])

    const successRate = totalActivities > 0
      ? Math.round((successfulActivities / totalActivities) * 100)
      : 0

    // Get active groups count
    const activeGroups = await prisma.group.count({
      where: {
        words: {
          some: {}
        }
      }
    })

    // Calculate study sessions (unique days)
    const uniqueDates = await prisma.activity.groupBy({
      by: ['createdAt'],
      _count: {
        createdAt: true
      }
    })
    const studySessions = uniqueDates.length

    const lastSession = lastActivity ? {
      type: 'Sentence Translator',
      date: lastActivity.createdAt.toLocaleDateString(),
      correct: await prisma.activity.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          success: true
        }
      }),
      wrong: await prisma.activity.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          success: false
        }
      }),
      groupId: lastActivity.word?.groupId || undefined,
      groupName: lastActivity.word?.group?.name
    } : null

    return NextResponse.json({
      data: {
        lastSession,
        studyProgress: {
          totalWords,
          studiedWords,
          masteryProgress: totalWords > 0 
            ? Math.round((studiedWords / totalWords) * 100)
            : 0
        },
        quickStats: {
          successRate,
          studySessions,
          activeGroups,
          studyStreak: 1 // Simplified for now, can be enhanced later
        }
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