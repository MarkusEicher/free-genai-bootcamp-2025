interface LanguageSelectorProps {
  name: string
  defaultValue?: string
  disabled?: boolean
}

export function LanguageSelector({ name, defaultValue, disabled }: LanguageSelectorProps) {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ]

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      className="mt-1 w-full p-2 border rounded"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  )
} 