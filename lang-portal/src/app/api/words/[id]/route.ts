import { NextResponse } from 'next/server'
import { WordRepository } from '@/repositories/wordRepository'
import { WordSchema } from '@/utils/validation'

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
    await WordRepository.delete(params.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 400 }
    )
  }
} 