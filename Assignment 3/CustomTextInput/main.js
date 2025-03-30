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

app.get('/instructions.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/instructions.html'));
});

app.get('/SwipeTraining.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/SwipeTraining.html'));
});

app.get('/SwipeTesting.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/SwipeTesting.html'));
});

app.get('/QwertyTraining.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/QwertyTraining.html'));
});

app.get('/QwertyTesting.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/QwertyTesting.html'));
});

app.get('/summary.html', (req, res) => {
    res.sendFile(path.join(__dirname, '/html/summary.html'));
});

// App Entrypoint
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});