const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');

// Upload note
router.post('/upload', authMiddleware, async (req, res) => {
    try {
        const { encryptedContent, encryptedKey, expiryTime,filename, fileSize } = req.body;
        const userId = req.user.id;

        const shareToken = crypto.randomBytes(32).toString('hex');

        const newNote = await pool.query(
            `INSERT INTO notes (user_id, encrypted_content, encrypted_key, share_token, expires_at,filename,file_size) 
             VALUES ($1, $2, $3, $4, $5,$6,$7) 
             RETURNING id`,
            [userId, encryptedContent, encryptedKey, shareToken, new Date(expiryTime),filename, fileSize]
        );

        res.status(201).json({
            message: 'Note uploaded successfully',
            noteId: newNote.rows[0].id,
            shareToken
        });
    } catch (error) {
        console.error('Upload note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all notes for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const notes = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        res.json(notes.rows);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get shared note by token
router.get('/shared/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const note = await pool.query(
            `SELECT * FROM notes 
            WHERE share_token = $1 
            AND expires_at > NOW()`,
            [token]
        );

        if (note.rows.length === 0) {
            return res.status(404).json({ message: 'Note not found or expired' });
        }

        // Increment access count
        await pool.query(
            'UPDATE notes SET access_count = access_count + 1 WHERE share_token = $1',
            [token]
        );

        res.json(note.rows[0]);
    } catch (error) {
        console.error('Get shared note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete note
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:id/share', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // First check if note exists and get share token
        const note = await pool.query(
            'SELECT id, share_token FROM notes WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (note.rows.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Generate new share token if needed
        const shareToken = note.rows[0].share_token || crypto.randomBytes(32).toString('hex');

        // Update share token if it's new
        if (!note.rows[0].share_token) {
            await pool.query(
                'UPDATE notes SET share_token = $1 WHERE id = $2',
                [shareToken, id]
            );
        }

        res.json({ shareToken: shareToken });
    } catch (error) {
        console.error('Share note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;