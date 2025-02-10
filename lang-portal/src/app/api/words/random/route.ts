import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching random word...')
    
    // First, get all words
    const words = await prisma.word.findMany({
      include: {
        group: true
      }
    })

    console.log(`Found ${words.length} words`)

    if (words.length === 0) {
      console.log('No words found in database')
      return NextResponse.json(
        { error: 'No words available' },
        { status: 404 }
      )
    }

    // Select a random word
    const randomIndex = Math.floor(Math.random() * words.length)
    const randomWord = words[randomIndex]

    console.log('Selected random word:', randomWord)

    return NextResponse.json({ 
      data: randomWord,
      debug: {
        totalWords: words.length,
        selectedIndex: randomIndex
      }
    })
  } catch (error) {
    console.error('Detailed error in random word route:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch random word',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 