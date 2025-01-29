// wakeLock.js

import { resetCursorIdleTimer, attachCursorActivityListeners, removeCursorActivityListeners } from './cursor.js';

let wakeLock = null;

// Function to request the wake lock
export async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active!');

        // Handle cursor hiding when Wake Lock is active
        attachCursorActivityListeners();
        resetCursorIdleTimer();

        document.addEventListener('visibilitychange', handleVisibilityChange);

    } catch (err) {
        console.error(`Wake Lock Error: ${err.name}, ${err.message}`);

        // Attach cursor activity listeners if Wake Lock request fails
        attachCursorActivityListeners();
        resetCursorIdleTimer();
    }
}

// Function to release the wake lock
export function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release()
        .then(() => {
            wakeLock = null;
            console.log('Wake Lock released!');

            // Make sure cursor is visible when wake lock is released
            document.body.style.cursor = 'default'; 
            // Remove listeners when the Wake Lock is released
            removeCursorActivityListeners();
        });
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

// Function to handle visibility change
async function handleVisibilityChange() {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        console.log('Visibility changed to visible, re-requesting wake lock.');
        await requestWakeLock();
    }
}