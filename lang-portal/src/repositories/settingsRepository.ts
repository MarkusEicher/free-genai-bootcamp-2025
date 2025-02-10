import { prisma } from '@/lib/prisma'
import type { Settings } from '@prisma/client'

export class SettingsRepository {
  static async getSettings(): Promise<Settings> {
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          dailyGoal: 10,
          notificationsEnabled: true,
          studyReminders: true,
          theme: 'system',
          language: 'en'
        }
      })
    }

    return settings
  }

  static async updateSettings(data: Partial<Settings>): Promise<Settings> {
    const settings = await this.getSettings()

    return prisma.settings.update({
      where: { id: settings.id },
      data
    })
  }
} 