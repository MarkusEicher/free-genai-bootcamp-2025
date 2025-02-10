import { prisma } from '@/lib/prisma'
import type { Word } from '@prisma/client'
import type { WordInput } from '@/utils/validation'

export class WordRepository {
  static async findMany(params: {
    skip?: number
    take?: number
    search?: string
  }): Promise<Word[]> {
    return prisma.word.findMany({
      where: {
        text: params.search ? {
          contains: params.search,
        } : undefined,
      },
      include: {
        group: true,
      },
      skip: params.skip,
      take: params.take,
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async create(data: WordInput): Promise<Word> {
    return prisma.word.create({
      data,
      include: {
        group: true,
      },
    })
  }

  static async update(id: string, data: WordInput): Promise<Word> {
    return prisma.word.update({
      where: { id },
      data,
      include: {
        group: true,
      },
    })
  }

  static async delete(id: string): Promise<Word> {
    return prisma.word.delete({
      where: { id },
      include: {
        group: true,
      },
    })
  }

  static async findById(id: string): Promise<Word | null> {
    return prisma.word.findUnique({
      where: { id },
      include: {
        group: true,
      },
    })
  }
} 