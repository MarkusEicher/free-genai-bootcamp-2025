import { prisma } from '@/lib/prisma'
import type { Word, Group } from '@prisma/client'
import type { WordInput } from '@/utils/validation'

// Define a type that includes the relations
type WordWithGroup = Word & {
  group: Group | null
}

export class WordRepository {
  static async findMany(params: {
    skip?: number
    take?: number
    search?: string
  }): Promise<WordWithGroup[]> {
    return prisma.word.findMany({
      where: {
        text: params.search ? {
          contains: params.search,
        } : undefined,
      },
      skip: params.skip,
      take: params.take,
      include: {
        group: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async create(data: Omit<WordInput, 'id'>): Promise<WordWithGroup> {
    return prisma.word.create({
      data: {
        text: data.text,
        translation: data.translation,
        groupId: data.groupId || null,
      },
      include: {
        group: true,
      },
    })
  }

  static async update(id: string, data: WordInput): Promise<WordWithGroup> {
    return prisma.word.update({
      where: { id },
      data: {
        text: data.text,
        translation: data.translation,
        groupId: data.groupId || null,
      },
      include: {
        group: true,
      },
    })
  }

  static async delete(id: string): Promise<Word> {
    return prisma.word.delete({
      where: { id },
    })
  }

  static async findById(id: string): Promise<WordWithGroup | null> {
    return prisma.word.findUnique({
      where: { id },
      include: {
        group: true,
      },
    })
  }
} 