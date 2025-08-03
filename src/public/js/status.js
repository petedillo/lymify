// Status page JavaScript for Lymify

// Keep track of message counts for stacking
const messageCounts = {};

// Get download ID from URL
const urlParams = new URLSearchParams(window.location.search);
const downloadId = urlParams.get('id');

if (!downloadId) {
    document.getElementById('status-updates').innerHTML = '<p class="error">Error: No download ID provided</p>';
} else {
    // Connect to Socket.IO server with room ID as query parameter
    const socket = io({
        query: {
            id: downloadId
        }
    });
    
    // Listen for status updates
    socket.on('statusUpdate', (data) => {
        const statusUpdates = document.getElementById('status-updates');
        
        // Format timestamp
        const now = new Date();
        const timestamp = `[${now.toLocaleTimeString()}]`;
        
        // Create message key for stacking
        const messageKey = `${data.message}`;
        
        // Check if this is a duplicate message
        if (messageCounts[messageKey]) {
            // Increment count
            messageCounts[messageKey].count++;
            
            // Update existing entry
            const existingEntry = messageCounts[messageKey].element;
            existingEntry.textContent = `${timestamp} ${data.message} (${messageCounts[messageKey].count})`;
            
            // Move to bottom
            statusUpdates.appendChild(existingEntry);
        } else {
            // Create new entry
            const newEntry = document.createElement('p');
            
            // Set message content
            newEntry.textContent = `${timestamp} ${data.message}`;
            
            // Add appropriate class based on message type
            if (data.type) {
                newEntry.classList.add(data.type);
                
                // Special handling for error messages
                if (data.type === 'error') {
                    // Add error styling to progress container
                    const progressContainer = document.getElementById('progressContainer');
                    if (progressContainer) {
                        progressContainer.classList.add('error');
                    }
                    
                    // Update progress text
                    const progressText = document.getElementById('progressText');
                    if (progressText) {
                        progressText.textContent = 'Download Failed';
                    }
                    
                    // Update progress bar
                    const progressBar = document.getElementById('progressBar');
                    if (progressBar) {
                        progressBar.style.width = '100%';
                        progressBar.style.background = 'var(--soft-coral)';
                    }
                }
            } else {
                newEntry.classList.add('info');
            }
            
            // Add to updates container
            statusUpdates.appendChild(newEntry);
            
            // Track this message
            messageCounts[messageKey] = {
                element: newEntry,
                count: 1
            };
        }
        
        // Scroll to bottom
        statusUpdates.scrollTop = statusUpdates.scrollHeight;
        
        // Update progress if provided
        if (data.progress !== undefined) {
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            progressBar.style.width = `${data.progress}%`;
            progressText.textContent = `${Math.round(data.progress)}%`;
            
            // Add special styling for different stages
            if (data.progress < 25) {
                progressText.textContent += ' - Connecting...';
            } else if (data.progress < 50) {
                progressText.textContent += ' - Downloading...';
            } else if (data.progress < 75) {
                progressText.textContent += ' - Converting...';
            } else if (data.progress < 100) {
                progressText.textContent += ' - Finalizing...';
            } else {
                progressText.textContent += ' - Complete!';
            }
        }
    });
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
        const statusUpdates = document.getElementById('status-updates');
        const errorEntry = document.createElement('p');
        errorEntry.textContent = `[${new Date().toLocaleTimeString()}] Connection error: ${error.message}`;
        errorEntry.classList.add('error');
        statusUpdates.appendChild(errorEntry);
        statusUpdates.scrollTop = statusUpdates.scrollHeight;
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        const statusUpdates = document.getElementById('status-updates');
        const disconnectEntry = document.createElement('p');
        disconnectEntry.textContent = `[${new Date().toLocaleTimeString()}] Disconnected: ${reason}`;
        disconnectEntry.classList.add('error');
        statusUpdates.appendChild(disconnectEntry);
        statusUpdates.scrollTop = statusUpdates.scrollHeight;
    });
    
    // Add initial connection message
    const statusUpdates = document.getElementById('status-updates');
    const connectEntry = document.createElement('p');
    connectEntry.textContent = `[${new Date().toLocaleTimeString()}] Connected to status updates for download ${downloadId}`;
    connectEntry.classList.add('success');
    statusUpdates.appendChild(connectEntry);
    statusUpdates.scrollTop = statusUpdates.scrollHeight;
    
    // Keep connection alive
    setInterval(() => {
        if (socket.connected) {
            socket.emit('ping');
            console.debug('Sent ping to server');
        }
    }, 30000);
}
