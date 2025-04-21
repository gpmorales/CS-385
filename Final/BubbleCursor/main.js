const express = require('express');
const app = express();
const path = require('path');

const port = 3000;

// Serve static files from root directory
app.use(express.static(__dirname));

// Routes for HTML pages
app.get('/', (req, res) => {
    console.log("root: " + req.url);
    res.sendFile(path.join(__dirname, '/html/introduction.html'));
});

app.get('/BubbleTesting.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/BubbleTesting.html'));
});

app.get('/BubbleTraining.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/BubbleTraining.html'));
});

app.get('/TraditionalTesting.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/TraditionalTesting.html'));
});

app.get('/TraditionalTraining.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/TraditionalTraining.html'));
});

app.get('/summary.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/summary.html'));
});

app.get('/instructions.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/instructions.html'));
});

// Application Entrypoint
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});