import { useState } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import { useParams } from 'react-router-dom'

export default function Toolbar() {
    const {
        activeTool, setTool, color, setColor,
        brushSize, setBrushSize,
        undo, redo
    } = useCanvasStore()
    const user = useAuthStore(state => state.user)
    const [showSize, setShowSize] = useState(false)
    const { boardId } = useParams<{ boardId: string }>()
    const socket = useSocket(boardId)

    const handleUndo = () => {
        if (!user || !socket || !boardId) return
        undo(user.id, (id) => {
            socket.emit('deleteObject', { boardId, id })
        })
    }

    const handleRedo = () => {
        if (!user || !socket || !boardId) return
        redo(user.id, (obj) => {
            socket.emit('addObject', { boardId, ...obj })
        })
    }

    return (
        <div className="toolbar">
            <button
                className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
                onClick={() => setTool('pen')}
                title="Pen"
                data-testid="tool-pen"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <circle cx="11" cy="11" r="2" />
                </svg>
            </button>

            <button
                className={`tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
                onClick={() => setTool('rectangle')}
                title="Rectangle"
                data-testid="tool-rectangle"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
            </button>

            <div className="tool-divider" />

            <div className="color-picker-wrapper">
                <div className="color-swatch" style={{ backgroundColor: color }}>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        title="Color Picker"
                    />
                </div>
            </div>

            <div className="tool-btn brush-display" onClick={() => setShowSize(!showSize)} title="Brush Size">
                <div style={{ width: Math.max(2, brushSize), height: Math.max(2, brushSize), backgroundColor: color, borderRadius: '50%' }} />
                <span>{brushSize}</span>
            </div>

            {showSize && (
                <div className="size-popup">
                    <label>Brush Size ({brushSize}px)</label>
                    <input
                        type="range"
                        min="1" max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="tool-divider" />

            <button
                className="tool-btn"
                onClick={handleUndo}
                title="Undo"
                data-testid="undo-button"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            </button>

            <button
                className="tool-btn"
                onClick={handleRedo}
                title="Redo"
                data-testid="redo-button"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
                </svg>
            </button>
        </div>
    )
}
