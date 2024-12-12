const clientId = 'c9aaff6bc4d0497eb4d2c2cad732a923'; // Your actual Client ID
//const redirectUri = 'http://localhost:5500/'; // Your Redirect URI (e.g., http://localhost:5500/ or your Netlify URL)
const redirectUri = 'https://fullscreenify.netlify.app/';
const scopes = [
    'user-read-currently-playing',
    'user-modify-playback-state',
    'user-read-playback-state'
];

let accessToken = null;

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
    window.location.href = authUrl.toString();
}

function handleRedirect() {
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    accessToken = hashParams.get('access_token');

    if (accessToken) {
        // Store the access token securely (e.g., local storage)
        localStorage.setItem('fullscreenify_access_token', accessToken);
        // Hide the login screen
        document.getElementById('login-screen').style.display = 'none';
        // Show the main content
        document.querySelector('.fullscreenify-container').style.display = 'flex';
        // Fetch the currently playing song
        getCurrentlyPlaying();
    }
}

function checkAuthentication() {
    accessToken = localStorage.getItem('fullscreenify_access_token');
    if (!accessToken) {
        // Show the login screen if not authenticated
        document.getElementById('login-screen').style.display = 'flex';
        document.querySelector('.fullscreenify-container').style.display = 'none';
    } else {
        // Show the main content
        document.querySelector('.fullscreenify-container').style.display = 'flex';
        // Fetch the currently playing song if authenticated
        getCurrentlyPlaying();
    }
}

// Function to handle logout
function handleLogout() {
    // Remove the access token from local storage
    localStorage.removeItem('fullscreenify_access_token');

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

// Check for redirect and existing authentication on page load
window.addEventListener('load', () => {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
});