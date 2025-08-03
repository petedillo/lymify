/**
 * Main server file for Lymify application
 * @module server
 */

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const { setupSocketHandlers } = require('./utils/socketUtils');

// Initialize Express app
const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create HTTP server
const server = http.createServer(app);

// Load configuration
const config = require('./config');

// Initialize Socket.IO server
const io = new Server(server, {
    cors: {
        origin: config.cors.origin,
        methods: config.cors.methods
    }
});

// Set port from configuration
const port = config.port;

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
setupSocketHandlers(io);

/**
 * Start the server
 */
server.listen(port, () => {
    logger.info(`Web app listening at http://localhost:${port}`);
});
