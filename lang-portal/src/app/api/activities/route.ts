import { NextResponse } from 'next/server'
import { ActivityRepository } from '@/repositories/activityRepository'
import { z } from 'zod'

const ActivitySchema = z.object({
  type: z.enum(['PRACTICE', 'REVIEW', 'TEST']),
  wordId: z.string(),
  success: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = ActivitySchema.parse(body)
    const activity = await ActivityRepository.create(validated)
    return NextResponse.json({ data: activity }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 400 }
    )
  }
}

export async function GET() {
  try {
    const stats = await ActivityRepository.getStats()
    return NextResponse.json({ data: stats })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}