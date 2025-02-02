// api.js

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

            // Check if the currently playing item is a track
            if (data.currently_playing_type === 'track') {
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
                hideSessionExpiredModal();
            } else {
                // If it's not a track (e.g., podcast, ad), display placeholder
                displayPlaceholder();
                startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            }

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
        } else if (response.ok) {
            // Check if the response is a valid JSON before parsing it
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await response.json();
                console.error('Error skipping to next song:', errorData);
            } else {
                console.error('Error skipping to next song. Non-JSON response received.');
            }
            handleApiError(response);
        } else {
            // Non-ok status codes (like 403, 404, etc.)
            console.error('Error skipping to next song:', response.status, response.statusText);
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

        const prevBtn = document.getElementById('prev-btn');

        if (response.status === 204) {
            console.log('Moved to previous song successfully.');
            // Re-enable the button if it was previously disabled
            prevBtn.disabled = false;
            prevBtn.classList.remove('disabled');
            // Fetch the currently playing song to update the UI
            await getCurrentlyPlaying();
        } else if (response.status === 403) {
            console.log('Cannot go to previous song: You are already at the beginning of the playlist/queue.');
            // Disable the button
            prevBtn.disabled = true;
            prevBtn.classList.add('disabled');
        } else {
            handleApiError(response);
            // Re-enable the button in case of other errors (to avoid getting stuck in disabled state)
            prevBtn.disabled = false;
            prevBtn.classList.remove('disabled');
        }
    } catch (error) {
        console.error('Network error while moving to previous song:', error);
        // Re-enable the button in case of network errors
        document.getElementById('prev-btn').disabled = false;
        prevBtn.classList.remove('disabled');
    }
}