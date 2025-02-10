import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          equals: new Date(params.id)
        }
      },
      include: {
        word: {
          include: {
            group: true
          }
        }
      }
    })

    if (!activities.length) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Group activities by word to count successes and failures
    const wordStats = activities.reduce((acc, activity) => {
      const word = activity.word
      if (!word) return acc

      if (!acc[word.id]) {
        acc[word.id] = {
          kanji: word.text,
          romaji: word.translation,
          english: word.translation,
          correct: 0,
          wrong: 0
        }
      }

      if (activity.success) {
        acc[word.id].correct++
      } else {
        acc[word.id].wrong++
      }

      return acc
    }, {} as Record<string, any>)

    const sessionData = {
      activity: {
        type: 'Typing Tutor',
        group: activities[0].word?.group?.name || 'No Group'
      },
      startTime: activities[0].createdAt.toISOString(),
      reviewItems: activities.length,
      words: Object.values(wordStats)
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