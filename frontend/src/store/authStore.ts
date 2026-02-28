import { create } from 'zustand'

export interface User {
    id: string
    name: string
    email: string
    image: string
}

interface AuthState {
    user: User | null
    loading: boolean
    fetchSession: () => Promise<void>
    checkSession: () => Promise<void>
    logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    loading: true,
    fetchSession: async () => {
        try {
            const res = await fetch('/api/auth/session')
            if (res.ok) {
                const data = await res.json()
                set({ user: data.user, loading: false })
            } else {
                set({ user: null, loading: false })
            }
        } catch (err) {
            console.error('Session fetch failed', err)
            set({ user: null, loading: false })
        }
    },
    checkSession: async () => {
        await get().fetchSession()
    },
    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            set({ user: null })
            window.location.href = '/login'
        } catch (err) {
            console.error('Logout failed', err)
        }
    },
}))
