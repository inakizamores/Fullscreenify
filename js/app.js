function updateUI(data) {
    const albumCover = document.getElementById('album-cover');
    const artistName = document.getElementById('artist-name');
    const songName = document.getElementById('song-name');

    albumCover.src = data.item.album.images[0].url;
    albumCover.style.display = 'block';

    document.body.style.backgroundColor = '#222';

    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${data.item.album.images[0].url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    document.querySelector('.controls').style.display = 'flex';

    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (data.is_playing) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    } else {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }

    artistName.innerText = data.item.artists[0].name;
    songName.innerText = data.item.name;

    // Recalculate text positions when the image is fully loaded
    albumCover.onload = () => {
        if (infoContainer.classList.contains('show')) {
            positionArtistAndSong();
        }
    };
}

function displayPlaceholder() {
    const albumCover = document.getElementById('album-cover');
    albumCover.src = 'https://upload.wikimedia.org/wikipedia/commons/6/60/Kanye_donda.jpg';
    albumCover.style.display = 'block';

    document.body.style.backgroundColor = '#222';

    document.querySelector('.controls').style.display = 'none';
}

function handleApiError(response) {
    if (response.status === 401) {
        localStorage.removeItem('fullscreenify_access_token');
        checkAuthentication();
    } else {
        console.error('API Error:', response.status, response.statusText);
    }
}

document.getElementById('play-btn').addEventListener('click', playSong);
document.getElementById('pause-btn').addEventListener('click', pauseSong);
document.getElementById('next-btn').addEventListener('click', nextSong);
document.getElementById('prev-btn').addEventListener('click', prevSong);

const UPDATE_INTERVAL = 3000;
let currentSongId = null;

async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            displayPlaceholder();
        } else if (response.ok) {
            const data = await response.json();

            if (data.item.id !== currentSongId) {
                currentSongId = data.item.id;
                updateUI(data);
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
    }
}

function startUpdatingSongInfo() {
    setInterval(async () => {
        await getCurrentlyPlaying();
    }, UPDATE_INTERVAL);
}

window.addEventListener('load', () => {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }

    if (accessToken) {
        startUpdatingSongInfo();
    }
});

const albumCover = document.getElementById('album-cover');
const infoContainer = document.getElementById('info-container');
const artistName = document.getElementById('artist-name');
const songName = document.getElementById('song-name');

function positionArtistAndSong() {
    const albumCoverRect = albumCover.getBoundingClientRect();
    const scale = 0.75;

    // Calculate the scaled width and height
    const scaledWidth = albumCoverRect.width * scale;
    const scaledHeight = albumCoverRect.height * scale;

    // Calculate the offset caused by scaling
    const offsetX = (albumCoverRect.width - scaledWidth) / 2;
    const offsetY = (albumCoverRect.height - scaledHeight) / 2;

    // Adjust the position of artist and song names
    artistName.style.left = `${albumCoverRect.left - offsetX + (albumCoverRect.width * 0.12) - artistName.offsetWidth}px`; // Position to the left
    artistName.style.top = `${albumCoverRect.top + offsetY + scaledHeight / 2 - artistName.offsetHeight / 2}px`; // Vertically center

    songName.style.left = `${albumCoverRect.right - offsetX - (albumCoverRect.width * 0.15)}px`; // Position to the right
    songName.style.top = `${albumCoverRect.top + offsetY + scaledHeight / 2 - songName.offsetHeight / 2}px`; // Vertically center
    
    artistName.style.fontSize = `${scaledWidth * 0.05}px`;
    songName.style.fontSize = `${scaledWidth * 0.05}px`;

    // Adjust for mobile view
    if (window.innerWidth <= 768) {
        artistName.style.left = '50%';
        artistName.style.top = `${albumCoverRect.top + offsetY - 10}px`; // 10px above the scaled image
        artistName.style.transform = 'translateX(-50%)'; // Center horizontally

        songName.style.left = '50%';
        songName.style.top = `${albumCoverRect.top + offsetY + scaledHeight + 10}px`; // 10px below the scaled image
        songName.style.transform = 'translateX(-50%)'; // Center horizontally
    } else {
        artistName.style.transform = 'none';
        songName.style.transform = 'none';
    }
}

albumCover.addEventListener('click', () => {
    infoContainer.classList.toggle('show');
    albumCover.classList.toggle('info-visible');

    if (infoContainer.classList.contains('show')) {
        positionArtistAndSong();
    }
});

// Reposition text on window resize
window.addEventListener('resize', () => {
    if (infoContainer.classList.contains('show')) {
        positionArtistAndSong();
    }
});