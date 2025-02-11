import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get a few recent activities to check their date formats
    const activities = await prisma.activity.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        createdAt: true,
        type: true
      }
    })

    // Format the dates in different ways for debugging
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      originalDate: activity.createdAt,
      isoString: activity.createdAt.toISOString(),
      timestamp: activity.createdAt.getTime(),
      localeString: activity.createdAt.toLocaleString(),
      utcString: activity.createdAt.toUTCString()
    }))

    return NextResponse.json({
      data: formattedActivities
    })
  } catch (error) {
    console.error('Error fetching dates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch date information' },
      { status: 500 }
    )
  }
} 