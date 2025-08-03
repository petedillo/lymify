// Main JavaScript file for Lymify

// Fetch and display songs
function fetchAndDisplaySongs() {
    fetch('/api/songs')
        .then(response => response.json())
        .then(songs => {
            const songList = document.getElementById('song-list');
            songList.innerHTML = '';
            
            if (songs.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No songs downloaded yet';
                li.classList.add('placeholder');
                songList.appendChild(li);
            } else {
                songs.forEach(song => {
                    const li = document.createElement('li');
                    li.textContent = song;
                    songList.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching songs:', error);
            const songList = document.getElementById('song-list');
            const li = document.createElement('li');
            li.textContent = 'Error loading songs';
            li.style.color = 'var(--soft-coral)';
            songList.appendChild(li);
        });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplaySongs();
});
