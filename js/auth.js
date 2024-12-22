const clientId = 'c9aaff6bc4d0497eb4d2c2cad732a923';
const redirectUri = 'https://fullscreenify.netlify.app/';
const scopes = [
    'user-read-currently-playing',
    'user-modify-playback-state',
    'user-read-playback-state'
];

let accessToken = localStorage.getItem('fullscreenify_access_token');
let isLoggedIn = !!accessToken;

// Function to initiate the Spotify authentication process
function handleLogin() {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        response_type: 'token',
        show_dialog: true
    };
    authUrl.search = new URLSearchParams(params).toString();

    // Redirect to the Spotify authorization URL
    window.location.href = authUrl.toString();
}

// Function to handle the redirect from Spotify after authentication
function handleRedirect() {
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    accessToken = hashParams.get('access_token');
    const expiresIn = hashParams.get('expires_in');

    if (accessToken) {
        // Store the access token and expiration time
        const expirationTime = Date.now() + parseInt(expiresIn) * 1000;
        localStorage.setItem('fullscreenify_access_token', accessToken);
        localStorage.setItem('fullscreenify_token_expiration', expirationTime);

        isLoggedIn = true;
        // Hide the login screen and the session expired modal
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('session-expired-modal').style.display = 'none';
        // Show the main content
        document.querySelector('.fullscreenify-container').style.display = 'flex';
        // Fetch the currently playing song
        getCurrentlyPlaying();

        // Clear the hash from the URL
        clearHashFromUrl();
    }
}

// Function to check the user's authentication status
async function checkAuthentication() {
    if (!isLoggedIn) {
        // Show the login screen if not authenticated
        document.getElementById('login-screen').style.display = 'flex';
        document.querySelector('.fullscreenify-container').style.display = 'none';
    } else {
        // Fetch the currently playing song if authenticated
        await getCurrentlyPlaying();
        if (currentSongId === null) {
            displayPlaceholder();
            startUpdatingSongInfo(INACTIVE_UPDATE_INTERVAL);
        }
    }
}

// Function to handle logout
function handleLogout() {
    // Remove the access token from local storage
    localStorage.removeItem('fullscreenify_access_token');
    localStorage.removeItem('fullscreenify_token_expiration'); // Also remove expiration time
    isLoggedIn = false;

    // Force a page refresh to clear the URL and state
    window.location.href = window.location.origin + window.location.pathname;

    // Update the UI (hide main content, show login screen)
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-screen').classList.add('logout'); // Add logout class for styling
    document.querySelector('.fullscreenify-container').style.display = 'none';
}

// Function to refresh the access token
function refreshToken() {
    console.log('Refreshing access token...');

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'hidden-auth-iframe';
    document.body.appendChild(iframe);

    // Set the source of the iframe to the Spotify authorization URL
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        response_type: 'token',
        show_dialog: false // Try silent authentication
    };
    authUrl.search = new URLSearchParams(params).toString();
    iframe.src = authUrl.toString();

    // Listen for messages from the iframe
    window.addEventListener('message', handleIframeMessage);

    // Handle the message received from the iframe
    function handleIframeMessage(event) {
        // Check if the message is from Spotify and if it's from the hidden iframe
        if (event.origin === 'https://accounts.spotify.com' && event.source === iframe.contentWindow) {
            const hashParams = new URLSearchParams(event.data);
            const newAccessToken = hashParams.get('access_token');
            const expiresIn = hashParams.get('expires_in');

            if (newAccessToken) {
                // Update the access token and expiration time
                const expirationTime = Date.now() + parseInt(expiresIn) * 1000;
                accessToken = newAccessToken;
                localStorage.setItem('fullscreenify_access_token', newAccessToken);
                localStorage.setItem('fullscreenify_token_expiration', expirationTime);

                console.log('Access token refreshed successfully.');
                // Schedule the next refresh
                scheduleTokenRefresh();
                // Refresh the currently playing song
                getCurrentlyPlaying();
            } else {
                console.error('Failed to refresh access token.');
                // Handle refresh failure (e.g., show session expired modal)
                showSessionExpiredModal();
            }

            // Clean up: remove the iframe and event listener
            document.body.removeChild(iframe);
            window.removeEventListener('message', handleIframeMessage);
        }
    }
}

// Event listener for the login button
document.getElementById('login-btn').addEventListener('click', handleLogin);

// Event listener for the logout button
document.getElementById('logout-btn').addEventListener('click', handleLogout);

// Check for redirect and existing authentication on page load (only once)
function initializeAuthentication() {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
}

// Function to remove the access token from the URL
function clearHashFromUrl() {
    if (window.history && window.history.pushState) {
        // Using pushState to change the URL without reloading the page
        window.history.pushState({}, document.title, window.location.pathname);
    } else {
        // Fallback for older browsers
        window.location.hash = '';
    }
}

// Call initializeAuthentication() only once on page load
initializeAuthentication();