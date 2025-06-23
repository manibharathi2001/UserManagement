const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/UserRoutes');

const app = express();

app.use(bodyParser.json());

// Mount the routes
app.use('/api', userRoutes); // <--- Important!

module.exports = app;
