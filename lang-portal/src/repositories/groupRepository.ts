import { prisma } from '@/lib/prisma'
import type { Group } from '@prisma/client'
import type { GroupInput } from '@/utils/validation'

export class GroupRepository {
  static async findMany(params: {
    skip?: number
    take?: number
    search?: string
  }): Promise<Group[]> {
    return prisma.group.findMany({
      where: {
        name: params.search ? {
          contains: params.search,
        } : undefined,
      },
      skip: params.skip,
      take: params.take,
      include: {
        words: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async create(data: GroupInput): Promise<Group> {
    return prisma.group.create({
      data: {
        name: data.name,
      },
      include: {
        words: true,
      },
    })
  }

  static async update(id: string, data: GroupInput): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data: {
        name: data.name,
      },
      include: {
        words: true,
      },
    })
  }

  static async delete(id: string): Promise<Group> {
    return prisma.group.delete({
      where: { id },
    })
  }

  static async findById(id: string): Promise<Group | null> {
    return prisma.group.findUnique({
      where: { id },
      include: {
        words: true,
      },
    })
  }
} 