const clientId = 'YOUR_SPOTIFY_CLIENT_ID'; // Replace with your actual Client ID
const redirectUri = 'YOUR_REDIRECT_URI'; // Replace with your Redirect URI (e.g., http://localhost:5500/ or your Netlify URL)
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
        // Hide the login button
        document.getElementById('login-btn').style.display = 'none';
        // Fetch the currently playing song
        getCurrentlyPlaying();
    }
}

function checkAuthentication() {
    accessToken = localStorage.getItem('fullscreenify_access_token');
    if (!accessToken) {
        // Show the login button if not authenticated
        document.getElementById('login-btn').style.display = 'block';
    } else {
        // Fetch the currently playing song if authenticated
        getCurrentlyPlaying();
    }
}

// Event listener for the login button
document.getElementById('login-btn').addEventListener('click', handleLogin);

// Check for redirect and existing authentication on page load
window.addEventListener('load', () => {
    if (window.location.hash) {
        handleRedirect();
    } else {
        checkAuthentication();
    }
});