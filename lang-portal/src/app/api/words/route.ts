import { NextResponse } from 'next/server'
import { WordRepository } from '@/repositories/wordRepository'
import { WordSchema } from '@/utils/validation'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = WordSchema.parse(body)
    const word = await WordRepository.create(validated)
    return NextResponse.json({ data: word }, { status: 201 })
  } catch (error) {
    console.error('Error creating word:', error)
    return NextResponse.json(
      { error: 'Failed to create word' },
      { status: 400 }
    )
  }
}

export async function GET() {
  try {
    const words = await WordRepository.findMany({})
    return NextResponse.json({ data: words })
  } catch (error) {
    console.error('Error fetching words:', error)
    return NextResponse.json(
      { error: 'Failed to fetch words' },
      { status: 500 }
    )
  }
} 