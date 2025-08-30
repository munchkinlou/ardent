document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blocky span').forEach(span => {
        if (span.textContent.toLowerCase().includes('personality') || 
            span.textContent.toLowerCase().includes('appearance') || 
            span.textContent.toLowerCase().includes('misc')) {
            span.style.display = 'none';
        }
    });

  document.querySelectorAll('.blocky').forEach(blocky => {
      if (blocky.textContent.toLowerCase().includes('hideme')) {
          blocky.style.border = 'none';
          blocky.style.background = 'transparent';
          blocky.style.boxShadow = 'none';
          blocky.style.backdropFilter = 'none';
          blocky.style.padding = '0';
          blocky.classList.add('nobefore');
          blocky.style.margin = '20px 10px';
      }
  });
});
