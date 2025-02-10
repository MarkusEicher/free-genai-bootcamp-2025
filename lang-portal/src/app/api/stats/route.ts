import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Basic stats with minimal queries
    const totalWords = await prisma.word.count()
    
    // Return simplified stats first to test
    return NextResponse.json({
      data: {
        totalWords,
        successRate: 0,
        studySessions: 0,
        activeGroups: 0,
        studyStreak: 0,
        lastSession: null
      }
    })

  } catch (error) {
    // Log the full error details
    console.error('Database Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 