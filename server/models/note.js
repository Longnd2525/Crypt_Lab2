const pool = require('../config/db');

class Note {
    static async create(userId, encryptedContent, encryptedKey, shareToken, expiresAt) {
        const result = await pool.query(
            `INSERT INTO notes (user_id, encrypted_content, encrypted_key, share_token, expires_at) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, encryptedContent, encryptedKey, shareToken, expiresAt]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    static async findByShareToken(token) {
        const result = await pool.query(
            'SELECT * FROM notes WHERE share_token = $1 AND expires_at > NOW()',
            [token]
        );
        return result.rows[0];
    }

    static async deleteById(id, userId) {
        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );
        return result.rows[0];
    }

    static async incrementAccessCount(shareToken) {
        const result = await pool.query(
            'UPDATE notes SET access_count = access_count + 1 WHERE share_token = $1 RETURNING *',
            [shareToken]
        );
        return result.rows[0];
    }
}

module.exports = Note;