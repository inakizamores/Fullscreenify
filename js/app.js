const ACTIVE_UPDATE_INTERVAL = 500; // 0.5 second (Faster update when playing)
const INACTIVE_UPDATE_INTERVAL = 2000; // 2 seconds (Faster update when paused)
let updateIntervalId = null;
let currentSongId = null;
let isCdView = false; // Track CD view state

//Updated UI
function updateUI(data) {
    const timestamp = new Date().getTime(); // Get current timestamp
    const albumCover = document.getElementById('album-cover');
    const cdImage = document.getElementById('cd-image');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const isPlaying = data.is_playing;

    if (!isCdView) {
        // Album cover view
        updateImage(albumCover, `${data.item.album.images[0].url}?t=${timestamp}`);
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
    } else {
        // CD view
        updateImage(cdImage, `${data.item.album.images[0].url}?t=${timestamp}`);
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
        document.getElementById('cd-container').style.display = 'flex';
    }

    // Set the background to the album art with a gradient overlay
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${data.item.album.images[0].url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    // Show controls
    document.querySelector('.controls').style.display = 'flex';

    // Update play/pause button icon based on the current state
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.title = 'Pause';
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.title = 'Play';
    }
}

function displayPlaceholder() {
    const placeholderText = document.getElementById('placeholder-text');
    placeholderText.textContent = 'START STREAMING TO SEE YOUR CURRENTLY PLAYING ALBUM COVER HERE.';
    placeholderText.style.display = 'block';

    if (!isCdView) {
        // Album cover view
        const albumCover = document.getElementById('album-cover');
        updateImage(albumCover, 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg');
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
    } else {
        // CD view
        const cdImage = document.getElementById('cd-image');
        updateImage(cdImage, 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg');
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

async function toggleCdView() {
    isCdView = !isCdView;
    const albumCover = document.getElementById('album-cover');
    const cdContainer = document.getElementById('cd-container');
    const cdImage = document.getElementById('cd-image');
    const placeholderText = document.getElementById('placeholder-text');

    // Hide both images initially
    albumCover.style.display = 'none';
    cdImage.style.display = 'none';

    if (isCdView) {
        // Switch to CD view
        cdContainer.style.display = 'flex';
        if (currentSongId) {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    await updateImage(cdImage, data.item.album.images[0].url);
                    cdImage.style.display = 'block';
                    placeholderText.style.display = 'none';
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error('Error fetching currently playing song for CD image:', error);
            }
        } else {
            await updateImage(cdImage, 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg');
            cdImage.style.display = 'block';
            placeholderText.style.display = 'block';
        }
    } else {
        // Switch to album cover view
        cdContainer.style.display = 'none';
        if (currentSongId) {
            try {
                const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    await updateImage(albumCover, data.item.album.images[0].url);
                    albumCover.style.display = 'block';
                    placeholderText.style.display = 'none';
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error('Error fetching currently playing song for album cover:', error);
            }
        } else {
            await updateImage(albumCover, 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg');
            albumCover.style.display = 'block';
            placeholderText.style.display = 'block';
        }
    }
}

async function togglePlayPause() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const isPlaying = data.is_playing;

            if (isPlaying) {
                await pauseSong();
            } else {
                await playSong();
            }

            // Fetch the updated state after toggling
            const updatedResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (updatedResponse.ok) {
                const updatedData = await updatedResponse.json();
                updateUI(updatedData); // Update UI with the new state
            } else {
                handleApiError(updatedResponse);
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error toggling play/pause:', error);
    }
}

// Helper function to update an image element after the image has loaded
async function updateImage(imgElement, imageUrl) {
    return new Promise((resolve) => {
        imgElement.onload = () => resolve();
        imgElement.src = imageUrl;
    });
}

// Event listeners for control buttons
document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
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