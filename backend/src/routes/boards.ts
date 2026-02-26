import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Auth middleware
function requireAuth(req: Request, res: Response, next: () => void) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}

// POST /api/boards - Create a new board
router.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const user = req.user as { id: string };
        const boardId = uuidv4();

        await pool.query(
            'INSERT INTO boards (id, owner_id, objects) VALUES ($1, $2, $3)',
            [boardId, user.id, JSON.stringify([])]
        );

        return res.status(201).json({ boardId });
    } catch (err) {
        console.error('Create board error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/boards/:boardId - Save board state
router.post('/:boardId', requireAuth, async (req: Request, res: Response) => {
    try {
        const { boardId } = req.params;
        const { objects } = req.body;

        if (!Array.isArray(objects)) {
            return res.status(400).json({ error: 'objects must be an array' });
        }

        const result = await pool.query(
            `INSERT INTO boards (id, owner_id, objects, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE
       SET objects = EXCLUDED.objects, updated_at = NOW()
       RETURNING id`,
            [boardId, (req.user as { id: string }).id, JSON.stringify(objects)]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Board not found' });
        }

        return res.status(200).json({ success: true, boardId });
    } catch (err) {
        console.error('Save board error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/boards/:boardId - Load board state
router.get('/:boardId', requireAuth, async (req: Request, res: Response) => {
    try {
        const { boardId } = req.params;

        const result = await pool.query(
            'SELECT id, objects, updated_at FROM boards WHERE id = $1',
            [boardId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const board = result.rows[0];
        return res.status(200).json({
            boardId: board.id,
            objects: board.objects || [],
            updatedAt: board.updated_at,
        });
    } catch (err) {
        console.error('Load board error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
