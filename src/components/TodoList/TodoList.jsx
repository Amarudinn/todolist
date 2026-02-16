import { useState, useEffect, useRef } from 'react'
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

function formatDate(dateStr) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const date = new Date(dateStr + 'T00:00:00')
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

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const editInputRef = useRef(null)

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', retryFn: null })
  const toastTimeout = useRef(null)

  useEffect(() => {
    const today = getTodayWIB()
    const currentWorking = getCurrentWorkingDate()

    if (currentWorking < today) {
      setWorkingDate(today)
    }

    fetchTodos()
  }, [currentDate])

  // Focus edit input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  function showToast(message, retryFn = null) {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ show: true, message, retryFn })
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: '', retryFn: null })
    }, 5000)
  }

  function closeToast() {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ show: false, message: '', retryFn: null })
  }

  function showAlert(title, message, type = 'info', onConfirm = null) {
    setAlertModal({ show: true, title, message, type, onConfirm })
  }

  function closeAlert() {
    setAlertModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
  }

  async function autoInsertTemplates(currentWorking) {
    try {
      const lastAutoInsert = localStorage.getItem('lastAutoInsertDate')
      if (lastAutoInsert === currentWorking) return []

      const { data: templates, error: tErr } = await supabase
        .from('todo_templates')
        .select('*')
        .order('sort_order', { ascending: true })

      if (tErr) throw tErr
      if (!templates || templates.length === 0) return []

      const todosToInsert = templates.map(t => ({
        text: t.text,
        completed: false,
        date: currentWorking,
      }))

      const { data: inserted, error: iErr } = await supabase
        .from('todos')
        .insert(todosToInsert)
        .select()

      if (iErr) throw iErr

      localStorage.setItem('lastAutoInsertDate', currentWorking)
      return inserted || []
    } catch (err) {
      console.error('Auto-insert templates failed:', err.message)
      return []
    }
  }

  async function fetchTodos() {
    try {
      setLoading(true)
      setError(null)
      const currentWorking = getCurrentWorkingDate()

      const { data, error: fetchErr } = await supabase
        .from('todos')
        .select('*')
        .eq('date', currentWorking)
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr

      if (data && data.length > 0) {
        setTodos(data)
      } else {
        // No todos for today — try auto-inserting from templates
        const autoTodos = await autoInsertTemplates(currentWorking)
        setTodos(autoTodos.reverse()) // newest first
      }
    } catch (err) {
      setError(err.message)
      showToast('Gagal memuat data', () => fetchTodos())
    } finally {
      setLoading(false)
    }
  }

  async function addTodo(e) {
    e.preventDefault()
    if (!newTodo.trim()) return

    const text = newTodo.trim()
    setNewTodo('')

    try {
      const currentWorking = getCurrentWorkingDate()
      const { data, error: addErr } = await supabase
        .from('todos')
        .insert([{ text, completed: false, date: currentWorking }])
        .select()

      if (addErr) throw addErr
      setTodos([data[0], ...todos])
    } catch (err) {
      setNewTodo(text)
      showToast('Gagal menambah todo', () => addTodo({ preventDefault: () => { } }))
    }
  }

  async function toggleTodo(id, completed) {
    // Optimistic update
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !completed } : todo
    ))

    try {
      const { error: toggleErr } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (toggleErr) throw toggleErr
    } catch (err) {
      // Revert on error
      setTodos(prev => prev.map(todo =>
        todo.id === id ? { ...todo, completed } : todo
      ))
      showToast('Gagal mengubah status', () => toggleTodo(id, completed))
    }
  }

  async function deleteTodo(id) {
    const removed = todos.find(t => t.id === id)
    setTodos(prev => prev.filter(todo => todo.id !== id))

    try {
      const { error: delErr } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (delErr) throw delErr
    } catch (err) {
      // Revert on error
      if (removed) setTodos(prev => [...prev, removed])
      showToast('Gagal menghapus todo', () => deleteTodo(id))
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  async function saveEdit(id) {
    const trimmed = editText.trim()
    if (!trimmed) return cancelEdit()

    const original = todos.find(t => t.id === id)
    if (trimmed === original?.text) return cancelEdit()

    // Optimistic update
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, text: trimmed } : todo
    ))
    setEditingId(null)
    setEditText('')

    try {
      const { error: editErr } = await supabase
        .from('todos')
        .update({ text: trimmed })
        .eq('id', id)

      if (editErr) throw editErr
    } catch (err) {
      // Revert on error
      if (original) {
        setTodos(prev => prev.map(todo =>
          todo.id === id ? { ...todo, text: original.text } : todo
        ))
      }
      showToast('Gagal menyimpan perubahan')
    }
  }

  function handleEditKeyDown(e, id) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  async function toggleAll() {
    const newCompleted = !allCompleted
    const prevTodos = [...todos]
    setTodos(prev => prev.map(todo => ({ ...todo, completed: newCompleted })))

    try {
      const ids = todos.map(t => t.id)
      const { error: toggleErr } = await supabase
        .from('todos')
        .update({ completed: newCompleted })
        .in('id', ids)

      if (toggleErr) throw toggleErr
    } catch (err) {
      setTodos(prevTodos)
      showToast('Gagal mengubah semua status', () => toggleAll())
    }
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
        // Auto-insert templates for the new day
        autoInsertTemplates(nextDate).then(autoTodos => {
          if (autoTodos.length > 0) {
            setTodos(autoTodos.reverse())
          }
        })
        setTimeout(() => {
          showAlert('Selesai!', 'Task hari ini sudah dipindah ke history. 🎉', 'success')
        }, 100)
      }
    )
  }

  const completedCount = todos.filter(t => t.completed).length
  const pendingCount = todos.length - completedCount
  const allCompleted = todos.length > 0 && completedCount === todos.length

  return (
    <div className={styles.container}>
      {/* Date Bar - shows working date */}
      <div className={styles.dateBar}>
        <div className={styles.dateInfo}>
          <svg className={styles.calendarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatDate(workingDate)}</span>
        </div>
        <button className={styles.tutorialButton} onClick={() => setShowTutorial(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>

      {/* Tutorial Modal */}
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
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <div>
                  <strong>Tambah Todo</strong>
                  <p>Ketik tugas di kolom input lalu klik + untuk menambahkan.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <strong>Selesaikan Todo</strong>
                  <p>Klik checkbox untuk menandai selesai/belum.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </span>
                <div>
                  <strong>Edit Todo</strong>
                  <p>Klik teks todo untuk mengeditnya. Tekan Enter untuk simpan, Escape untuk batal.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </span>
                <div>
                  <strong>Hapus Todo</strong>
                  <p>Klik icon hapus di sebelah kanan todo.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <strong>Complete Day</strong>
                  <p>Selesaikan hari ini dan mulai task besok tanpa tunggu pergantian hari.</p>
                </div>
              </div>
              <div className={styles.tutorialItem}>
                <span className={styles.tutorialIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <div>
                  <strong>Auto Templates</strong>
                  <p>Buat template di tab Templates. Todo akan otomatis ditambahkan saat ganti hari.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.show && (
        <div className={styles.modalOverlay} onClick={closeAlert}>
          <div className={styles.alertModal} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.alertIcon} ${styles[alertModal.type]}`}>
              {alertModal.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {alertModal.type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {alertModal.type === 'confirm' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {alertModal.type === 'info' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
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

      {/* Toast */}
      {toast.show && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          <span className={styles.toastMessage}>⚠️ {toast.message}</span>
          {toast.retryFn && (
            <button className={styles.toastRetry} onClick={() => { closeToast(); toast.retryFn(); }}>
              Retry
            </button>
          )}
          <button className={styles.toastClose} onClick={closeToast}>×</button>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>✨ Todo List</h1>
        <p className={styles.subtitle}>Powered by Supabase</p>
      </header>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      {/* Add Todo Form */}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </form>

      {/* Content */}
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
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
              <span className={styles.statNumber}>{pendingCount}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
            <div className={styles.stat}>
              <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className={styles.statNumber}>{completedCount}</span>
              <span className={styles.statLabel}>Selesai</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={toggleAll}
              disabled={todos.length === 0}
            >
              {allCompleted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  Batalkan
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Complete Day
            </button>
          </div>

          {/* Todo List */}
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </label>
                {editingId === todo.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    className={styles.editInput}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                    onBlur={() => saveEdit(todo.id)}
                  />
                ) : (
                  <span
                    className={`${styles.todoText} ${todo.completed ? styles.completed : ''}`}
                    onClick={() => startEdit(todo)}
                  >
                    {todo.text}
                  </span>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteTodo(todo.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
