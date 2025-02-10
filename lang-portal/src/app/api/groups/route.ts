import { NextResponse } from 'next/server'
import { GroupSchema } from '@/lib/schemas/group'
import { GroupRepository } from '@/lib/repositories/group'

export async function GET() {
  try {
    const groups = await GroupRepository.findAll()
    return NextResponse.json({ data: groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = GroupSchema.parse(body)
    const group = await GroupRepository.create(validated)
    return NextResponse.json({ data: group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 400 }
    )
  }
} 