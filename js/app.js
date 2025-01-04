// app.js
const ACTIVE_UPDATE_INTERVAL = 250;
const INACTIVE_UPDATE_INTERVAL = 2000;
let updateIntervalId = null;
let currentSongId = null;
let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false;
const imageCache = new Set();
let isToggleDisabled = false;
let initialLoadComplete = false;
let backgroundImageContainer = null; // To store the background div


// Cursor hiding functionality
let idleTimer;
const idleDelay = 10000;

function hideCursor() {
    document.body.style.cursor = 'none';
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    document.body.style.cursor = 'default';
    idleTimer = setTimeout(hideCursor, idleDelay);
}

window.addEventListener('mousemove', resetIdleTimer);
window.addEventListener('keypress', resetIdleTimer);
resetIdleTimer();

function updateImage(imgElement, imageUrl) {
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

function logImageWrapperSize() {
    const imageWrapper = document.querySelector('.image-wrapper');
    console.log("Image Wrapper Size:", { width: imageWrapper.offsetWidth, height: imageWrapper.offsetHeight });
}

function updateUI(data) {
    const timestamp = new Date().getTime();
    const albumCover = document.getElementById("album-cover");
    const cdImage = document.getElementById("cd-image");
    const playPauseBtn = document.getElementById("play-pause-btn");
    const isPlaying = data.is_playing;
    const imageContainer = document.querySelector(".image-container");
    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    manageImageCache(imageUrl);


    if (imageUrl !== currentBackgroundImage) {
        const newBackgroundImage = new Image();
        newBackgroundImage.src = imageUrl;
        newBackgroundImage.onload = () => {
            if (!backgroundImageContainer) {
                backgroundImageContainer = document.createElement('div');
                backgroundImageContainer.id = 'background-image-container';
                document.body.insertBefore(backgroundImageContainer, document.body.firstChild);
            }

            backgroundImageContainer.style.backgroundImage = `url(${imageUrl})`;
            backgroundImageContainer.style.opacity = 1;
            currentBackgroundImage = imageUrl;
        };


        if (backgroundImageContainer) {
            backgroundImageContainer.style.opacity = 0;
        }
    }

    if (!isCdView) {
        updateImage(albumCover, imageUrl)
            .then(() => {
                albumCover.style.display = "block";
                document.getElementById("cd-container").style.display = "none";
                document.getElementById("placeholder-text").style.display = "none";
            });

    } else {
        updateImage(cdImage, imageUrl)
            .then(() => {
                cdImage.style.display = "block";
                document.getElementById("album-cover").style.display = "none";
                document.getElementById("placeholder-text").style.display = "none";
                document.getElementById("cd-container").style.display = "flex";
            });
    }


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

    logImageWrapperSize();
}



function displayPlaceholder() {
    const placeholderText = document.getElementById('placeholder-text');
    placeholderText.textContent = 'START STREAMING TO SEE YOUR CURRENTLY PLAYING ALBUM COVER HERE.';
    placeholderText.style.display = 'block';
    const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';
    const imageContainer = document.querySelector('.image-container');

    currentSongId = null;
    currentIsPlaying = null;

    if (!isCdView) {
        const albumCover = document.getElementById('album-cover');
        updateImage(albumCover, placeholderImageUrl);
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
    } else {

        const cdImage = document.getElementById('cd-image');
        updateImage(cdImage, placeholderImageUrl);
        cdImage.style.display = 'block';
        document.getElementById('album-cover').style.display = 'none';
        document.getElementById('cd-container').style.display = 'flex';
    }

    if (backgroundImageContainer) {
        backgroundImageContainer.style.opacity = 0; // Hide any existing background
        currentBackgroundImage = null;
    }


    imageContainer.classList.add('placeholder-active');


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
        if (initialLoadComplete) {
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

    isToggleDisabled = true;
    document.getElementById("cd-toggle-btn").disabled = true;
    document.getElementById("cd-toggle-btn").classList.add("disabled");

    const albumCover = document.getElementById("album-cover");
    const cdContainer = document.getElementById("cd-container");
    const cdImage = document.getElementById("cd-image");
    const placeholderText = document.getElementById("placeholder-text");
    const placeholderImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';


    if (!isCdView) {


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


        isCdView = true;
        albumCover.style.display = 'none';
        cdContainer.style.display = 'flex';
        placeholderText.style.display = 'none';

    } else {


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


        isCdView = false;
        cdContainer.style.display = 'none';
        albumCover.style.display = 'block';
        placeholderText.style.display = 'none';


        if (cdImage.parentNode.classList.contains("cd-image-wrapper")) {
            const wrapper = cdImage.parentNode;
            wrapper.parentNode.insertBefore(cdImage, wrapper);
            wrapper.parentNode.removeChild(wrapper);
        }
    }


    setTimeout(() => {
        isToggleDisabled = false;
        document.getElementById("cd-toggle-btn").disabled = false;
        document.getElementById("cd-toggle-btn").classList.remove("disabled");
    }, 1000);


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
        return;
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