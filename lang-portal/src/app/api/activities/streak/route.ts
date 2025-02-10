import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    const uniqueDates = new Set(
      activities.map(a => 
        new Date(a.createdAt).toISOString().split('T')[0]
      )
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sessionDates = [...uniqueDates].sort().reverse()
    let streak = 0
    
    for (let i = 0; i < sessionDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]
      
      if (sessionDates[i] === expectedDateStr) {
        streak++
      } else {
        break
      }
    }

    return NextResponse.json({ data: { streak } })
  } catch (error) {
    console.error('Error calculating streak:', error)
    return NextResponse.json(
      { error: 'Failed to calculate streak' },
      { status: 500 }
    )
  }
} 