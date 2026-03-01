import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { createBoard } from '../api'

export default function DashboardPage() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [creating, setCreating] = useState(false)

    const handleCreateBoard = async () => {
        try {
            setCreating(true)
            const boardId = await createBoard()
            navigate(`/board/${boardId}`)
        } catch (err) {
            console.error(err)
            alert('Failed to create board')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="dashboard-page">
            <header className="topbar">
                <div className="topbar-brand">
                    <div className="logo-dot">✏️</div>
                    CollabBoard
                </div>
                <div className="topbar-user">
                    {user?.image ? (
                        <img src={user.image} alt={user.name} className="user-avatar" />
                    ) : (
                        <div className="user-avatar-placeholder">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
                    <button className="btn btn-ghost" onClick={logout} style={{ marginLeft: 12 }}>
                        Log out
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-header">
                    <h2>Your Workspaces</h2>
                </div>

                <div className="boards-grid">
                    <div className="new-board-card" onClick={handleCreateBoard}>
                        {creating ? (
                            <div className="spinner" />
                        ) : (
                            <>
                                <div className="plus-icon">+</div>
                                Create New Board
                            </>
                        )}
                    </div>

                    {/* We could fetch and list user boards here if requirement existed, 
              but the core requirement focuses on creation and loading via URLs */}
                </div>
            </main>
        </div>
    )
}
