document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blocky span').forEach(span => {
        if (span.textContent.toLowerCase().includes('personality') || 
            span.textContent.toLowerCase().includes('appearance') || 
            span.textContent.toLowerCase().includes('misc')) {
            span.style.display = 'none';
        }
    });
});
