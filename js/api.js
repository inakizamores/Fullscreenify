async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            // No content - nothing is playing
            displayPlaceholder();
            startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
        } else if (response.ok) {
            const data = await response.json();

            // Update UI if the song or playback state has changed
            if (data.item.id !== currentSongId || data.is_playing !== currentIsPlaying) {
                updateUI(data);
                currentSongId = data.item.id;
                currentIsPlaying = data.is_playing;
            }

            // Adjust update interval based on playing state
            if (data.is_playing) {
                startUpdatingSongInfo(ACTIVE_UPDATE_INTERVAL);
            } else {
                startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            }
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
    }
}

// ... (Existing code for variables and functions) ...

async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            // No content - nothing is playing
            displayPlaceholder();
            startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
        } else if (response.ok) {
            const data = await response.json();

            // Update UI if the song or playback state has changed
            if (data.item.id !== currentSongId || data.is_playing !== currentIsPlaying) {
                updateUI(data);
                currentSongId = data.item.id;
                currentIsPlaying = data.is_playing;
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
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error fetching currently playing song:', error);
    }
}

function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired or invalid.
        console.error('API Error 401: Unauthorized. Access token expired.');
        showSessionExpiredModal(); // Show the session expired modal
    } else {
        console.error('API Error:', response.status, response.statusText);
    }
}

// ... (Existing code for playSong, pauseSong, nextSong, prevSong) ...

async function playSong() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error playing song:', error);
    }
}

async function pauseSong() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error pausing song:', error);
    }
}

async function nextSong() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            console.log('Skipped to next song successfully.');
            // Fetch the currently playing song to update the UI
            await getCurrentlyPlaying();
        } else {
            const errorData = await response.json();
            console.error('Error skipping to next song:', errorData);
            handleApiError(response);
        }
    } catch (error) {
        console.error('Network error while skipping to next song:', error);
    }
}

async function prevSong() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error moving to previous song:', error);
    }
}