import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './Templates.module.css'

export default function Templates() {
    const [templates, setTemplates] = useState([])
    const [newTemplate, setNewTemplate] = useState('')
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editText, setEditText] = useState('')
    const editInputRef = useRef(null)
    const [toast, setToast] = useState({ show: false, message: '' })
    const toastTimeout = useRef(null)

    useEffect(() => {
        fetchTemplates()
    }, [])

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [editingId])

    function showToast(message) {
        if (toastTimeout.current) clearTimeout(toastTimeout.current)
        setToast({ show: true, message })
        toastTimeout.current = setTimeout(() => {
            setToast({ show: false, message: '' })
        }, 4000)
    }

    function closeToast() {
        if (toastTimeout.current) clearTimeout(toastTimeout.current)
        setToast({ show: false, message: '' })
    }

    async function fetchTemplates() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('todo_templates')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true })

            if (error) throw error
            setTemplates(data || [])
        } catch (err) {
            showToast('Gagal memuat templates: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function addTemplate(e) {
        e.preventDefault()
        if (!newTemplate.trim()) return

        const text = newTemplate.trim()
        setNewTemplate('')

        try {
            const nextOrder = templates.length > 0
                ? Math.max(...templates.map(t => t.sort_order)) + 1
                : 0

            const { data, error } = await supabase
                .from('todo_templates')
                .insert([{ text, sort_order: nextOrder }])
                .select()

            if (error) throw error
            setTemplates([...templates, data[0]])
        } catch (err) {
            setNewTemplate(text)
            showToast('Gagal menambah template')
        }
    }

    async function deleteTemplate(id) {
        const removed = templates.find(t => t.id === id)
        setTemplates(prev => prev.filter(t => t.id !== id))

        try {
            const { error } = await supabase
                .from('todo_templates')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            if (removed) setTemplates(prev => [...prev, removed])
            showToast('Gagal menghapus template')
        }
    }

    function startEdit(template) {
        setEditingId(template.id)
        setEditText(template.text)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditText('')
    }

    async function saveEdit(id) {
        const trimmed = editText.trim()
        if (!trimmed) return cancelEdit()

        const original = templates.find(t => t.id === id)
        if (trimmed === original?.text) return cancelEdit()

        setTemplates(prev => prev.map(t =>
            t.id === id ? { ...t, text: trimmed } : t
        ))
        setEditingId(null)
        setEditText('')

        try {
            const { error } = await supabase
                .from('todo_templates')
                .update({ text: trimmed })
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            if (original) {
                setTemplates(prev => prev.map(t =>
                    t.id === id ? { ...t, text: original.text } : t
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>📋 Auto Templates</h2>
            </div>

            <form className={styles.form} onSubmit={addTemplate}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Tambah template baru..."
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value)}
                />
                <button
                    type="submit"
                    className={styles.addButton}
                    disabled={!newTemplate.trim()}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </form>

            {loading ? (
                <div className={styles.loading}>Memuat templates...</div>
            ) : templates.length === 0 ? (
                <div className={styles.empty}>
                    Belum ada template. Tambahkan todo yang sering kamu kerjakan setiap hari.
                </div>
            ) : (
                <div className={styles.list}>
                    {templates.map((template, index) => (
                        <div key={template.id} className={styles.templateItem}>
                            <span className={styles.orderBadge}>{index + 1}</span>
                            {editingId === template.id ? (
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    className={styles.editInput}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => handleEditKeyDown(e, template.id)}
                                    onBlur={() => saveEdit(template.id)}
                                />
                            ) : (
                                <span
                                    className={styles.templateText}
                                    onClick={() => startEdit(template)}
                                >
                                    {template.text}
                                </span>
                            )}
                            <button
                                className={styles.deleteButton}
                                onClick={() => deleteTemplate(template.id)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {toast.show && (
                <div className={styles.toast}>
                    <span className={styles.toastMessage}>⚠️ {toast.message}</span>
                    <button className={styles.toastClose} onClick={closeToast}>×</button>
                </div>
            )}
        </div>
    )
}
