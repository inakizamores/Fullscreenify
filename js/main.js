// main.js

import { getCurrentlyPlaying, simulateTokenExpiration, handleApiError } from './api.js';
import {  displayPlaceholder, showSessionExpiredModal, hideSessionExpiredModal, startUpdatingSongInfo, toggleCdView, isToggleDisabled, currentSongId, initialLoadComplete } from './ui.js';
import { requestWakeLock, releaseWakeLock } from './wakeLock.js';
import { handleLogin, scheduleTokenRefresh, checkAuthentication, handleRedirect, isLoggedIn} from './auth.js';

// --- Hide UI Toggle Functionality ---
// Add an event listener to the "Hide UI Toggle" button
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

document.getElementById('test-expiry-btn').addEventListener('click', () => {
    simulateTokenExpiration();
});

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

// Release the wake lock when the user logs out
export function handleLogout() {
    // Remove the access token from local storage
    localStorage.removeItem('fullscreenify_access_token');
    localStorage.removeItem('fullscreenify_token_expiration'); // Also remove expiration time
    isLoggedIn = false;

    // Force a page refresh to clear the URL and state
    window.location.href = window.location.origin + window.location.pathname;

    // Update the UI (hide main content, show login screen)
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-screen').classList.add('logout'); // Add logout class for styling
    document.querySelector('.fullscreenify-container').style.display = 'none';

    releaseWakeLock();
}

initializeApp();