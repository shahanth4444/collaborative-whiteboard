import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || '/'

export const useSocket = (boardId: string | undefined) => {
    const socketRef = useRef<Socket | null>(null)
    const user = useAuthStore(state => state.user)

    useEffect(() => {
        if (!boardId) return

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'] // Try WS first
        })

        socketRef.current = socket

        socket.on('connect', () => {
            console.log('Connected to socket', socket.id)
            socket.emit('joinRoom', {
                boardId,
                userName: user?.name || 'Guest'
            })
        })

        socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [boardId, user])

    return socketRef.current
}
