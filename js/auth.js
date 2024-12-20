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

    if (accessToken) {
        // Store the access token securely (e.g., local storage)
        localStorage.setItem('fullscreenify_access_token', accessToken);
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
function checkAuthentication() {
    if (!isLoggedIn) {
        // Show the login screen if not authenticated
        document.getElementById('login-screen').style.display = 'flex';
        document.querySelector('.fullscreenify-container').style.display = 'none';
    } else {
        // Fetch the currently playing song if authenticated
        getCurrentlyPlaying(); 
    }
}

// Function to handle logout
function handleLogout() {
    // Remove the access token from local storage
    localStorage.removeItem('fullscreenify_access_token');
    isLoggedIn = false;

    // Force a page refresh to clear the URL and state
    window.location.href = window.location.origin + window.location.pathname;

    // Update the UI (hide main content, show login screen)
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-screen').classList.add('logout'); // Add logout class for styling
    document.querySelector('.fullscreenify-container').style.display = 'none';
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