# Fullscreenify

<a href="https://fullscreenify.netlify.app/">
    <img src="favicon/favicon.svg" alt="Fullscreenify Logo" width="100">
</a>

Fullscreenify is a web application that displays the album cover of your currently playing Spotify song in full-screen mode. It provides interactive playback controls, a toggleable CD display, and dynamically updates the UI as the music changes. The app features a visually engaging design with a dedicated login screen, smooth animations, and subtle background effects.

## Features

-   **Fetches Currently Playing Song:** Retrieves the currently playing song information from the Spotify API.
-   **Full-Screen Album Art:** Displays the album artwork in full-screen mode for an immersive visual experience.
-   **CD Display Mode:** Allows users to toggle between the album art and a spinning CD display.
-   **Blurred Background:** Applies a blurred background effect based on the album art, creating a visually appealing backdrop.
-   **Interactive Playback Controls:** Provides buttons to play, pause, skip to the next track, and go to the previous track. The play/pause button dynamically changes icons to reflect the current playback state.
-   **Dynamic Updates:** Updates the displayed album art in real-time when the song changes. The update frequency is adjusted based on whether music is actively playing or paused.
-   **Responsive Design:** Adapts to different screen sizes (desktop and mobile) for optimal viewing.
-   **Hover Effects:** Control buttons, album art, and CD image have hover effects for visual feedback.
-   **Automatic Login Persistence:** Stores the Spotify access token in local storage to automatically log the user in on subsequent visits.
-   **Automatic Token Refresh:** Silently refreshes the Spotify access token in the background using a hidden iframe to ensure uninterrupted playback.
-   **Session Expiration Handling:** Gracefully handles token expiration by displaying a modal that prompts the user to re-authenticate.
-   **Dedicated Login Screen:** Presents a separate login screen with:
    -   **App Name and Description:** Clearly presents the app name "FULLSCREENIFY" and a brief description of its features.
    -   **Pulsating Spotify Button:** A visually engaging login button with the Spotify logo that pulsates subtly.
    -   **Subtle Animated Gradient:** A very faint, slowly moving green gradient overlay on a dark background for a modern aesthetic.
    -   **Padding and Centering:** Content is centered and has padding to avoid visual issues on different screen sizes.
-   **Placeholder Content:** Displays a message when no music is playing, prompting the user to start streaming.
-   **Cursor Hiding:** Automatically hides the mouse cursor after a period of inactivity (10 seconds) to enhance the full-screen experience. The cursor reappears when the user moves the mouse or presses a key.

## How it Works

The application consists of the following core components:

-   **Authentication (`auth.js`):**
    -   Handles user authentication with Spotify using the OAuth 2.0 flow.
    -   Implements a dedicated login screen that appears before the main content is loaded.
    -   Redirects users to the Spotify login page to grant access to their account.
    -   Retrieves the access token and its expiration time after successful login and stores them in the browser's local storage.
    -   Implements automatic token refresh using a hidden iframe:
        -   A hidden iframe is created and loads the Spotify authorization URL with `show_dialog=false` to attempt silent re-authentication.
        -   If the user is still logged into Spotify and the browser allows it, Spotify redirects back within the iframe without user interaction.
        -   The main app window listens for a message from the iframe containing the new access token.
        -   The access token and expiration time are updated in local storage.
        -   This process is scheduled to run shortly before the current token expires.
    -   Handles session expiration by detecting 401 errors from the Spotify API and displaying a re-authentication modal.
    -   Provides a logout function that clears the stored token and expiration time.

-   **API Interaction (`api.js`):**
    -   Communicates with the Spotify Web API to fetch data and control playback.
    -   Provides functions to:
        -   Get the currently playing song (`getCurrentlyPlaying`).
        -   Play a song (`playSong`).
        -   Pause a song (`pauseSong`).
        -   Skip to the next song (`nextSong`).
        -   Go to the previous song (`prevSong`).
    -   Handles API errors, specifically 401 errors to detect token expiration.

-   **User Interface (`app.js`):**
    -   Manages the UI elements and updates them based on the song data.
    -   Sets the album art as the full-screen background and applies the blur effect.
    -   Dynamically updates the play/pause button icon based on the current playback state.
    -   Implements intelligent polling to update the UI at different intervals depending on whether music is playing or paused.
    -   Handles the display and behavior of the session expiration modal.
    -   Provides a toggle to switch between album art and CD display.
    -   Displays placeholder content when no music is playing.
    -   Schedules the token refresh mechanism.
    -   Implements cursor hiding after a period of inactivity to improve the full-screen viewing experience.

-   **Styling (`style.css`):**
    -   Defines the visual appearance of the application, including layout, colors, typography, and animations.
    -   Creates the full-screen album art display with the blurred background effect.
    -   Styles the control buttons and adds hover effects.
    -   Styles the CD display with a rotation animation.
    -   Creates a dedicated login screen with:
        -   A centered layout with appropriate padding.
        -   A large, all-caps "FULLSCREENIFY" title.
        -   A brief app description.
        -   A pulsating Spotify login button with a subtle glow effect.
        -   A very subtle, animated background gradient.
    -   Styles the session expiration modal.
    -   Ensures responsiveness across different screen sizes.

## Prerequisites

-   **Spotify Developer Account:** You'll need a Spotify Developer account.
-   **Spotify Application:** Create a new application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
-   **Client ID:** Obtain your application's Client ID from the Spotify Developer Dashboard.
-   **Netlify Account:** For deploying the application online.

## Setup

1. **Spotify Developer Dashboard:**
    -   Create a new application.
    -   Get your Client ID.
    -   Add `https://fullscreenify.netlify.app/` as a Redirect URI.
2. **Clone the Repository:**

    ```bash
    git clone https://github.com/inakizamores/Fullscreenify
    cd Fullscreenify
    ```
3. **Update `auth.js`:**
    -   Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID.
    -   Replace the placeholder `redirectUri` with `https://fullscreenify.netlify.app/`.
4. **Deployment (Netlify):**
    -   Push your code to your GitHub repository.
    -   Create a new site on Netlify and connect it to your GitHub repository.
    -   In your Netlify site settings:
        -   Set the production branch (usually `main` or `master`).

## Limitations

-   The automatic token refresh mechanism relies on a hidden iframe and may be affected by browser restrictions or if the user is not logged into Spotify. In such cases, manual re-authentication through the session expiration modal will be required.

## License

This project does not have a license yet. It is currently pending. Future licensing may fall under the MIT License, but this is subject to change.