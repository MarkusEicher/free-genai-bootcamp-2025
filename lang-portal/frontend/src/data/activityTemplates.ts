export const activityTemplates = {
  vocabulary: {
    name: 'Vocabulary Practice',
    type: 'vocabulary',
    description: 'Practice new vocabulary words with example sentences',
    goals: [
      'Learn new vocabulary words',
      'Practice using words in context',
      'Review word meanings'
    ],
    steps: [
      {
        prompt: 'Write a sentence using the word "{word}"',
        hint: 'Think about common situations where this word is used'
      },
      {
        prompt: 'Provide a synonym for "{word}"',
        hint: 'Consider words with similar meanings'
      }
    ]
  },
  grammar: {
    name: 'Grammar Exercise',
    type: 'grammar',
    description: 'Practice specific grammar patterns',
    goals: [
      'Understand grammar rules',
      'Practice correct usage',
      'Identify common mistakes'
    ],
    steps: [
      {
        prompt: 'Complete the sentence using the correct form',
        hint: 'Pay attention to tense and agreement'
      }
    ]
  }
} as const 