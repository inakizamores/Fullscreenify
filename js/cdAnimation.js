// cdAnimation.js

export let rotationAngle = 0;
export const cdImage = document.getElementById('cd-image');
export let lastTimestamp = 0;
export let animationId;

export function animateCD(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const rotationPeriod = 10000; // 10 seconds
    const rotationSpeed = 360 / rotationPeriod;

    rotationAngle += rotationSpeed * deltaTime;
    rotationAngle %= 360;

    cdImage.style.transform = `rotate(${rotationAngle}deg)`;

    animationId = requestAnimationFrame(animateCD);
}

export function startCDAnimation() {
    lastTimestamp = performance.now();
    if (!animationId) {
        animationId = requestAnimationFrame(animateCD);
    }
}

export function stopCDAnimation() {
    cancelAnimationFrame(animationId);
    animationId = null;
}