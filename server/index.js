import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import {seedDatabase} from './config/seed.js';
import requestRoutes from './routes/requestRoutes.js';
import assetReportRoutes from './routes/assetReportRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import bulkUploadRoutes from './routes/bulkUploadRoutes.js';
// Route Imports

dotenv.config();
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
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', assetReportRoutes)
app.use('/api/assignments', assignmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
connectDB().then(()=>{
    seedDatabase();
    app.listen(port, ()=>{
        console.log(`server is running on port ${port}`);
    });
});