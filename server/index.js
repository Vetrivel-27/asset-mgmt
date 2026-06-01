import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';

// // Route Imports
// import employeeRoutes from './routes/employeeRoutes.js';
// import assignmentRoutes from './routes/assignmentRoutes.js';
import {seedDatabase} from './config/seed.js';

dotenv.config();
connectDB();
const app = express();
const port = process.env.SERVER_PORT || 5000;
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.json({
        message: `server is running on port ${port}`
    })
})

// Mount API Routes
// app.use('/api/employees', employeeRoutes);
// app.use('/api/assignments', assignmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
connectDB().then(()=>{
    seedDatabase();
    app.listen(port, ()=>{
        console.log(`server is running on port ${port}`);
    });
});