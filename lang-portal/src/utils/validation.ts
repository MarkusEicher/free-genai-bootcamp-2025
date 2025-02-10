import { z } from 'zod'

export const WordSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  translation: z.string().min(1, 'Translation is required'),
  groupId: z.string().nullable().optional(),
  id: z.string().optional(),
})

export const GroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  id: z.string().optional(),
})

export type WordInput = z.infer<typeof WordSchema>
export type GroupInput = z.infer<typeof GroupSchema>
