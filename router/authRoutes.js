import { Router } from 'express';
import { sign } from 'jsonwebtoken';

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET;

const CREDENTIALS = { username: "naval.ravikant", password: "05111974" };

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        const token = sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.status(200).json({ JWT: token });
    }

    res.status(401).json({ error: "Invalid credentials" });
});

export default router;
