const ACTIVE_UPDATE_INTERVAL = 250;
const INACTIVE_UPDATE_INTERVAL = 2000;
let updateIntervalId = null;
let currentSongId = null;
let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false;
const imageCache = new Set();
let isToggleDisabled = false; // Flag to disable toggle during cooldown
let activeBackgroundLayer = 1;

// Updated UI
function updateUI(data) {
    const timestamp = new Date().getTime();
    const albumCover = document.getElementById('album-cover');
    const cdImage = document.getElementById('cd-image');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const isPlaying = data.is_playing;
    const imageContainer = document.querySelector('.image-container');

    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    manageImageCache(imageUrl);

    // Preload and crossfade the new background image
    if (imageUrl !== currentBackgroundImage) {
        preloadBackgroundImage(imageUrl, () => {
            // Determine the next background layer to use
            const nextBackgroundLayer = activeBackgroundLayer === 1 ? 2 : 1;

            // Set the new image on the next layer
            const nextLayer = document.getElementById(`background-layer-${nextBackgroundLayer}`);
            nextLayer.style.backgroundImage = `url(${imageUrl})`;

            // Toggle the active class to trigger the crossfade
            document.getElementById(`background-layer-${activeBackgroundLayer}`).classList.remove('active');
            nextLayer.classList.add('active');

            // Update the active background layer and current image
            activeBackgroundLayer = nextBackgroundLayer;
            currentBackgroundImage = imageUrl;
        });
    }

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

    // Update play/pause button icon based on the current state
    if (isPlaying !== currentIsPlaying) {
        if (isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playPauseBtn.title = 'Pause';
            if(isCdView) {
                cdImage.style.animationPlayState = 'running';
            }
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playPauseBtn.title = 'Play';
            if(isCdView){
               cdImage.style.animationPlayState = 'paused';
            }
        }
    }
    imageContainer.classList.remove('placeholder-active');
}

// Function to preload the background image
function preloadBackgroundImage(imageUrl, callback) {
    const img = new Image();
    img.src = imageUrl;

    if (img.complete) {
        // Image already loaded (cached)
        callback();
    } else {
        // Image not yet loaded, set onload to trigger the callback
        img.onload = () => {
            callback();
        };
    }
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
    document.body.style.backgroundColor = '#222';
    // Ensure background layers are cleared or set to a default state
    document.getElementById('background-layer-1').style.backgroundImage = 'none';
    document.getElementById('background-layer-2').style.backgroundImage = 'none';
    currentBackgroundImage = null;
    imageContainer.classList.add('placeholder-active');
}

function showSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'block';
}

function hideSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'none';
}

document.getElementById('re-authenticate-btn').addEventListener('click', () => {
    hideSessionExpiredModal();
    handleLogin();
});

function simulateTokenExpiration() {
    console.log("Simulating token expiration...");
    accessToken = null;
    localStorage.removeItem('fullscreenify_access_token');
    localStorage.removeItem('fullscreenify_token_expiration');
    showSessionExpiredModal();
}

document.getElementById('test-expiry-btn').addEventListener('click', () => {
    simulateTokenExpiration();
});

function handleApiError(response) {
    if (response.status === 401) {
        console.error('API Error 401: Unauthorized. Access token expired.');
        showSessionExpiredModal();
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
    // Disable toggle button immediately
    isToggleDisabled = true;
    document.getElementById('cd-toggle-btn').disabled = true;
    document.getElementById('cd-toggle-btn').classList.add('disabled');

    isCdView = !isCdView;
    const albumCover = document.getElementById('album-cover');
    const cdContainer = document.getElementById('cd-container');
    const cdImage = document.getElementById('cd-image');
    const placeholderText = document.getElementById('placeholder-text');

    if (isCdView) {
         // Switch to CD view
        albumCover.style.display = 'none';
        cdContainer.style.display = 'flex';
        if(currentSongId){
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
                }else {
                    handleApiError(response);
                }
            }catch (error) {
                console.error('Error fetching currently playing song for CD image:', error);
            }
        }

    } else {
         // Switch to album cover view
        cdContainer.style.display = 'none';
        if(currentSongId){
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
                }else {
                   handleApiError(response);
                }
            }catch(error){
                console.error('Error fetching currently playing song for album cover:', error);
            }
        }

    }

    // Re-enable toggle button after 1 second
    setTimeout(() => {
        isToggleDisabled = false;
        document.getElementById('cd-toggle-btn').disabled = false;
        document.getElementById('cd-toggle-btn').classList.remove('disabled');
    }, 1000);
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

async function updateImage(imgElement, imageUrl) {
    return new Promise((resolve) => {
        if (imageCache.has(imageUrl)) {
            imgElement.src = imageUrl;
            resolve();
        } else {
            imgElement.onload = () => {
                imageCache.add(imageUrl);
                resolve();
            };
            imgElement.src = imageUrl;
        }
    });
}

function manageImageCache(imageUrl) {
    const MAX_CACHE_SIZE = 50;

    if (!imageCache.has(imageUrl)) {
        if (imageCache.size >= MAX_CACHE_SIZE) {
            const firstImageUrl = imageCache.values().next().value;
            imageCache.delete(firstImageUrl);
        }
        imageCache.add(imageUrl);
    }
}

function scheduleTokenRefresh() {
    const expirationTime = localStorage.getItem('fullscreenify_token_expiration');
    if (expirationTime) {
        const timeUntilExpiration = expirationTime - Date.now();
        const refreshTimeout = Math.max(0, timeUntilExpiration - 60000);

        console.log(`Scheduling token refresh in ${refreshTimeout / 1000} seconds.`);

        setTimeout(() => {
            refreshToken();
        }, refreshTimeout);
    }
}

document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);
document.getElementById('cd-toggle-btn').addEventListener('click', toggleCdView);

function initializeApp() {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
    scheduleTokenRefresh();
}

initializeApp();