const ACTIVE_UPDATE_INTERVAL = 500; // 0.5 second (Faster update when playing)
const INACTIVE_UPDATE_INTERVAL = 2000; // 2 seconds (Faster update when paused)
let updateIntervalId = null;
let currentSongId = null;
let isCdView = false; // Track CD view state
const imageCache = new Set(); // Track cached image URLs

// Updated UI
function updateUI(data) {
    const timestamp = new Date().getTime(); // Get current timestamp
    const albumCover = document.getElementById('album-cover');
    const cdImage = document.getElementById('cd-image');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const isPlaying = data.is_playing;

    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    // Manage image cache
    manageImageCache(imageUrl);

    if (!isCdView) {
        // Album cover view
        updateImage(albumCover, imageUrl);
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
    } else {
        // CD view
        updateImage(cdImage, imageUrl);
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
        document.getElementById('cd-container').style.display = 'flex';
    }

    // Set the background to the album art with a gradient overlay
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${imageUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    // Show controls
    document.querySelector('.controls').style.display = 'flex';

    // Update play/pause button icon based on the current state
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.title = 'Pause';
        cdImage.style.animationPlayState = 'running';
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.title = 'Play';
        cdImage.style.animationPlayState = 'paused';
    }
}

function displayPlaceholder() {
    const placeholderText = document.getElementById('placeholder-text');
    placeholderText.textContent = 'START STREAMING TO SEE YOUR CURRENTLY PLAYING ALBUM COVER HERE.';
    placeholderText.style.display = 'block';

    const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';

    if (!isCdView) {
        // Album cover view
        const albumCover = document.getElementById('album-cover');
        updateImage(albumCover, placeholderImageUrl);
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
    } else {
        // CD view
        const cdImage = document.getElementById('cd-image');
        updateImage(cdImage, placeholderImageUrl);
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
                    const imageUrl = `${data.item.album.images[0].url}?t=${new Date().getTime()}`;
                    await updateImage(cdImage, imageUrl);
                    cdImage.style.display = 'block';
                    placeholderText.style.display = 'none';

                    // Pause or resume CD animation based on playback state
                    if (data.is_playing) {
                        cdImage.style.animationPlayState = 'running';
                    } else {
                        cdImage.style.animationPlayState = 'paused';
                    }
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error('Error fetching currently playing song for CD image:', error);
            }
        } else {
            const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';
            await updateImage(cdImage, placeholderImageUrl);
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
                    const imageUrl = `${data.item.album.images[0].url}?t=${new Date().getTime()}`;
                    await updateImage(albumCover, imageUrl);
                    albumCover.style.display = 'block';
                    placeholderText.style.display = 'none';
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error('Error fetching currently playing song for album cover:', error);
            }
        } else {
            const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';
            await updateImage(albumCover, placeholderImageUrl);
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

            // Immediately update the play/pause button icon
            const playPauseBtn = document.getElementById('play-pause-btn');
            if (isPlaying) {
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.title = 'Play';
            } else {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playPauseBtn.title = 'Pause';
            }

            // Update the playback state after a short delay
            setTimeout(updatePlaybackState, 250);

        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error toggling play/pause:', error);
    }
}

async function updatePlaybackState() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Check if the song has changed
            if (data.item.id !== currentSongId) {
                currentSongId = data.item.id;

                // Preload next probable album art
                if (data.context && data.context.type === 'playlist' && data.context.uri) {
                    const playlistId = data.context.uri.split(':')[2]; // Get playlist ID
                    const nextTrackIndex = data.item.track_number; // Get index of the next track

                    fetchPlaylistTracks(playlistId, nextTrackIndex);
                }

                updateUI(data);
            } else {
                // Update only the play/pause button if the song is the same
                const playPauseBtn = document.getElementById('play-pause-btn');
                if (data.is_playing) {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    playPauseBtn.title = 'Pause';
                    cdImage.style.animationPlayState = 'running';
                } else {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    playPauseBtn.title = 'Play';
                    cdImage.style.animationPlayState = 'paused';
                }
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error updating playback state:', error);
    }
}

// Helper function to update an image element after the image has loaded
async function updateImage(imgElement, imageUrl) {
    return new Promise((resolve) => {
        // Check if the image is already in the cache
        if (imageCache.has(imageUrl)) {
            imgElement.src = imageUrl;
            resolve();
        } else {
            const img = new Image();
            img.onload = () => {
                // Add the image to the cache once it's loaded
                imageCache.add(imageUrl);
                imgElement.src = imageUrl;
                resolve();
            };
            img.onerror = () => {
                // Handle image loading error (optional)
                console.error('Error loading image:', imageUrl);
                resolve(); // Resolve even on error to avoid infinite loading
            };
            img.src = imageUrl;
        }
    });
}

// Function to manage the image cache
function manageImageCache(imageUrl) {
    const MAX_CACHE_SIZE = 50; // Set the maximum number of images to store in the cache

    if (!imageCache.has(imageUrl)) {
        if (imageCache.size >= MAX_CACHE_SIZE) {
            // Remove the oldest image from the cache (first item added)
            const firstImageUrl = imageCache.values().next().value;
            imageCache.delete(firstImageUrl);
        }
        // Add the new image to the cache
        imageCache.add(imageUrl);
    }
}

function preloadImage(url) {
    const img = new Image();
    img.src = url;
}

// Event listeners for control buttons
document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);
document.getElementById('cd-toggle-btn').addEventListener('click', toggleCdView);

// Check authentication and start updating on page load (only once)
function initializeApp() {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
}

// Call initializeApp() only once on page load
initializeApp();