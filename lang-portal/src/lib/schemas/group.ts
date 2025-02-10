import { z } from 'zod'

export const GroupSchema = z.object({
  name: z.string().min(1, 'Group name is required')
})

export type GroupInput = z.infer<typeof GroupSchema> 