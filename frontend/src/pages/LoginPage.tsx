import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { motion, Variants } from 'framer-motion'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [pageLoaded, setPageLoaded] = useState(false)
    const navigate = useNavigate()
    const checkSession = useAuthStore(state => state.checkSession)

    useEffect(() => {
        // Trigger generic tracking flag if needed
        const timer = setTimeout(() => setPageLoaded(true), 50)
        return () => clearTimeout(timer)
    }, [])

    const handleGoogleLogin = () => {
        setLoading(true)
        window.location.href = '/api/auth/google'
    }

    const handleGuestLogin = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/guest', { method: 'POST' })
            if (res.ok) {
                await checkSession()
                navigate('/dashboard')
            }
        } catch (err) {
            console.error('Guest login failed', err)
        } finally {
            setLoading(false)
        }
    }

    // Framer Motion Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94], // cubic bezier for smooth spring-like feel
                staggerChildren: 0.15
            }
        }
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    }

    return (
        <div className={`login-page ${pageLoaded ? 'loaded' : ''}`}>
            <motion.div
                className="login-card"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="login-logo-container">
                    <motion.div
                        className="login-logo"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ✏️
                    </motion.div>
                    <div className="pulse-ring"></div>
                </motion.div>

                <motion.h1 variants={itemVariants}>CollabBoard</motion.h1>
                <motion.p variants={itemVariants}>
                    Real-time collaborative whiteboard for teams. Draw, design, and create together.
                </motion.p>

                <motion.div variants={itemVariants} className="auth-buttons">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="oauth-btn google-btn"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </motion.button>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="oauth-btn guest-btn"
                        onClick={handleGuestLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        ) : (
                            <>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20, flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Continue as Guest
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </motion.div>
        </div>
    )
}
