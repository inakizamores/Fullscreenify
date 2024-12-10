const ACTIVE_UPDATE_INTERVAL = 1000; // 1 second
const INACTIVE_UPDATE_INTERVAL = 5000; // 5 seconds
let updateIntervalId = null;
let currentSongId = null;
let isCdView = false; // Track CD view state

function updateUI(data) {
    if (!isCdView) {
        // Album cover view
        const albumCover = document.getElementById('album-cover');
        albumCover.src = data.item.album.images[0].url;
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
    } else {
        // CD view
        const cdImage = document.getElementById('cd-image');
        cdImage.src = data.item.album.images[0].url;
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('cd-container').style.display = 'flex';
    }

    // Set the background to the album art with a gradient overlay
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${data.item.album.images[0].url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    // Show controls
    document.querySelector('.controls').style.display = 'flex';

    // Update play/pause button based on the current state
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (data.is_playing) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    } else {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }
}

function displayPlaceholder() {
    if (!isCdView) {
        // Album cover view
        const albumCover = document.getElementById('album-cover');
        albumCover.src = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg'; // Placeholder image
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
    } else {
        // CD view
        const cdImage = document.getElementById('cd-image');
        cdImage.src = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg'; // Placeholder image
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('cd-container').style.display = 'flex';
    }

    document.body.style.backgroundColor = '#222'; // Set to a default color
    document.body.style.backgroundImage = 'none'; // Remove background image

    // Hide controls if nothing is playing
    document.querySelector('.controls').style.display = 'none';
}

function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid.
        localStorage.removeItem('fullscreenify_access_token');
        checkAuthentication();
    } else {
        console.error('API Error:', response.status, response.statusText);
    }
}

async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            // No content - nothing is playing
            displayPlaceholder();
            stopUpdatingSongInfo();
        } else if (response.ok) {
            const data = await response.json();

            if (data.item.id !== currentSongId) {
                currentSongId = data.item.id;
                updateUI(data);
            }

            // Adjust update interval based on playing state
            if (data.is_playing) {
                startUpdatingSongInfo(ACTIVE_UPDATE_INTERVAL);
            } else {
                startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
    }
}

function startUpdatingSongInfo(interval) {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
    }
    updateIntervalId = setInterval(async () => {
        await getCurrentlyPlaying();
    }, interval);
}

function stopUpdatingSongInfo() {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}

function toggleCdView() {
    isCdView = !isCdView;
    const albumCover = document.getElementById('album-cover');
    const cdContainer = document.getElementById('cd-container');
    const cdImage = document.getElementById('cd-image');

    if (isCdView) {
        albumCover.style.display = 'none';
        cdContainer.style.display = 'flex';
        if(albumCover.src != ''){
            cdImage.src = albumCover.src;
        }
    } else {
        albumCover.style.display = 'block';
        cdContainer.style.display = 'none';
    }
}

// Event listeners for control buttons
document.getElementById('play-btn').addEventListener('click', playSong);
document.getElementById('pause-btn').addEventListener('click', pauseSong);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);
document.getElementById('cd-toggle-btn').addEventListener('click', toggleCdView);

// Check authentication and start updating on page load
window.addEventListener('load', () => {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
});