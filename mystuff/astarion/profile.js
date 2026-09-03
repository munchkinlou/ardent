(function () {
  const targets = ['full name', 'nicknames'];
  const run = () => {
    document.querySelectorAll('.blocky span').forEach(s => {
      const t = s.textContent.toLowerCase();
      if (targets.some(k => t.includes(k))) {
        const b = s.closest('.blocky');
        if (b) b.style.background = 'linear-gradient(to bottom, #1a1a1a, black)';
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
