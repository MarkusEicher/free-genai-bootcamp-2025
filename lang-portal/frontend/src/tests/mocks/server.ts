import { setupServer } from 'msw/node'
import { http } from 'msw'

export const handlers = [
  http.get('/api/vocabulary', () => {
    return Response.json([
      {
        id: 1,
        word: 'Test Word 1',
        translation: 'Translation 1',
        progress: 0.5
      },
      {
        id: 2,
        word: 'Other Word',
        translation: 'Translation 2',
        progress: 0.7
      }
    ])
  }),

  http.get('/api/vocabulary/groups', () => {
    return Response.json([
      {
        id: 1,
        name: 'Test Group 1',
        wordCount: 2
      }
    ])
  }),

  http.post('/api/vocabulary/groups', async ({ request }) => {
    const { name } = await request.json() as { name: string }
    return Response.json({
      id: 2,
      name,
      wordCount: 0
    })
  })
]

export const server = setupServer(...handlers) 