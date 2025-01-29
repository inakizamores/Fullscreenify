// app.js
import { getCurrentlyPlaying, playSong, pauseSong, nextSong, prevSong } from './api.js';
import { handleLogin, handleRedirect, checkAuthentication, handleLogout, refreshToken, accessToken, isLoggedIn } from './auth.js';

export const ACTIVE_UPDATE_INTERVAL = 250;
export const INACTIVE_UPDATE_INTERVAL = 2000;
let updateIntervalId = null;
export let currentSongId = null;
export let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false;
const imageCache = new Set();
let isToggleDisabled = false; // Flag to disable toggle during cooldown
let initialLoadComplete = false; // Flag to track if initial load is done

// Wake Lock Variables
let wakeLock = null;

// --- Cursor Hiding Functionality ---
let cursorIdleTimer;
const cursorIdleDelay = 5000; // 5 seconds (adjust as needed)

function hideCursor() {
    document.body.style.cursor = 'none';
}

function resetCursorIdleTimer() {
    clearTimeout(cursorIdleTimer);
    document.body.style.cursor = 'default'; // Show the cursor
    cursorIdleTimer = setTimeout(hideCursor, cursorIdleDelay);
}

function handleUserActivity() {
    // Reset the timer whenever there's user activity (mousemove, keypress, touchstart, etc.)
    resetCursorIdleTimer();
}

// Attach event listeners for user activity
function attachCursorActivityListeners() {
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity); // For touch devices
}

// Remove event listeners
function removeCursorActivityListeners() {
    document.removeEventListener('mousemove', handleUserActivity);
    document.removeEventListener('keypress', handleUserActivity);
    document.removeEventListener('touchstart', handleUserActivity);
}

// --- End of Cursor Hiding Functionality ---

// --- CD Animation Code ---
let rotationAngle = 0;
const cdImage = document.getElementById('cd-image');
let lastTimestamp = 0;
let animationId;

function animateCD(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const rotationPeriod = 10000; // 10 seconds
    const rotationSpeed = 360 / rotationPeriod;

    rotationAngle += rotationSpeed * deltaTime;
    rotationAngle %= 360;

    cdImage.style.transform = `rotate(${rotationAngle}deg)`;

    animationId = requestAnimationFrame(animateCD);
}

function startCDAnimation() {
    lastTimestamp = performance.now();
    if (!animationId) {
        animationId = requestAnimationFrame(animateCD);
    }
}

function stopCDAnimation() {
    cancelAnimationFrame(animationId);
    animationId = null;
}
// --- End of CD Animation Code ---

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
export function updateUI(data) {
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
          //cdImage.style.animationPlayState = "running";
          startCDAnimation()
        }
      } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.title = "Play";
        playPauseBtn.classList.add("play-icon");
        if (isCdView) {
          //cdImage.style.animationPlayState = "paused";
          stopCDAnimation();
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

export function displayPlaceholder() {
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
         document.getElementById("cd-container").style.display = "none";
    } else {
        // CD view
        const cdImage = document.getElementById("cd-image");
        updateImage(cdImage, placeholderImageUrl);
        cdImage.style.display = "block";
        document.getElementById("album-cover").style.display = "none";
        document.getElementById("cd-container").style.display = "flex";
    }
    document.body.style.backgroundColor = '#222';
    document.body.style.backgroundImage = 'none';
    currentBackgroundImage = null;
    imageContainer.classList.add("placeholder-active");

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

export function startUpdatingSongInfo(interval) {
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
                        startCDAnimation();
                    } else {
                        stopCDAnimation();
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

        stopCDAnimation(); // Stop the CD animation when switching to album view
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

// Function to request the wake lock
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active!');

        // Handle cursor hiding when Wake Lock is active
        attachCursorActivityListeners();
        resetCursorIdleTimer();

        document.addEventListener('visibilitychange', handleVisibilityChange);

    } catch (err) {
        console.error(`Wake Lock Error: ${err.name}, ${err.message}`);

        // Attach cursor activity listeners if Wake Lock request fails
        attachCursorActivityListeners();
        resetCursorIdleTimer();
    }
}

// Function to release the wake lock
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release()
        .then(() => {
            wakeLock = null;
            console.log('Wake Lock released!');

            // Make sure cursor is visible when wake lock is released
            document.body.style.cursor = 'default'; 
            // Remove listeners when the Wake Lock is released
            removeCursorActivityListeners();
        });
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// Function to handle visibility change
async function handleVisibilityChange() {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        console.log('Visibility changed to visible, re-requesting wake lock.');
        await requestWakeLock();
    }
}

document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);
document.getElementById('cd-toggle-btn').addEventListener('click', toggleCdView);

// --- Hide UI Toggle Functionality ---
// Add an event listener to the "Hide UI Toggle"
const hideUiBtn = document.getElementById('hide-ui-btn');
const uiButtonsContainer = document.getElementById('ui-buttons-container');

hideUiBtn.addEventListener('click', () => {
    // Toggle the 'hidden' class on the button group container
    uiButtonsContainer.classList.toggle('hidden');
});
// --- End of Hide UI Toggle Functionality ---

// --- Keyboard Controls ---
function handleKeyPress(event) {
    // Check if the pressed key is 'M' (case-insensitive)
    if (event.key.toLowerCase() === 'm') {
        // Check if the toggle is currently disabled
        if (!isToggleDisabled) {
            toggleCdView(); // Call the existing toggle function
        }
    }

    // Check for other keys
    switch (event.key.toLowerCase()) {
        case ' ': // Spacebar
            event.preventDefault(); // Prevent default spacebar behavior (scrolling)
            togglePlayPause();
            break;
        case 'arrowleft': // Left Arrow
            prevSong();
            break;
        case 'arrowright': // Right Arrow
            nextSong();
            break;
        case 'f': // F key
            toggleFullscreen();
            break;
        case 'h': // H key
            // Toggle the 'hidden' class on the button group container
            uiButtonsContainer.classList.toggle('hidden');
            break;
    }
}

// Add a keypress event listener to the window
window.addEventListener('keydown', handleKeyPress); // Use keydown instead of keypress

// --- End of Keyboard Controls ---

// --- Fullscreen Toggle Functionality ---
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Function to check if the document is currently in fullscreen mode
function isFullscreen() {
    return !!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.mozFullScreenElement || !!document.msFullscreenElement;
}

// Function to toggle fullscreen mode
async function toggleFullscreen() {
    if (!isFullscreen()) {
        // Enter fullscreen (with fallback for various browsers)
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                await document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.msRequestFullscreen) {
                await document.documentElement.msRequestFullscreen();
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
        }
    } else {
        // Exit fullscreen (with fallback for various browsers)
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }
        } catch (error) {
            console.error('Error exiting fullscreen:', error);
        }
    }
}

// Event listener for the fullscreen button
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Function to update the fullscreen button icon based on the fullscreen state
function updateFullscreenButtonIcon() {
    if (isFullscreen()) {
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        fullscreenBtn.title = 'Exit Fullscreen';
    } else {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Toggle Fullscreen';
    }
}

// Attach a single event listener for all fullscreen change events
function handleFullscreenChange() {
  updateFullscreenButtonIcon();
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Call updateFullscreenButtonIcon initially to set the correct state
updateFullscreenButtonIcon();

// --- End of Fullscreen Toggle Functionality ---

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

    if (currentSongId) {
        // Request wake lock only if a song is playing
        await requestWakeLock();
    } else {
        displayPlaceholder();
        // Attach cursor activity listeners if no song is playing
        attachCursorActivityListeners();
        resetCursorIdleTimer();
    }

    initialLoadComplete = true;
    scheduleTokenRefresh();
}