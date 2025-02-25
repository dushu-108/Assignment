import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const HARDCODED_CREDENTIALS = {
    username: "naval.ravikant",
    password: "05111974"
};

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check hardcoded credentials
        if (username !== HARDCODED_CREDENTIALS.username || 
            password !== HARDCODED_CREDENTIALS.password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ JWT: token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
