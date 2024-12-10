function updateUI(data) {
    const albumCover = document.getElementById('album-cover');
    albumCover.src = data.item.album.images[0].url;
    albumCover.style.display = 'block';

    document.body.style.backgroundColor = '#222'; // Reset or set to a default color

    // Set the background to the album art
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url(${data.item.album.images[0].url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';

    // Show controls
    document.querySelector('.controls').style.display = 'flex';

    // Update play/pause button based on the current state
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    if (data.is_playing) {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
    } else {
        playBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }
}

function displayPlaceholder() {
    const albumCover = document.getElementById('album-cover');
    albumCover.src = 'placeholder-image.jpg'; // Replace with your actual placeholder image
    albumCover.style.display = 'block';

    document.body.style.backgroundColor = '#222'; // Set to a default color

    // Hide controls if nothing is playing
    document.querySelector('.controls').style.display = 'none';
}

function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid.
        localStorage.removeItem('fullscreenify_access_token'); // Clear token
        checkAuthentication(); // Re-check auth to show login button
    } else {
        // Handle other errors
        console.error('API Error:', response.status, response.statusText);
    }
}

// Event listeners for control buttons
document.getElementById('play-btn').addEventListener('click', playSong);
document.getElementById('pause-btn').addEventListener('click', pauseSong);
document.getElementById('next-btn').addEventListener('click', nextSong);

// Call getCurrentlyPlaying on page load (if authenticated)
// This is handled in auth.js after checking authentication