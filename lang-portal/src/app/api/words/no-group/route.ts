import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma' // Fixed import path

export async function GET() {
  try {
    const count = await prisma.word.count({
      where: {
        groupId: null
      }
    })

    return NextResponse.json({
      data: {
        _count: count
      }
    })
  } catch (error) {
    console.error('Error fetching no-group count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch no-group count' },
      { status: 500 }
    )
  }
} 