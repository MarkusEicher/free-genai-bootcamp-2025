import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const decodedId = decodeURIComponent(params.id)
    let sessionDate: Date

    try {
      sessionDate = new Date(decodedId)
      // Validate the date and ensure it's not NaN
      if (isNaN(sessionDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid session ID format' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Get the minute range for the session
    const sessionStart = new Date(sessionDate)
    sessionStart.setSeconds(0, 0) // Round to minute start
    const sessionEnd = new Date(sessionStart.getTime() + 60000) // Add 1 minute

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
      id: sessionStart.toISOString(), // Use consistent ISO format
      type: activities[0].type || 'Study Session',
      createdAt: sessionStart.toISOString(),
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