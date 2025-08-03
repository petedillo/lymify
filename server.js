const express = require('express');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { Server } = require("socket.io");
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const io = new Server(server);
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const port = 3000;
const musicDir = path.join(__dirname, 'music');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    fs.readdir(musicDir, (err, files) => {
        if (err) {
            console.error('Error reading music directory:', err);
            files = [];
        }
        res.sendFile(path.join(__dirname, 'index.html'));
    });
});

app.post('/download', async (req, res) => {
    const trackUrl = req.body.trackUrl;
    const downloadId = Date.now().toString();

    res.redirect(`/status?id=${downloadId}`);

    try {
        // Generate a client ID for the request
        const clientId = 'webapp-' + Date.now();
        
        // Create a WebSocket connection to register the client
        const ws = new WebSocket(`http://music-downloader-spotdl-1:8800/api/ws?client_id=${clientId}`);
        
        ws.on('message', (data) => {
            const progressData = JSON.parse(data);
            // Forward progress updates to the browser client
            if (progressData.progress !== undefined && progressData.message) {
                io.to(downloadId).emit('statusUpdate', { message: progressData.message });
            }
        });

        ws.on('open', async () => {
            // Send request to spotdl web API once WebSocket is open
            const response = await fetch(`http://music-downloader-spotdl-1:8800/api/download/url?url=${encodeURIComponent(trackUrl)}&client_id=${clientId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorText = await response.text();
                io.to(downloadId).emit('statusUpdate', { message: `ERROR: Failed to start download - ${response.statusText} - ${errorText}` });
                ws.close();
                return;
            }

            // The response body is the path to the downloaded file, not a stream
            const filePath = await response.json();
            io.to(downloadId).emit('statusUpdate', { message: `Download completed: ${filePath}` });
            ws.close();
        });

        ws.on('close', () => {
            io.to(downloadId).emit('statusUpdate', { message: 'Connection to spotdl closed.' });
        });

        ws.on('error', (error) => {
            io.to(downloadId).emit('statusUpdate', { message: `WebSocket error: ${error.message}` });
        });
    } catch (error) {
        io.to(downloadId).emit('statusUpdate', { message: `ERROR: ${error.message}` });
    }
});

app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'status.html'));
});

app.get('/songs', (req, res) => {
    fs.readdir(musicDir, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading music directory');
        }
        res.json(files.filter(f => f.endsWith('.mp3')));
    });
});

io.on('connection', (socket) => {
    const downloadId = socket.handshake.query.id;
    if (downloadId) {
        socket.join(downloadId);
    }
});

server.listen(port, () => {
    console.log(`Web app listening at http://localhost:${port}`);
});
