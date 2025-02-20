import { useState, useCallback, KeyboardEvent } from 'react';

type Section = 'stats' | 'progress' | 'sessions';

export function useDashboardKeyboardNav() {
  const [currentSection, setCurrentSection] = useState<Section>('stats');

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setCurrentSection((current) => {
        switch (current) {
          case 'stats':
            return 'progress';
          case 'progress':
            return 'sessions';
          case 'sessions':
            return 'stats';
          default:
            return 'stats';
        }
      });
    }
  }, []);

  return {
    currentSection,
    handleKeyDown,
  };
} 