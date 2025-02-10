import { prisma } from '@/lib/prisma'
import type { WordInput } from '@/lib/schemas/word'

export class WordRepository {
  static async update(id: string, data: WordInput) {
    return await prisma.word.update({
      where: { id },
      data: {
        text: data.text,
        translation: data.translation,
        groupId: data.groupId || null
      },
      include: {
        group: true
      }
    })
  }

  static async delete(id: string) {
    return await prisma.word.delete({
      where: { id }
    })
  }
} 