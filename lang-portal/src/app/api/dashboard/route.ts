import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    // Basic stats that don't require complex queries
    const [totalWords, activeGroups] = await Promise.all([
      prisma.word.count(),
      prisma.group.count()
    ])

    // Get last activity with its related word and group
    const lastActivity = await prisma.activity.findFirst({
      where: {
        wordId: {
          not: undefined
        } as Prisma.StringFilter
      },
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
    })

    // Count successful activities
    const successfulActivities = await prisma.activity.count({
      where: {
        success: true
      }
    })

    // Count total activities
    const totalActivities = await prisma.activity.count()

    // Calculate success rate
    const successRate = totalActivities > 0
      ? Math.round((successfulActivities / totalActivities) * 100)
      : 0

    return NextResponse.json({
      data: {
        lastSession: lastActivity ? {
          type: 'Study Session',
          date: lastActivity.createdAt.toISOString(),
          correct: successfulActivities,
          wrong: totalActivities - successfulActivities,
          groupId: lastActivity.word?.group?.id,
          groupName: lastActivity.word?.group?.name
        } : null,
        studyProgress: {
          totalWords,
          studiedWords: 0, // Simplified for now
          masteryProgress: 0 // Simplified for now
        },
        quickStats: {
          successRate,
          studySessions: 1, // Simplified for now
          activeGroups,
          studyStreak: 1 // Simplified for now
        }
      }
    })
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
} 