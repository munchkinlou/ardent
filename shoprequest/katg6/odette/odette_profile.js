document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blocky span').forEach(span => {
        const text = span.textContent.toLowerCase();
        if (text.includes('personality') || text.includes('appearance') || text.includes('misc')) {
            span.style.display = 'none';
            const blockyParent = span.closest('.blocky');
            if (blockyParent) {
                blockyParent.style.borderRadius = '10px';
                blockyParent.style.setProperty('margin', '10px 3px', 'important');
            }
        }
    });
});
