const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
const logger = require('./utils/logger');

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

/**
 * Middleware setup
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

/**
 * Routes setup
 */
const routes = require('./routes/index');
app.use('/', routes(io));

/**
 * Socket connection handler
 */
io.on('connection', (socket) => {
    logger.info('Socket.IO client connected:', socket.id);
    const downloadId = socket.handshake.query.id;
    if (downloadId) {
        logger.info('Client joining room:', downloadId);
        socket.join(downloadId);
    } else {
        logger.info('Client connected without downloadId');
    }
    
    socket.on('disconnect', () => {
        logger.info('Socket.IO client disconnected:', socket.id);
    });
});

/**
 * Server listener
 */
server.listen(port, () => {
    logger.info(`Web app listening at http://localhost:${port}`);
});
