async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            // No content - nothing is playing or the track has changed
            console.log("No content returned (204). Song change detected, updating UI.");
            displayPlaceholder();
            startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
            document.getElementById('login-screen').style.display = 'none';
            document.querySelector('.fullscreenify-container').style.display = 'flex';
            return null; // Return null to indicate no data was received
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
            return data; // Return the data
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
            console.log('Skipped to next song successfully. Waiting for API to update...');
            // Wait for a short time for the API to update
            await new Promise(resolve => setTimeout(resolve, 500)); // Adjust delay as needed
            // Fetch the currently playing song to update the UI
            const data = await getCurrentlyPlaying();
            // Update UI only if data is not null
            if (data) {
                updateUI(data);
            } else {
                console.log("API did not update in time or no song is playing.");
            }
        } else {
            // Handle errors other than 204
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

        if (response.status === 403) {
            // Check if the error is due to no previous track
            const errorData = await response.json();
            if (errorData.error.message.includes("No previous track")) {
                console.log('No previous track available.'); // Optional: Log a message without throwing an error
                return; // Do nothing and exit the function
            } else {
                // Handle other 403 errors as before
                console.error('API Error 403:', errorData.error.message);
                handleApiError(response);
            }
        } else if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error moving to previous song:', error);
    }
}