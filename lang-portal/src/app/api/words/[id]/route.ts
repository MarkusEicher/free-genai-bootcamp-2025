import { NextResponse } from 'next/server'
import { WordRepository } from '@/repositories/wordRepository'
import { WordSchema } from '@/utils/validation'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const word = await WordRepository.findById(params.id)
    if (!word) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: word })
  } catch (error) {
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
    await prisma.word.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Word deleted successfully' })
  } catch (error) {
    console.error('Error deleting word:', error)
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { text, translation, groupId } = body

    const word = await prisma.word.update({
      where: { id: params.id },
      data: {
        text: text,
        translation: translation,
        groupId: groupId || null
      },
      include: {
        group: true
      }
    })

    return NextResponse.json({ data: word })
  } catch (error) {
    console.error('Error updating word:', error)
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    )
  }
} 