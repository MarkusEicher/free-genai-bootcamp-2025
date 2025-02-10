import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a group
  const group = await prisma.group.create({
    data: {
      name: 'Basic Phrases',
    },
  })

  // Create some words
  const words = await Promise.all([
    prisma.word.create({
      data: {
        text: 'Hello',
        translation: 'Hola',
        groupId: group.id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Goodbye',
        translation: 'Adiós',
        groupId: group.id,
      },
    }),
  ])

  // Create some activities
  await Promise.all([
    prisma.activity.create({
      data: {
        wordId: words[0].id,
        type: 'practice',
        success: true,
      },
    }),
    prisma.activity.create({
      data: {
        wordId: words[1].id,
        type: 'practice',
        success: false,
      },
    }),
  ])

  // Create default settings
  await prisma.settings.create({
    data: {
      dailyGoal: 10,
      notificationsEnabled: true,
      studyReminders: true,
      theme: 'system',
      language: 'en',
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 