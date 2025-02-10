import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const decodedId = decodeURIComponent(params.id)
    const sessionDate = new Date(decodedId)

    if (isNaN(sessionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }
    
    // Get the minute range for the session
    const sessionStart = new Date(sessionDate)
    const sessionEnd = new Date(sessionDate.getTime() + 60000) // Add 1 minute

    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: sessionStart,
          lt: sessionEnd
        }
      },
      include: {
        word: {
          include: {
            group: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (!activities.length) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Group activities by word to avoid duplicates
    const wordsMap = new Map()
    activities.forEach(activity => {
      if (!activity.word) return
      
      wordsMap.set(activity.word.id, {
        text: activity.word.text,
        translation: activity.word.translation,
        activities: [{
          success: activity.success
        }]
      })
    })

    const sessionData = {
      id: decodedId,
      type: activities[0].type || 'Study Session',
      createdAt: activities[0].createdAt.toISOString(),
      groupName: activities[0].word?.group?.name || 'No Group',
      words: Array.from(wordsMap.values())
    }

    return NextResponse.json({ data: sessionData })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    )
  }
}