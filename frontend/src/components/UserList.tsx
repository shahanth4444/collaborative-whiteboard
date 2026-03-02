import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

interface UserListProps {
    socket: Socket
}

interface User {
    id: string
    name: string
}

// Simple color hash based on ID
const stringToColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 16777215)).toString(16)
    return '#' + '000000'.substring(0, 6 - color.length) + color
}

export default function UserList({ socket }: UserListProps) {
    const [users, setUsers] = useState<User[]>([])

    useEffect(() => {
        socket.on('roomUsers', (data: { users: User[] }) => {
            setUsers(data.users)
        })

        return () => {
            socket.off('roomUsers')
        }
    }, [socket])

    return (
        <div className="user-list" data-testid="user-list">
            {users.map((u) => (
                <div key={u.id} className="user-item">
                    <div className="user-dot" style={{ backgroundColor: stringToColor(u.id) }} />
                    <span className="user-name" title={u.name}>{u.name}</span>
                </div>
            ))}
            {users.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No users</div>
            )}
        </div>
    )
}
