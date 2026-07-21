const STORAGE_KEY = 'sg_theme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
}
