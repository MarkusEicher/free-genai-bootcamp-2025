import { z } from 'zod'

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')

const themeColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  accent: hexColorSchema,
  background: hexColorSchema,
  text: hexColorSchema
})

const themeSettingsSchema = z.object({
  colors: themeColorsSchema,
  fontSize: z.enum(['small', 'medium', 'large']),
  borderRadius: z.enum(['none', 'small', 'medium', 'large']),
  spacing: z.enum(['compact', 'comfortable', 'spacious'])
})

const userSettingsSchema = z.object({
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  dailyGoal: z.number().min(1).max(240),
  emailNotifications: z.boolean(),
  soundEffects: z.boolean(),
  darkMode: z.boolean(),
  showTimer: z.boolean(),
  theme: themeSettingsSchema
})

export const importDataSchema = z.object({
  settings: userSettingsSchema,
  activities: z.array(z.object({
    id: z.number(),
    name: z.string(),
    progress: z.number().min(0).max(1),
    // ... other activity fields
  })),
  sessions: z.array(z.object({
    id: z.number(),
    date: z.string().datetime(),
    // ... other session fields
  }))
})

export function validateImportData(data: unknown) {
  return importDataSchema.safeParse(data)
} 