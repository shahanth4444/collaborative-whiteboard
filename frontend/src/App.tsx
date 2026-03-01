import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import BoardPage from './pages/BoardPage'
import { useAuthStore } from './store/authStore'

function App() {
    const { user, loading, fetchSession } = useAuthStore()

    useEffect(() => {
        fetchSession()
    }, [fetchSession])

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <span>Loading CollabBoard...</span>
            </div>
        )
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
                <Route path="/board/:boardId" element={user ? <BoardPage /> : <Navigate to="/login" />} />
                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
