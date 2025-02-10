import { prisma } from '@/lib/prisma'
import type { GroupInput } from '@/lib/schemas/group'

export class GroupRepository {
  static async findAll() {
    return await prisma.group.findMany({
      include: {
        _count: {
          select: { words: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  static async findById(id: string) {
    return await prisma.group.findUnique({
      where: { id },
      include: {
        words: true,
        _count: {
          select: { words: true }
        }
      }
    })
  }

  static async create(data: GroupInput) {
    return await prisma.group.create({
      data,
      include: {
        _count: {
          select: { words: true }
        }
      }
    })
  }

  static async update(id: string, data: GroupInput) {
    return await prisma.group.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { words: true }
        }
      }
    })
  }

  static async delete(id: string) {
    return await prisma.group.delete({
      where: { id }
    })
  }
} 