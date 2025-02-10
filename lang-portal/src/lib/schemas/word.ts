import { z } from 'zod'

export const WordSchema = z.object({
  text: z.string().min(1, 'Word is required'),
  translation: z.string().min(1, 'Translation is required'),
  groupId: z.string().nullable().optional()
})

export type WordInput = z.infer<typeof WordSchema> 