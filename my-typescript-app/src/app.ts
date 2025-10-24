// src/app.ts
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware and configurations can be added here

app.get('/', (req, res) => {
    res.send('Welcome to My TypeScript App!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});