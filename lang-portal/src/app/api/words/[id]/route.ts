import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WordSchema } from '@/lib/schemas/word'
import { WordRepository } from '@/lib/repositories/word'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const word = await prisma.word.findUnique({
      where: {
        id: params.id,
      },
      include: {
        group: true,
        activities: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!word) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: word })
  } catch (error) {
    console.error('Error fetching word:', error)
    return NextResponse.json(
      { error: 'Failed to fetch word' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = WordSchema.parse(body)
    const word = await WordRepository.update(params.id, validated)
    return NextResponse.json({ data: word })
  } catch (error) {
    console.error('Error updating word:', error)
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await WordRepository.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting word:', error)
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 400 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { groupId } = body

    const updatedWord = await prisma.word.update({
      where: {
        id: params.id,
      },
      data: {
        groupId: groupId || null,
      },
      include: {
        group: true,
        activities: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    return NextResponse.json({ data: updatedWord })
  } catch (error) {
    console.error('Error updating word:', error)
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    )
  }
} 