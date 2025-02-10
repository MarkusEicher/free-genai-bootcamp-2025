import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple query to test database connection
    const activities = await prisma.activity.findMany({
      take: 10, // Limit to 10 records
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return simplified response
    return NextResponse.json({
      data: [{
        date: new Date().toISOString().split('T')[0],
        activities: activities,
        stats: {
          total: activities.length,
          correct: activities.filter(a => a.success).length,
          wrong: activities.filter(a => !a.success).length
        }
      }]
    })

  } catch (error) {
    // Log detailed error information
    console.error('Sessions Route Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 