import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getTodayWIB, getCurrentWorkingDate, advanceWorkingDate } from '../../lib/dateUtils'
import styles from './TodoList.module.css'

function useCurrentDate() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow - now

    const timeout = setTimeout(() => {
      setDate(new Date())
    }, msUntilMidnight)

    const interval = setInterval(() => {
      setDate(new Date())
    }, 24 * 60 * 60 * 1000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [date])

  return date
}

function formatDate(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export default function TodoList() {
  const currentDate = useCurrentDate()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [workingDate, setWorkingDate] = useState(getCurrentWorkingDate())
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null })

  useEffect(() => {
    // Check if real date has changed (midnight passed)
    const today = getTodayWIB()
    const currentWorking = getCurrentWorkingDate()
    
    // If working date is in the past, reset to today
    if (currentWorking < today) {
      setWorkingDate(today)
    }
    
    fetchTodos()
  }, [currentDate])

  function showAlert(title, message, type = 'info', onConfirm = null) {
    setAlertModal({ show: true, title, message, type, onConfirm })
  }

  function closeAlert() {
    setAlertModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
  }

  async function fetchTodos() {
    try {
      setLoading(true)
      const currentWorking = getCurrentWorkingDate()
      
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('date', currentWorking)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addTodo(e) {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      const currentWorking = getCurrentWorkingDate()
      const { data, error } = await supabase
        .from('todos')
        .insert([{ text: newTodo.trim(), completed: false, date: currentWorking }])
        .select()

      if (error) throw error
      setTodos([data[0], ...todos])
      setNewTodo('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleTodo(id, completed) {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteTodo(id) {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleAll() {
    const newCompleted = !allCompleted
    try {
      const ids = todos.map(t => t.id)
      const { error } = await supabase
        .from('todos')
        .update({ completed: newCompleted })
        .in('id', ids)

      if (error) throw error
      setTodos(todos.map(todo => ({ ...todo, completed: newCompleted })))
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteCompletedTodos() {
    if (completedCount === 0) return
    showAlert(
      'Hapus Todo Selesai?',
      `Hapus ${completedCount} todo yang sudah selesai?`,
      'confirm',
      async () => {
        try {
          const completedIds = todos.filter(t => t.completed).map(t => t.id)
          const { error } = await supabase
            .from('todos')
            .delete()
            .in('id', completedIds)

          if (error) throw error
          setTodos(todos.filter(todo => !todo.completed))
          closeAlert()
        } catch (err) {
          setError(err.message)
        }
      }
    )
  }

  function completeDay() {
    showAlert(
      'Selesaikan Hari Ini?',
      'Semua task akan dipindah ke history dan kamu bisa mulai task untuk hari berikutnya.',
      'confirm',
      () => {
        const nextDate = advanceWorkingDate()
        setWorkingDate(nextDate)
        setTodos([])
        closeAlert()
        setTimeout(() => {
          showAlert('Selesai!', 'Task hari ini sudah dipindah ke history. Sekarang kamu bisa tambah task untuk besok! 🎉', 'success')
        }, 100)
      }
    )
  }

  const completedCount = todos.filter(t => t.completed).length
  const pendingCount = todos.length - completedCount
  const allCompleted = todos.length > 0 && completedCount === todos.length

  return (
    <div className={styles.container}>
      <div className={styles.dateBar}>
        <div className={styles.dateInfo}>
          <svg className={styles.calendarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formatDate(currentDate)}</span>
        </div>
        <button className={styles.tutorialButton} onClick={() => setShowTutorial(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </button>
      </div>

      {showTutorial && (
        <div className={styles.modalOverlay} onClick={() => setShowTutorial(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Cara Penggunaan</h2>
              <button className={styles.closeButton} onClick={() => setShowTutorial(false)}>×</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>
                <div>
                  <strong>Tambah Todo</strong>
                  <p>Ketik tugas di kolom input lalu klik tombol + untuk menambahkan todo baru.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Selesaikan Todo</strong>
                  <p>Klik checkbox di sebelah kiri todo untuk menandai selesai atau belum selesai.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </span>
                <div>
                  <strong>Hapus Todo</strong>
                  <p>Klik icon tempat sampah di sebelah kanan todo untuk menghapusnya.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                </span>
                <div>
                  <strong>Pilih/Batalkan Semua</strong>
                  <p>Klik tombol untuk memilih semua todo sekaligus, atau batalkan semua jika sudah terpilih.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <strong>Complete Day</strong>
                  <p>Klik tombol Complete Day untuk menyelesaikan task hari ini. Semua task akan dipindah ke history dan kamu bisa langsung mulai task untuk hari berikutnya tanpa tunggu pergantian hari.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M12 7v5l4 2"/>
                  </svg>
                </span>
                <div>
                  <strong>History</strong>
                  <p>Lihat riwayat todo berdasarkan tanggal di tab History. Klik tanggal untuk melihat detail todo yang selesai dan belum selesai.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <div>
                  <strong>Reset Harian</strong>
                  <p>Jika tidak klik Complete Day, todo otomatis masuk history saat pergantian hari (00:00 WIB). Halaman utama akan kosong untuk hari baru.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </span>
                <div>
                  <strong>Data Tersimpan</strong>
                  <p>Semua todo tersimpan di cloud (Supabase), sehingga bisa diakses dari device manapun.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertModal.show && (
        <div className={styles.modalOverlay} onClick={closeAlert}>
          <div className={styles.alertModal} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.alertIcon} ${styles[alertModal.type]}`}>
              {alertModal.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {alertModal.type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
              {alertModal.type === 'confirm' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
              {alertModal.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <h3 className={styles.alertTitle}>{alertModal.title}</h3>
            <p className={styles.alertMessage}>{alertModal.message}</p>
            <div className={styles.alertButtons}>
              {alertModal.onConfirm ? (
                <>
                  <button className={styles.alertButtonCancel} onClick={closeAlert}>Batal</button>
                  <button className={styles.alertButtonConfirm} onClick={alertModal.onConfirm}>Ya, Lanjutkan</button>
                </>
              ) : (
                <button className={styles.alertButtonConfirm} onClick={closeAlert}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>✨ Todo List</h1>
        <p className={styles.subtitle}>Powered by Supabase</p>
      </header>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <form className={styles.form} onSubmit={addTodo}>
        <input
          type="text"
          className={styles.input}
          placeholder="Apa yang ingin kamu kerjakan?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <button 
          type="submit" 
          className={styles.addButton}
          disabled={!newTodo.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </form>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          Memuat data...
        </div>
      ) : todos.length === 0 ? (
        <div className={styles.empty}>
          Belum ada todo. Mulai tambahkan!
        </div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
              <span className={styles.statNumber}>{pendingCount}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
            <div className={styles.stat}>
              <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className={styles.statNumber}>{completedCount}</span>
              <span className={styles.statLabel}>Selesai</span>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.actionButton}
              onClick={toggleAll}
              disabled={todos.length === 0}
            >
              {allCompleted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                  Batalkan Semua
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Pilih Semua
                </>
              )}
            </button>
            <button 
              className={styles.actionButton}
              onClick={completeDay}
              disabled={todos.length === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Complete Day
            </button>
          </div>
          
          <ul className={styles.list}>
            {todos.map(todo => (
              <li key={todo.id} className={`${styles.todoItem} ${todo.completed ? styles.todoItemCompleted : ''}`}>
                <label className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <span className={styles.checkboxCustom}>
                    {todo.completed && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.checkIcon}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                </label>
                <span className={`${styles.todoText} ${todo.completed ? styles.completed : ''}`}>
                  {todo.text}
                </span>
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteTodo(todo.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
