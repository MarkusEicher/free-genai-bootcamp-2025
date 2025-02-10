import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
      },
      take: 50 // Limit to last 50 activities
    })

    return NextResponse.json({ data: activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wordId, success, type = 'practice' } = body

    // Validate required fields
    if (!wordId) {
      return NextResponse.json(
        { error: 'Word ID is required' },
        { status: 400 }
      )
    }

    if (typeof success !== 'boolean') {
      return NextResponse.json(
        { error: 'Success status is required and must be a boolean' },
        { status: 400 }
      )
    }

    // Verify word exists
    const word = await prisma.word.findUnique({
      where: { id: wordId }
    })

    if (!word) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        wordId,
        success,
        type
      },
      include: {
        word: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json({ data: activity })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}