# Fullscreenify

Fullscreenify is a web application that displays the album cover of your currently playing Spotify song in full-screen mode. It provides interactive playback controls, a toggleable CD display, and dynamically updates the UI as the music changes. The app features a visually engaging design with a dedicated login screen and smooth animations.

## Features

-   **Fetches Currently Playing Song:** Retrieves the currently playing song information from the Spotify API.
-   **Full-Screen Album Art:** Displays the album artwork in full-screen mode for an immersive visual experience.
-   **CD Display Mode:** Allows users to toggle between the album art and a spinning CD display.
-   **Blurred Background:** Applies a blurred background effect based on the album art, creating a visually appealing backdrop.
-   **Interactive Playback Controls:** Provides buttons to play, pause, skip to the next track, and go to the previous track.
-   **Dynamic Updates:** Updates the displayed album art in real-time when the song changes. The update frequency is adjusted based on whether music is actively playing or paused.
-   **Responsive Design:** Adapts to different screen sizes (desktop and mobile) for optimal viewing.
-   **Hover Effects:** Control buttons, album art, and CD image have hover effects for visual feedback.
-   **Automatic Login Persistence:** Stores the Spotify access token in local storage to automatically log the user in on subsequent visits (until the token expires).
-   **Dedicated Login Screen:** Presents a separate login screen with a pulsating Spotify button and a subtle green glow effect for an enhanced user experience.
-   **Placeholder Content:** Displays a message when no music is playing, prompting the user to start streaming.

## How it Works

The application consists of the following core components:

-   **Authentication (`auth.js`):**
    -   Handles user authentication with Spotify using the OAuth 2.0 flow.
    -   Implements a dedicated login screen that appears before the main content is loaded.
    -   Redirects users to the Spotify login page to grant access to their account.
    -   Retrieves the access token after successful login and stores it in the browser's local storage.

-   **API Interaction (`api.js`):**
    -   Communicates with the Spotify Web API to fetch data and control playback.
    -   Provides functions to:
        -   Get the currently playing song (`getCurrentlyPlaying`).
        -   Play a song (`playSong`).
        -   Pause a song (`pauseSong`).
        -   Skip to the next song (`nextSong`).
        -   Go to the previous song (`prevSong`).

-   **User Interface (`app.js`):**
    -   Manages the UI elements and updates them based on the song data.
    -   Sets the album art as the full-screen background and applies the blur effect.
    -   Displays and hides the playback control buttons based on the playing state.
    -   Implements intelligent polling to update the UI at different intervals depending on whether music is playing or paused.
    -   Handles API errors (e.g., expired tokens) and prompts re-authentication.
    -   Provides a toggle to switch between album art and CD display.
    -   Displays placeholder content when no music is playing.

-   **Styling (`style.css`):**
    -   Defines the visual appearance of the application, including layout, colors, typography, and animations.
    -   Creates the full-screen album art display with the blurred background effect.
    -   Styles the control buttons and adds hover effects.
    -   Styles the CD display with a rotation animation.
    -   Creates a dedicated login screen with a pulsating, glowing Spotify login button.
    -   Ensures responsiveness across different screen sizes.

## Prerequisites

-   **Spotify Developer Account:** You'll need a Spotify Developer account.
-   **Spotify Application:** Create a new application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
-   **Client ID:** Obtain your application's Client ID from the Spotify Developer Dashboard.
-   **Web Server (for local testing):** A simple web server like Live Server for VS Code is recommended for local development.
-   **Netlify Account (optional):** For deploying the application online.

## Setup

1. **Spotify Developer Dashboard:**
    -   Create a new application.
    -   Get your Client ID.
    -   Add `http://localhost:5500` (or your local development URL) and your Netlify URL (e.g., `https://fullscreenify.netlify.app`) as Redirect URIs.
2. **Clone the Repository:**

    ```bash
    git clone <repository-url>
    cd Fullscreenify
    ```
3. **Update `auth.js`:**
    -   Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID.
    -   Replace the placeholder `redirectUri` with your local development Redirect URI and your Netlify URL.
4. **Local Development:**
    -   Use a live server (e.g., Live Server in VS Code) to open `index.html`.
    -   Click "Login with Spotify" to authenticate.

## Deployment (Netlify)

1. Push your code to a GitHub repository.
2. Create a new site on Netlify and connect it to your GitHub repository.
3. In your Netlify site settings:
    -   Set the production branch (usually `main` or `master`).
4. Update the Redirect URI in your Spotify Developer Dashboard to include your Netlify site's URL.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (You can add a LICENSE file if you want to specify licensing terms)