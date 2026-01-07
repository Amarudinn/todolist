import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './History.module.css'

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export default function History() {
  const [history, setHistory] = useState({})
  const [expandedDate, setExpandedDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by date
      const grouped = (data || []).reduce((acc, todo) => {
        const date = new Date(todo.created_at).toLocaleDateString('en-CA')
        if (!acc[date]) acc[date] = []
        acc[date].push(todo)
        return acc
      }, {})

      setHistory(grouped)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const dates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a))

  if (loading) {
    return <div className={styles.loading}>Memuat history...</div>
  }

  if (dates.length === 0) {
    return <div className={styles.empty}>Belum ada history</div>
  }

  return (
    <div className={styles.container}>
      {dates.map(date => {
        const todos = history[date]
        const completed = todos.filter(t => t.completed)
        const pending = todos.filter(t => !t.completed)
        const isExpanded = expandedDate === date

        return (
          <div key={date} className={styles.dateGroup}>
            <button 
              className={styles.dateHeader}
              onClick={() => setExpandedDate(isExpanded ? null : date)}
            >
              <div className={styles.dateInfo}>
                <svg className={styles.calendarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{formatDate(date)}</span>
              </div>
              <div className={styles.dateMeta}>
                <span className={styles.badge}>{completed.length} selesai</span>
                <span className={`${styles.badge} ${styles.badgePending}`}>{pending.length} pending</span>
                <svg 
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className={styles.todoList}>
                {completed.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Selesai
                    </div>
                    {completed.map(todo => (
                      <div key={todo.id} className={`${styles.todoItem} ${styles.completed}`}>
                        {todo.text}
                      </div>
                    ))}
                  </div>
                )}
                {pending.length > 0 && (
                  <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                      Belum Selesai
                    </div>
                    {pending.map(todo => (
                      <div key={todo.id} className={styles.todoItem}>
                        {todo.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
