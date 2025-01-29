let cursorIdleTimer;
const cursorIdleDelay = 5000; // 5 seconds (adjust as needed)

export function hideCursor() {
    document.body.style.cursor = 'none';
}

export function resetCursorIdleTimer() {
    clearTimeout(cursorIdleTimer);
    document.body.style.cursor = 'default'; // Show the cursor
    cursorIdleTimer = setTimeout(hideCursor, cursorIdleDelay);
}

export function handleUserActivity() {
    // Reset the timer whenever there's user activity (mousemove, keypress, touchstart, etc.)
    resetCursorIdleTimer();
}

// Attach event listeners for user activity
export function attachCursorActivityListeners() {
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity); // For touch devices
}

// Remove event listeners
export function removeCursorActivityListeners() {
    document.removeEventListener('mousemove', handleUserActivity);
    document.removeEventListener('keypress', handleUserActivity);
    document.removeEventListener('touchstart', handleUserActivity);
}