import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create some initial groups
  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: 'Basic Phrases',
      },
    }),
    prisma.group.create({
      data: {
        name: 'Common Words',
      },
    }),
  ])

  // Create some words
  const words = await Promise.all([
    prisma.word.create({
      data: {
        text: 'Hello',
        translation: 'Hola',
        groupId: groups[0].id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Goodbye',
        translation: 'Adiós',
        groupId: groups[0].id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Thank you',
        translation: 'Gracias',
        groupId: groups[0].id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Please',
        translation: 'Por favor',
        groupId: groups[0].id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Water',
        translation: 'Agua',
        groupId: groups[1].id,
      },
    }),
    prisma.word.create({
      data: {
        text: 'Food',
        translation: 'Comida',
        groupId: groups[1].id,
      },
    }),
  ])

  // Create some sample activities
  await Promise.all(
    words.map((word) =>
      prisma.activity.create({
        data: {
          wordId: word.id,
          type: 'practice',
          success: Math.random() > 0.5,
        },
      })
    )
  )

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 