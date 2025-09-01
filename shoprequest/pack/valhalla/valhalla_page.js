const toggles = document.querySelectorAll('.collapse_toggle');
toggles.forEach(toggle => {
  toggle.addEventListener('change', () => {
    const label = toggle.nextElementSibling;
    const arrow = label.nextElementSibling;
    if (toggle.checked) {
      arrow.style.transform = 'rotate(90deg)';
    } else {
      arrow.style.transform = 'rotate(0deg)';
    }
  });
});
