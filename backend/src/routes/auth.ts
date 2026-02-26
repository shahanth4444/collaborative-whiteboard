import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

const router = Router();

// Initiate Google OAuth
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (_req: Request, res: Response) => {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/dashboard`);
    }
);

// Guest bypass for testing
router.post('/guest', async (req: Request, res: Response) => {
    // Generate a proper UUID so PostgreSQL doesn't throw an invalid syntax error when referenced in sessions/boards
    const guestId = uuidv4();
    const guestUser = {
        id: guestId,
        name: `Guest ${Math.floor(Math.random() * 1000)}`,
        email: `guest_${guestId}@example.com`,
        image: ''
    };

    try {
        await pool.query(
            `INSERT INTO users (id, name, email, image) VALUES ($1, $2, $3, $4)`,
            [guestUser.id, guestUser.name, guestUser.email, guestUser.image]
        );

        req.login(guestUser, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to login guest' });
            }
            return res.status(200).json({ success: true, user: guestUser });
        });
    } catch (dbErr) {
        console.error('Failed to insert guest user into DB', dbErr);
        return res.status(500).json({ error: 'Database error' });
    }
});

// Get current session user
router.get('/session', (req: Request, res: Response) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = req.user as {
        id: string;
        name: string;
        email: string;
        image: string;
    };
    return res.status(200).json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || '',
        },
    });
});

// Logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true });
        });
    });
});

export default router;
