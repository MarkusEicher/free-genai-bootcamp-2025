import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const words = await prisma.word.findMany({
      where: {
        groupId: params.id
      },
      select: {
        id: true,
        text: true,
        translation: true
      }
    })

    return NextResponse.json({ data: words })
  } catch (error) {
    console.error('Error fetching group words:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group words' },
      { status: 500 }
    )
  }
} 