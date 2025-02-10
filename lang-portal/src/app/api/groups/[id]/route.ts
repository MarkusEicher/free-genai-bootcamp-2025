import { NextResponse } from 'next/server'
import { GroupRepository } from '@/repositories/groupRepository'
import { GroupSchema } from '@/utils/validation'

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
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 400 }
    )
  }
} 