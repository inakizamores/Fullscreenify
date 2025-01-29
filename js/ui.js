// ui.js

import { getCurrentlyPlaying, playSong, pauseSong, nextSong, prevSong, handleApiError } from './api.js';
import { animateCD, startCDAnimation, stopCDAnimation } from './cdAnimation.js';

export const ACTIVE_UPDATE_INTERVAL = 250;
export const INACTIVE_UPDATE_INTERVAL = 2000;
export let updateIntervalId = null;
export let currentSongId = null;
export let currentIsPlaying = null;
export let currentBackgroundImage = null;
export let isCdView = false;
export const imageCache = new Set();
export let isToggleDisabled = false; // Flag to disable toggle during cooldown
export let initialLoadComplete = false; // Flag to track if initial load is done

// Function to update image with debugging
export function updateImage(imgElement, imageUrl) {
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
export function logImageWrapperSize() {
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
export function preloadBackgroundImage(imageUrl, callback) {
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

export function showSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'block';
}

export function hideSessionExpiredModal() {
    const modal = document.getElementById('session-expired-modal');
    modal.style.display = 'none';
}

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

export function stopUpdatingSongInfo() {
    if (updateIntervalId) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}

export async function toggleCdView() {
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
export async function togglePlayPause() {
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

export function manageImageCache(imageUrl) {
    const MAX_CACHE_SIZE = 50;

    if (!imageCache.has(imageUrl)) {
        if (imageCache.size >= MAX_CACHE_SIZE) {
            const firstImageUrl = imageCache.values().next().value;
            imageCache.delete(firstImageUrl);
        }
        imageCache.add(imageUrl);
    }
}

document.getElementById('re-authenticate-btn').addEventListener('click', () => {
    hideSessionExpiredModal();
    handleLogin();
});

document.getElementById('cd-toggle-btn').addEventListener('click', toggleCdView);

document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);