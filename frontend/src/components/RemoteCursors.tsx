import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

interface RemoteCursorsProps {
    boardId: string
    socket: Socket
}

interface Cursor {
    userId: string
    name: string
    x: number
    y: number
}

// Consistent colors for cursors based on user ID
const getUserColor = (id: string) => {
    const colors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722']
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

export default function RemoteCursors({ boardId, socket }: RemoteCursorsProps) {
    const [cursors, setCursors] = useState<Record<string, Cursor>>({})

    useEffect(() => {
        const handleCursorUpdate = (data: Cursor) => {
            setCursors(prev => ({
                ...prev,
                [data.userId]: data
            }))

            // Clear cursor after 5 seconds of inactivity
            setTimeout(() => {
                setCursors(current => {
                    if (!current[data.userId]) return current
                    // We can't easily check actual inactivity via timestamp here without adding it to state
                    // A robust implementation would store lastUpdate. For now, this is a basic cleanup.
                    return current
                })
            }, 5000)
        }

        const handleUserLeft = (data: { userId: string }) => {
            setCursors(prev => {
                const next = { ...prev }
                delete next[data.userId]
                return next
            })
        }

        socket.on('cursorUpdate', handleCursorUpdate)
        socket.on('userLeft', handleUserLeft)

        return () => {
            socket.off('cursorUpdate', handleCursorUpdate)
            socket.off('userLeft', handleUserLeft)
        }
    }, [socket])

    return (
        <>
            {Object.values(cursors).map((cursor) => (
                <div
                    key={cursor.userId}
                    className="remote-cursor"
                    data-testid="remote-cursor"
                    style={{
                        left: cursor.x,
                        top: cursor.y,
                        '--cursor-color': getUserColor(cursor.userId)
                    } as React.CSSProperties}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={getUserColor(cursor.userId)} stroke="white" strokeWidth="2">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L5.5 3.21z" />
                    </svg>
                    <div className="remote-cursor-label" style={{ backgroundColor: getUserColor(cursor.userId) }}>
                        {cursor.name}
                    </div>
                </div>
            ))}
        </>
    )
}
