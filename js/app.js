const ACTIVE_UPDATE_INTERVAL = 250; // 0.25 second (Faster update when playing)
const INACTIVE_UPDATE_INTERVAL = 2000; // 2 seconds (Faster update when paused)
let updateIntervalId = null;
let currentSongId = null;
let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false; // Track CD view state
const imageCache = new Set(); // Track cached image URLs

// Updated UI
function updateUI(data) {
    const timestamp = new Date().getTime(); // Get current timestamp
    const albumCover = document.getElementById('album-cover');
    const cdImage = document.getElementById('cd-image');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const isPlaying = data.is_playing;
    const imageContainer = document.querySelector('.image-container');
    const cdContainer = document.getElementById('cd-container');

    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    // Manage image cache
    manageImageCache(imageUrl);

    // Update body background image only if the song is different
    if (data.item.id !== currentSongId) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${imageUrl})`;
        currentBackgroundImage = imageUrl; // Update the current background image URL
    }

    if (!isCdView) {
        // Album cover view
        imageContainer.style.display = "flex"; // Show image container
        updateImage(albumCover, imageUrl);
        albumCover.style.display = 'block';
        cdContainer.style.display = 'none'; // Hide CD container
        document.getElementById('placeholder-text').style.display = 'none';
    } else {
        // CD view
        imageContainer.style.display = "flex"; // Show image container *** This was missing
        updateImage(cdImage, imageUrl);
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
        cdContainer.style.display = 'flex'; // Show CD container
    }

    // Update play/pause button icon based on the current state
    if (isPlaying !== currentIsPlaying) {
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
    imageContainer.classList.remove('placeholder-active');
}

function displayPlaceholder() {
    const placeholderText = document.getElementById('placeholder-text');
    placeholderText.textContent = 'START STREAMING TO SEE YOUR CURRENTLY PLAYING ALBUM COVER HERE.';
    placeholderText.style.display = 'block';

    const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';
    const imageContainer = document.querySelector('.image-container');

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
    currentBackgroundImage = null; // Reset the current background image URL
    imageContainer.classList.add('placeholder-active');
}

// Function to show the session expired modal
function showSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'block';
}

// Function to hide the session expired modal
function hideSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'none';
}

// Attach event listener to the re-authenticate button in the modal
document.getElementById('re-authenticate-btn').addEventListener('click', () => {
    hideSessionExpiredModal();
    handleLogin(); // Call the existing login function
});

// Function to simulate token expiration (for testing)
function simulateTokenExpiration() {
    console.log("Simulating token expiration...");
    accessToken = null; // Clear the access token
    localStorage.removeItem('fullscreenify_access_token'); // Remove the token from local storage
    localStorage.removeItem('fullscreenify_token_expiration'); // Remove the token expiration from local storage
    showSessionExpiredModal();
}

// Attach event listener to the test expiry button (for development/testing)
document.getElementById('test-expiry-btn').addEventListener('click', () => {
    simulateTokenExpiration();
});

function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid.
        console.error('API Error 401: Unauthorized. Access token expired.');
        showSessionExpiredModal(); // Show the session expired modal
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
    const imageContainer = document.querySelector('.image-container');

    // Hide both images initially
    albumCover.style.display = 'none';
    cdImage.style.display = 'none';

    if (isCdView) {
        // Switch to CD view
        imageContainer.style.display = "flex"; // Show image container
        cdContainer.style.display = 'flex'; // Show CD container
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
        } 
    } else {
        // Switch to album cover view
        imageContainer.style.display = "flex"; // Show image container
        cdContainer.style.display = 'none'; // Hide CD container
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
            await getCurrentlyPlaying();
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

// Function to schedule token refresh
function scheduleTokenRefresh() {
    const expirationTime = localStorage.getItem('fullscreenify_token_expiration');
    if (expirationTime) {
        const timeUntilExpiration = expirationTime - Date.now();
        // Refresh 60 seconds before expiration
        const refreshTimeout = Math.max(0, timeUntilExpiration - 60000);

        console.log(`Scheduling token refresh in ${refreshTimeout / 1000} seconds.`);

        setTimeout(() => {
            refreshToken();
        }, refreshTimeout);
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
    scheduleTokenRefresh(); // Start the refresh cycle
}

// Call initializeApp() only once on page load
initializeApp();