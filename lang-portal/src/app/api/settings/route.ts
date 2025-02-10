import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // For now, we'll just get the first settings record
    // In the future, this would be per-user
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      // Create default settings if none exist
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

    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const settings = await prisma.settings.findFirst()

    if (!settings) {
      // Create new settings if none exist
      const newSettings = await prisma.settings.create({
        data: {
          dailyGoal: body.dailyGoal,
          notificationsEnabled: body.notificationsEnabled,
          studyReminders: body.studyReminders,
          theme: body.theme,
          language: body.language
        }
      })
      return NextResponse.json({ data: newSettings })
    }

    // Update existing settings
    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        dailyGoal: body.dailyGoal,
        notificationsEnabled: body.notificationsEnabled,
        studyReminders: body.studyReminders,
        theme: body.theme,
        language: body.language
      }
    })

    return NextResponse.json({ data: updatedSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
} 