let accessToken = localStorage.getItem('fullscreenify_access_token');

async function getCurrentlyPlaying() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
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

// ... (Existing code for variables and functions) ...


async function playSong(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
           handleApiError(response);
        }
    } catch (error) {
        console.error('Error playing song:', error);
    }
}

async function pauseSong(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error pausing song:', error);
    }
}

async function nextSong(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 204) {
            console.log('Skipped to next song successfully.');
        } else {
            const errorData = await response.json();
            console.error('Error skipping to next song:', errorData);
            handleApiError(response);
        }
    } catch (error) {
        console.error('Network error while skipping to next song:', error);
    }
}

async function prevSong(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            handleApiError(response);
        }
    } catch (error) {
        console.error('Error moving to previous song:', error);
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