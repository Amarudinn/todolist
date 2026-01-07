import { useState } from 'react'
import styles from './Login.module.css'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const correctPassword = import.meta.env.VITE_APP_PASSWORD

    setTimeout(() => {
      if (password === correctPassword) {
        localStorage.setItem('todo_authenticated', 'true')
        onLogin()
      } else {
        setError('Password salah!')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <svg className={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h1 className={styles.title}>Todo PWA</h1>
          <p className={styles.subtitle}>Masukkan password untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <div className={styles.error}>{error}</div>}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading || !password}
          >
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
