import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useCanvasStore } from '../store/canvasStore'
import { loadBoard, saveBoard } from '../api'
import Canvas from '../components/Canvas'
import Toolbar from '../components/Toolbar'
import UserList from '../components/UserList'
import RemoteCursors from '../components/RemoteCursors'

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || '/'

export default function BoardPage() {
    const { boardId } = useParams<{ boardId: string }>()
    const user = useAuthStore(state => state.user)
    const { objects, setObjects } = useCanvasStore()

    const [socket, setSocket] = useState<any>(null)
    const [connected, setConnected] = useState(false)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!boardId) return

        // Load initial board state from API
        loadBoard(boardId).then(data => {
            setObjects(data)
            setLoading(false)
        }).catch(err => {
            console.error('Error loading board', err)
            setLoading(false)
        })

        // Setup Socket
        const s = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        })

        setSocket(s)

        s.on('connect', () => {
            setConnected(true)
            s.emit('joinRoom', {
                boardId,
                userName: user?.name || 'Guest'
            })
        })

        s.on('disconnect', () => setConnected(false))

        return () => {
            s.disconnect()
        }
    }, [boardId, user])

    const handleSave = async () => {
        if (!boardId) return
        try {
            setSaving(true)
            await saveBoard(boardId, objects)
            // Slight delay for visual feedback
            setTimeout(() => setSaving(false), 500)
        } catch (err) {
            console.error(err)
            alert('Failed to save')
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <span>Loading board...</span>
            </div>
        )
    }

    return (
        <div className="board-layout">
            <header className="board-topbar">
                <Link to="/dashboard" className="board-brand">
                    <div className="logo-dot">✏️</div>
                    CollabBoard
                </Link>

                <div className="board-center">
                    <span className="board-name-tag">Board: {boardId?.substring(0, 8)}...</span>
                </div>

                <div className="board-actions">
                    <div className={`connection-status ${connected ? 'status-connected' : 'status-disconnected'}`}>
                        <div className="status-dot" />
                        {connected ? 'Syncing' : 'Offline'}
                    </div>
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={saving || !connected}
                    >
                        {saving ? 'Saving...' : 'Save Board'}
                    </button>
                </div>
            </header>

            <div className="board-body">
                <Toolbar />

                <div className="canvas-area">
                    {socket && boardId && (
                        <>
                            <Canvas boardId={boardId} socket={socket} />
                            <RemoteCursors boardId={boardId} socket={socket} />
                        </>
                    )}
                </div>

                <div className="right-panel">
                    <div className="panel-section">
                        <h4>Active Users</h4>
                        {socket && <UserList socket={socket} />}
                    </div>
                </div>
            </div>
        </div>
    )
}
