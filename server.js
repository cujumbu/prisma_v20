import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API routes
app.get('/api/claims', async (req, res) => {
  try {
    const { orderNumber, email } = req.query;
    let claims;
    if (orderNumber && email) {
      claims = await prisma.claim.findMany({
        where: { orderNumber: String(orderNumber), email: String(email) }
      });
    } else {
      claims = await prisma.claim.findMany();
    }
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching claims' });
  }
});

app.post('/api/claims', async (req, res) => {
  try {
    const newClaim = await prisma.claim.create({
      data: { ...req.body, status: 'Pending' }
    });
    res.json(newClaim);
  } catch (error) {
    res.status(500).json({ error: 'Error creating claim' });
  }
});

app.patch('/api/claims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: req.body
    });
    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({ error: 'Error updating claim' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ email: user.email, isAdmin: user.isAdmin });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
  }
});

// Email sending route
app.post('/api/send-status-update', async (req, res) => {
  try {
    const { to, claimNumber, newStatus } = req.body;
    // Implement email sending logic here using nodemailer
    // For now, we'll just log the information
    console.log(`Sending email to ${to} for claim ${claimNumber} with new status ${newStatus}`);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending email' });
  }
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});