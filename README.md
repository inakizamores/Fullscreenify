# Fullscreenify

Fullscreenify is a web application that displays the album cover of your currently playing Spotify song in full-screen mode with interactive playback controls.

## Features

-   Fetches the currently playing song from Spotify.
-   Displays the album artwork in full-screen.
-   Hover animations for play, pause, and skip controls.
-   Responsive design for desktop and mobile.

## Prerequisites

-   A Spotify Developer account.
-   Your Spotify application's Client ID and Client Secret.
-   A web server for local testing (e.g., Live Server for VS Code).
-   A Netlify account for deployment (optional).

## Setup

1. **Spotify Developer Dashboard:**
    -   Create a new application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
    -   Obtain your Client ID and Client Secret.
    -   Add `http://localhost:5500` (or your local development URL) as a Redirect URI.
2. **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd Fullscreenify
    ```
3. **Update `auth.js`:**
    -   Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID.
    -   Replace `YOUR_REDIRECT_URI` with your local development Redirect URI.
4. **Local Development:**
    -   Use a live server (e.g., Live Server in VS Code) to open `index.html`.
    -   Click "Login with Spotify" to authenticate.

## Deployment (Netlify)

1. Push your code to a GitHub repository.
2. Create a new site on Netlify and connect it to your GitHub repository.
3. In your Netlify site settings:
    -   Set the production branch (usually `main` or `master`).
4. Update the Redirect URI in your Spotify Developer Dashboard to your Netlify site's URL (e.g., `https://fullscreenify.netlify.app`).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (You can add a LICENSE file if you want to specify licensing terms)