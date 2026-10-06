import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const KEY = 'aimbrace-theme'

function read(): boolean {
  return document.documentElement.classList.contains('dark')
}

/** Light and dark, remembered. The initial class is set before paint by a script in index.html. */
export function ThemeToggle() {
  const [dark, setDark] = useState(read)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return (
    <button
      type="button"
      className="btn btn-sm"
      style={{ width: '2.1rem', padding: 0, justifyContent: 'center' }}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => {
        const next = !dark
        setDark(next)
        try {
          localStorage.setItem(KEY, next ? 'dark' : 'light')
        } catch {
          /* private mode: the choice just is not remembered */
        }
      }}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
