import { NextResponse } from 'next/server'
import { GroupSchema } from '@/lib/schemas/group'
import { GroupRepository } from '@/lib/repositories/group'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const group = await GroupRepository.findById(params.id)
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: group })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = GroupSchema.parse(body)
    const group = await GroupRepository.update(params.id, validated)
    return NextResponse.json({ data: group })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await GroupRepository.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 400 }
    )
  }
} 