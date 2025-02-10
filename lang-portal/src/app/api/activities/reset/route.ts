import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    await prisma.activity.deleteMany()
    
    return NextResponse.json({ 
      message: 'Activities reset successfully' 
    })
  } catch (error) {
    console.error('Error resetting activities:', error)
    return NextResponse.json(
      { error: 'Failed to reset activities' },
      { status: 500 }
    )
  }
} 