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
        document.getElementById('cd-container').style.display = 'flex';
    }

    // Update background image using a separate div
    updateBackgroundImage(imageUrl);

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
    updateBackgroundImage(null); // Remove background image

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
        cdContainer.style.display = none;
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

            // Only fetch updated state if the response is not 204 No Content
            if (response.status !== 204) {
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
                // Handle 204 No Content (e.g., nothing playing)
                const playPauseBtn = document.getElementById('play-pause-btn');
                if (!isPlaying) {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    playPauseBtn.title = 'Pause';
                } else {
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    playPauseBtn.title = 'Play';
                }
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
        // Check if the image is already in the cache
        if (imageCache.has(imageUrl)) {
            imgElement.src = imageUrl;
            resolve();
        } else {
            imgElement.onload = () => {
                // Add the image to the cache once it's loaded
                imageCache.add(imageUrl);
                resolve();
            };
            imgElement.src = imageUrl;
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

// New function to update the background image using a separate div
function updateBackgroundImage(imageUrl) {
    let bgImageDiv = document.getElementById('bg-image');

    // Create the div if it doesn't exist
    if (!bgImageDiv) {
        bgImageDiv = document.createElement('div');
        bgImageDiv.id = 'bg-image';
        document.body.appendChild(bgImageDiv); // Append to body
    }

    // Set styles for the div (only need to do this once, but it's safe to do it every time)
    bgImageDiv.style.position = 'fixed';
    bgImageDiv.style.top = '0';
    bgImageDiv.style.left = '0';
    bgImageDiv.style.width = '100%';
    bgImageDiv.style.height = '100%';
    bgImageDiv.style.backgroundSize = 'cover';
    bgImageDiv.style.backgroundPosition = 'center';
    bgImageDiv.style.backgroundRepeat = 'no-repeat';
    bgImageDiv.style.zIndex = '-1'; // Ensure it's behind other elements
    bgImageDiv.style.filter = 'blur(20px)';
    bgImageDiv.style.transition = 'background-image 0.5s ease-in-out'; // Add a transition

    // Set or update the background image with a gradient overlay
    if (imageUrl) {
        bgImageDiv.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${imageUrl})`;
    } else {
        bgImageDiv.style.backgroundImage = 'none'; // Remove the image
        bgImageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
    }
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