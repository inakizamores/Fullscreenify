const ACTIVE_UPDATE_INTERVAL = 250;
const INACTIVE_UPDATE_INTERVAL = 2000;
let updateIntervalId = null;
let currentSongId = null;
let currentIsPlaying = null;
let currentBackgroundImage = null;
let isCdView = false;
const imageCache = new Set();
let isToggling = false;

// Updated UI
async function updateUI(data) {
    const timestamp = new Date().getTime();
    const albumCover = document.getElementById('album-cover');
    const cdImage = document.getElementById('cd-image');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const isPlaying = data.is_playing;
    const imageContainer = document.querySelector('.image-container');

    const imageUrl = `${data.item.album.images[0].url}?t=${timestamp}`;

    manageImageCache(imageUrl);


     // Update body background image only if the song is different
    if (data.item.id !== currentSongId) {
        await preloadImage(imageUrl); // Preload the new background image
        document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${imageUrl})`;
        currentBackgroundImage = imageUrl;
    }


    if (!isCdView) {
        // Album cover view
        await updateImage(albumCover, imageUrl);
        albumCover.style.display = 'block';
        document.getElementById('cd-container').style.display = 'none';
        document.getElementById('placeholder-text').style.display = 'none';
    } else {
        // CD view
        await updateImage(cdImage, imageUrl);
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
    document.body.style.backgroundImage = 'none';
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
     if (isToggling) return; // Prevent multiple calls

    isToggling = true;
    isCdView = !isCdView;
    const albumCover = document.getElementById('album-cover');
    const cdContainer = document.getElementById('cd-container');
    const cdImage = document.getElementById('cd-image');
    const placeholderText = document.getElementById('placeholder-text');

   if (currentSongId){
          const currentToken = localStorage.getItem('fullscreenify_access_token');

         try {
              const {status, data, error} = await getCurrentlyPlaying();
                if (status === 200){
                    currentIsPlaying = data.is_playing
                    await updateUI(data)

                }else {
                   handleApiError(error);
                }

         } catch (error) {
             console.error('Error fetching currently playing song for CD image:', error);
         }
    }
     if (isCdView) {
         // Switch to CD view
        albumCover.style.display = 'none';
        cdContainer.style.display = 'flex';

     } else {
         // Switch to album cover view
         cdContainer.style.display = 'none';
     }
     isToggling = false; //Allow future calls

}

async function togglePlayPause() {
    const currentToken = localStorage.getItem('fullscreenify_access_token');
    try {
         const {status, data, error} = await getCurrentlyPlaying();

        if (status === 200) {
            currentIsPlaying = data.is_playing;
             await updateUI(data)

            if (currentIsPlaying) {
                await pauseSong(currentToken);
            } else {
                await playSong(currentToken);
            }
              await getCurrentlyPlaying();


        } else {
            handleApiError(error);
        }
    } catch (error) {
        console.error('Error toggling play/pause:', error);
    }
}

async function getCurrentlyPlaying() {
    try {
         const {status, data, error} =  await getCurrentlyPlayingApi()
        if (status === 204) {
            // No content - nothing is playing
            displayPlaceholder();
            startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
        } else if (status === 200) {
             currentIsPlaying = data.is_playing
            // Update UI if the song or playback state has changed
            if (data.item.id !== currentSongId || data.is_playing !== currentIsPlaying) {
               await updateUI(data);
               currentSongId = data.item.id;

            }

            // Adjust update interval based on playing state
            if (data.is_playing) {
                startUpdatingSongInfo(ACTIVE_UPDATE_INTERVAL);
            } else {
                startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            }
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
            hideSessionExpiredModal()
        } else {
            handleApiError(error);
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
    }
}
async function getCurrentlyPlayingApi() {
    try {
         const token = localStorage.getItem('fullscreenify_access_token');
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) {
            // No content - nothing is playing
             return {status:204};
        } else if (response.ok) {
            const data = await response.json();
           
            return {status:200, data:data};

        } else {
            handleApiError(response);
            return {status:'error', error: response}
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
          return {status:'error', error: error}
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


async function preloadImage(imageUrl) {
   return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = resolve;
        img.onerror = reject;
    });
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