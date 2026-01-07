import { useState, useEffect } from 'react'
import TodoList from './components/TodoList/TodoList'
import History from './components/History/History'
import Login from './components/Login/Login'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('todos')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const auth = localStorage.getItem('todo_authenticated')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
    setCheckingAuth(false)
  }, [])

  if (checkingAuth) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <Login onLogin={() => setIsAuthenticated(true)} />
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            <path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/>
          </svg>
          Todo
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
          </svg>
          History
        </button>
      </nav>

      {activeTab === 'todos' ? <TodoList /> : <History />}

      <footer className="footer">
        <a href="https://x.com/m_amarudinn2" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l11.733 16h4.267l-11.733 -16z"/>
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/>
          </svg>
        </a>
        <a href="https://github.com/amarudinn" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
        </a>
      </footer>
    </div>
  )
}

export default App
