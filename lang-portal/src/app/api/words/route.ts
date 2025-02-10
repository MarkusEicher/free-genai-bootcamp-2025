import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      include: {
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: words })
  } catch (error) {
    console.error('Error fetching words:', error)
    return NextResponse.json(
      { error: 'Failed to fetch words' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, translation, groupId } = body

    if (!text || !translation) {
      return NextResponse.json(
        { error: 'Text and translation are required' },
        { status: 400 }
      )
    }

    const word = await prisma.word.create({
      data: {
        text,
        translation,
        groupId: groupId || null
      },
      include: {
        group: true
      }
    })

    return NextResponse.json({ data: word })
  } catch (error) {
    console.error('Error creating word:', error)
    return NextResponse.json(
      { error: 'Failed to create word' },
      { status: 500 }
    )
  }
} 