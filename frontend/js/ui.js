// UI helpers: toast notifications and badge animation
function showToast(message, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // force reflow for animation
    // eslint-disable-next-line no-unused-expressions
    toast.offsetHeight;
    toast.classList.add('toast-show');

    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        toast.addEventListener('transitionend', () => toast.remove());
    }, duration);
}

function bumpBadge() {
    const badge = document.getElementById('carrito-badge');
    if (!badge) return;
    badge.classList.add('badge-pop');
    badge.addEventListener('animationend', () => badge.classList.remove('badge-pop'), { once: true });
}

// Expose for modules or inline scripts
window.showToast = showToast;
window.bumpBadge = bumpBadge;
