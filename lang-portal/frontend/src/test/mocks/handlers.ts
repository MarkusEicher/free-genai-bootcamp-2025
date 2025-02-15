import { http, HttpResponse } from 'msw'

export const handlers = [
  // Vocabulary endpoints
  http.get('/api/vocabulary', () => {
    return HttpResponse.json([
      { id: 1, word: 'Hello', translation: 'Hola', group: 'Basics' },
      { id: 2, word: 'Goodbye', translation: 'Adiós', group: 'Basics' }
    ])
  }),

  // Sessions endpoints
  http.get('/api/sessions', () => {
    return HttpResponse.json([
      {
        id: 1,
        date: '2024-03-15',
        activities: [
          { id: 1, name: 'Vocabulary Quiz', score: 0.85 }
        ],
        overallScore: 0.85
      }
    ])
  }),

  // Activities endpoints
  http.get('/api/activities', () => {
    return HttpResponse.json([
      {
        id: 1,
        title: 'Vocabulary Quiz',
        description: 'Test your vocabulary',
        duration: '10 minutes',
        difficulty: 'Medium',
        type: 'quiz'
      }
    ])
  }),

  // Settings endpoints
  http.get('/api/settings', () => {
    return HttpResponse.json({
      theme: 'light'
    })
  })
] 