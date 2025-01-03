const ACTIVE_UPDATE_INTERVAL = 250;
const INACTIVE_UPDATE_INTERVAL = 2000;
let updateIntervalId = null;
let currentSongId = null;
let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false;
const imageCache = new Set();
let isToggleDisabled = false; // Flag to disable toggle during cooldown
let initialLoadComplete = false; // Flag to track if initial load is done

// Cursor hiding functionality
let idleTimer;
const idleDelay = 10000; // Adjust the delay (in milliseconds) as needed

function hideCursor() {
    document.body.style.cursor = 'none';
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    document.body.style.cursor = 'default'; // Show the cursor
    idleTimer = setTimeout(hideCursor, idleDelay);
}

// Attach event listeners to reset the timer on mouse movement and key presses
window.addEventListener('mousemove', resetIdleTimer);
window.addEventListener('keypress', resetIdleTimer); // Optional: Reset on key press as well

// Initialize the timer on page load
resetIdleTimer();

// Function to update image with debugging
function updateImage(imgElement, imageUrl) {
  return new Promise((resolve) => {
    console.log("Updating image:", imgElement.id, "to", imageUrl);
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

// Function to check and log the size of the image wrapper
function logImageWrapperSize() {
    const imageWrapper = document.querySelector('.image-wrapper');
    console.log("Image Wrapper Size:", { width: imageWrapper.offsetWidth, height: imageWrapper.offsetHeight });
}

// Updated UI
function updateUI(data) {
    const timestamp = new Date().getTime();
    const albumCover = document.getElementById("album-cover");
    const cdImage = document.getElementById("cd-image");
    const playPauseBtn = document.getElementById("play-pause-btn");
    const isPlaying = data.is_playing;
    const imageContainer = document.querySelector(".image-container");

    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    manageImageCache(imageUrl);

    // Preload the new background image only if it's different from the current one
    if (imageUrl !== currentBackgroundImage) {
      preloadBackgroundImage(imageUrl, () => {
        // Once the new image is loaded, update the background if it's still the correct image
        if (imageUrl === `${data.item.album.images[0].url}?t=${timestamp}`) {
          document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${imageUrl})`;
          currentBackgroundImage = imageUrl;
        }
      });
    }

    if (!isCdView) {
      // Album cover view
      updateImage(albumCover, imageUrl);
      albumCover.style.display = "block";
      document.getElementById("cd-container").style.display = "none";
      document.getElementById("placeholder-text").style.display = "none";
    } else {
      // CD view
      updateImage(cdImage, imageUrl);
      cdImage.style.display = "block";
      document.getElementById("album-cover").style.display = "none";
      document.getElementById("placeholder-text").style.display = "none";
      document.getElementById("cd-container").style.display = "flex";
    }

    // Update play/pause button icon based on the current state
    if (isPlaying !== currentIsPlaying) {
      if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.title = "Pause";
        playPauseBtn.classList.remove("play-icon");
        if (isCdView) {
          cdImage.style.animationPlayState = "running";
        }
      } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.title = "Play";
        playPauseBtn.classList.add("play-icon");
        if (isCdView) {
          cdImage.style.animationPlayState = "paused";
        }
      }
    }
    imageContainer.classList.remove("placeholder-active");

    // Log the size of the image wrapper after updating the UI
    logImageWrapperSize();
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

    // Reset song and playback state when displaying placeholder
    currentSongId = null;
    currentIsPlaying = null;

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
    document.body.style.backgroundImage = 'none';
    currentBackgroundImage = null;
    imageContainer.classList.add('placeholder-active');

    // Log the size of the image wrapper after updating the UI
    logImageWrapperSize();
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
        if (initialLoadComplete) { // Only fetch if initial load is done
            await getCurrentlyPlaying();
        }
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
    document.getElementById("cd-toggle-btn").disabled = true;
    document.getElementById("cd-toggle-btn").classList.add("disabled");

    const albumCover = document.getElementById("album-cover");
    const cdContainer = document.getElementById("cd-container");
    const cdImage = document.getElementById("cd-image");
    const placeholderText = document.getElementById("placeholder-text");
    const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg'; // Or your placeholder image URL

    if (!isCdView) {
        // Intention to switch to CD view

        // 1. Ensure the CD wrapper exists *before* updating the image
        if (!cdImage.parentNode.classList.contains("cd-image-wrapper")) {
            const wrapper = document.createElement("div");
            wrapper.classList.add("cd-image-wrapper");
            cdImage.parentNode.insertBefore(wrapper, cdImage);
            wrapper.appendChild(cdImage);
        }

        if (currentSongId) {
            try {
                const response = await fetch(
                    "https://api.spotify.com/v1/me/player/currently-playing",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    const imageUrl = `${data.item.album.images[0].url}?t=${new Date().getTime()}`;
                    await updateImage(cdImage, imageUrl);
                    if (data.is_playing) {
                        cdImage.style.animationPlayState = "running";
                    } else {
                        cdImage.style.animationPlayState = "paused";
                    }
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error(
                    "Error fetching currently playing song for CD image:",
                    error
                );
            }
        } else {
            await updateImage(cdImage, placeholderImageUrl);
        }

        // 2. *After* the image is ready (or placeholder is set), switch visibility
        isCdView = true;
        albumCover.style.display = 'none';
        cdContainer.style.display = 'flex';
        placeholderText.style.display = 'none';

    } else {
        // Intention to switch to album cover view

        if (currentSongId) {
            try {
                const response = await fetch(
                    "https://api.spotify.com/v1/me/player/currently-playing",
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    const imageUrl = `${data.item.album.images[0].url}?t=${new Date().getTime()}`;
                    await updateImage(albumCover, imageUrl);
                } else {
                    handleApiError(response);
                }
            } catch (error) {
                console.error(
                    "Error fetching currently playing song for album cover:",
                    error
                );
            }
        } else {
            await updateImage(albumCover, placeholderImageUrl);
        }

        // 1. Switch visibility *before* potentially removing the wrapper
        isCdView = false;
        cdContainer.style.display = 'none';
        albumCover.style.display = 'block';
        placeholderText.style.display = 'none';

        // 2. Remove the wrapper when switching back to album view
        if (cdImage.parentNode.classList.contains("cd-image-wrapper")) {
            const wrapper = cdImage.parentNode;
            wrapper.parentNode.insertBefore(cdImage, wrapper);
            wrapper.parentNode.removeChild(wrapper);
        }
    }

    // Re-enable toggle button after 1 second
    setTimeout(() => {
        isToggleDisabled = false;
        document.getElementById("cd-toggle-btn").disabled = false;
        document.getElementById("cd-toggle-btn").classList.remove("disabled");
    }, 1000);

    // Log the size of the image wrapper after updating the UI
    logImageWrapperSize();
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

async function initializeApp() {
    if (window.location.hash) {
        await handleRedirect();
    } else {
        checkAuthentication();
    }

    if (!isLoggedIn) {
        return; // Don't proceed if not logged in
    }

    document.getElementById('login-screen').style.display = 'none';
    document.querySelector('.fullscreenify-container').style.display = 'flex';

    await getCurrentlyPlaying();

    if (!currentSongId) {
        displayPlaceholder();
    }

    initialLoadComplete = true;
    scheduleTokenRefresh();
}
initializeApp();