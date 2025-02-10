import { prisma } from '@/lib/prisma'
import type { Activity, Word } from '@prisma/client'

// This type combines the Activity model with its related Word model
type ActivityWithWord = Activity & {
  word: Word
}

export class ActivityRepository {
  // Creates a new activity record with word relationship
  static async create(data: {
    type: string     // Type of activity (e.g., 'PRACTICE', 'REVIEW')
    wordId: string   // ID of the word being practiced
    success: boolean // Whether the answer was correct
  }): Promise<ActivityWithWord> {
    return prisma.activity.create({
      data,
      include: { // Include the related word in the response
        word: true,
      },
    })
  }

  // Gets all activities for a specific word
  static async findByWord(wordId: string): Promise<ActivityWithWord[]> {
    return prisma.activity.findMany({
      where: {
        wordId,
      },
      include: {
        word: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  // Gets statistics about activities (total count, success rate, recent activities)
  static async getStats(): Promise<{
    totalActivities: number
    successRate: number
    recentActivities: ActivityWithWord[]
  }> {
    const [totalActivities, successfulActivities, recentActivities] = await Promise.all([
      prisma.activity.count(),
      prisma.activity.count({
        where: {
          success: true,
        },
      }),
      prisma.activity.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          word: true,
        },
      }),
    ])

    const successRate = totalActivities > 0
      ? (successfulActivities / totalActivities) * 100
      : 0

    return {
      totalActivities,
      successRate,
      recentActivities,
    }
  }
} 