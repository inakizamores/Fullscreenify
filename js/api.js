async function getCurrentlyPlaying(accessToken) {
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
            if (data.item.id !== currentSongId) {
                currentSongId = data.item.id;
                updateUI(data);
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

async function playSong(accessToken) {
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

async function pauseSong(accessToken) {
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

async function nextSong(accessToken) {
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
            await getCurrentlyPlaying(accessToken);

        } else {
            const text = await response.text(); // Get response as text first
            try {
                const errorData = JSON.parse(text); // Try to parse as JSON
                console.error('Error skipping to next song:', errorData);
            } catch (e) {
                console.error('Error skipping to next song (non-JSON response):', text);
            }
            handleApiError(response);
        }
    } catch (error) {
        console.error('Network error while skipping to next song:', error);
    }
}

async function prevSong(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 204) {
            console.log('Previous song played successfully.');
            // Fetch the currently playing song to update the UI
            await getCurrentlyPlaying(accessToken);

        } else {
            const text = await response.text(); // Get response as text first
            try {
                const errorData = JSON.parse(text); // Try to parse as JSON
                console.error('Error playing previous song:', errorData);
            } catch (e) {
                console.error('Error playing previous song (non-JSON response):', text);
            }
            handleApiError(response);
        }
    } catch (error) {
        console.error('Network error while playing to previous song:', error);
    }
}

async function fetchPlaylistTracks(accessToken, playlistId, nextTrackIndex) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${nextTrackIndex}&limit=1`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const playlistData = await response.json();
            if (playlistData.items && playlistData.items.length > 0) {
                const nextImageUrl = playlistData.items[0].track.album.images[0].url;
                preloadImage(nextImageUrl);
            }
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error fetching playlist tracks for preloading:', error);
    }
}

export { getCurrentlyPlaying, playSong, pauseSong, nextSong, prevSong, fetchPlaylistTracks };