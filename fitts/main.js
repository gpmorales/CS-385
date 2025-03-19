const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    console.log("root: " + req.url);
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});