document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('.blocky span').forEach(span => {
        const text = span.textContent.toLowerCase();
        if (text.includes('personality') || text.includes('appearance') || text.includes('misc')) {
            span.style.display = 'none';
            const blockyParent = span.closest('.blocky');
            if (blockyParent) {
                blockyParent.style.border = 'none';
                blockyParent.style.padding = '0 5px';
                blockyParent.style.margin = '0';
                blockyParent.style.background = 'none';
                blockyParent.style.backgroundColor = 'transparent';
                blockyParent.style.borderRadius = '0';
                blockyParent.style.boxShadow = 'none';
                blockyParent.style.overflow = 'visible';
            }
            if (text.includes('appearance')) {
                if (blockyParent) {
                    blockyParent.style.overflow = 'visible';
                }
            }
        }
    });
});
