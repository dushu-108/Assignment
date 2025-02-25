import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import { connect } from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './router/resumeRoutes.js';

const app = express();
app.use(cors());
app.use(json());

app.use('/auth', authRoutes);
app.use('/resume', resumeRoutes);

connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
