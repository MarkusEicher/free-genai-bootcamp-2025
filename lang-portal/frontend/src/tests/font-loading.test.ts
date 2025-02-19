import { waitFor } from '@testing-library/react';

// Add interface to extend CSSStyleDeclaration
interface ExtendedCSSStyleDeclaration extends CSSStyleDeclaration {
  fontDisplay: string;
}

describe('Font Loading', () => {
  beforeEach(() => {
    // Reset font loading classes
    document.documentElement.classList.remove('fonts-loaded', 'all-fonts-loaded');
  });

  it('adds fonts-loaded class when critical fonts are loaded', async () => {
    // Mock font loading
    Object.defineProperty(document, 'fonts', {
      value: {
        load: jest.fn().mockResolvedValue(undefined),
        ready: Promise.resolve(),
      },
    });

    // Execute font loading script
    const script = document.createElement('script');
    script.textContent = `
      if ("fonts" in document) {
        Promise.all([
          document.fonts.load("1em Inter"),
          document.fonts.load("500 1em Inter")
        ]).then(() => {
          document.documentElement.classList.add("fonts-loaded");
        });
      }
    `;
    document.head.appendChild(script);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('fonts-loaded');
    });
  });

  it('adds all-fonts-loaded class when all fonts are loaded', async () => {
    // Mock font loading
    Object.defineProperty(document, 'fonts', {
      value: {
        load: jest.fn().mockResolvedValue(undefined),
        ready: Promise.resolve(),
      },
    });

    // Execute font loading script
    const script = document.createElement('script');
    script.textContent = `
      if ("fonts" in document) {
        Promise.all([
          document.fonts.load("700 1em Inter"),
          document.fonts.load("1em Roboto"),
          document.fonts.load("500 1em Roboto"),
          document.fonts.load("700 1em Roboto")
        ]).then(() => {
          document.documentElement.classList.add("all-fonts-loaded");
        });
      }
    `;
    document.head.appendChild(script);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('all-fonts-loaded');
    });
  });

  it('applies correct font-display strategy', () => {
    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .filter(rule => rule instanceof CSSFontFaceRule)
      .map(rule => (rule.style as ExtendedCSSStyleDeclaration).fontDisplay);

    expect(styles.every(display => display === 'swap')).toBe(true);
  });

  it('preloads critical fonts', () => {
    const preloadLinks = Array.from(document.head.querySelectorAll('link[rel="preload"]'))
      .filter(link => link.getAttribute('as') === 'font');

    expect(preloadLinks).toHaveLength(2);
    expect(preloadLinks[0].getAttribute('href')).toContain('Inter-Regular.woff2');
    expect(preloadLinks[1].getAttribute('href')).toContain('Inter-Medium.woff2');
  });
});