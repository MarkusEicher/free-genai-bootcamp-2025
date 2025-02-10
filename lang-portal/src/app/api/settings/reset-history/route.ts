import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Delete all activities
    await prisma.activity.deleteMany()
    
    return NextResponse.json({ message: 'History reset successfully' })
  } catch (error) {
    console.error('Error resetting history:', error)
    return NextResponse.json(
      { error: 'Failed to reset history' },
      { status: 500 }
    )
  }
} 