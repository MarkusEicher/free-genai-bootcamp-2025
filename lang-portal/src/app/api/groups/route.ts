import { NextResponse } from 'next/server'
import { GroupRepository } from '@/repositories/groupRepository'
import { GroupSchema } from '@/utils/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groups = await GroupRepository.findMany({
      skip: Number(searchParams.get('skip')) || 0,
      take: Number(searchParams.get('take')) || 10,
      search: searchParams.get('search') || undefined,
    })
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
    return NextResponse.json({ data: group }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 400 }
    )
  }
} 