import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: today
        }
      },
      include: {
        word: {
          include: {
            group: true
          }
        }
      }
    })

    return NextResponse.json({
      data: {
        total: activities.length,
        correct: activities.filter(a => a.success).length,
        wrong: activities.filter(a => !a.success).length
      }
    })
  } catch (error) {
    console.error('Error fetching today\'s activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s activities' },
      { status: 500 }
    )
  }
} 