const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const config = require('./config');

const io = new Server(server, {
    cors: {
        origin: config.cors.origin,
        methods: config.cors.methods
    }
});

const port = config.port;
const musicDir = '/usr/src/app/music';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
const routes = require('./routes/index');
app.use('/', routes(io));

// Socket connection
io.on('connection', (socket) => {
    console.log('Socket.IO client connected:', socket.id);
    const downloadId = socket.handshake.query.id;
    if (downloadId) {
        console.log('Client joining room:', downloadId);
        socket.join(downloadId);
    } else {
        console.log('Client connected without downloadId');
    }
    
    socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`);
});
