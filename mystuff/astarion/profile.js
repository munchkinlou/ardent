(function () {
  const targets = ['appearance','personality', 'misc'];
  const styles = {
    background: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0',
    boxShadow: 'none',
    padding: '0',
    margin: '0',
    textAlign: 'justify',
    fontSize: '12px',
    overflow: 'visible'
  };
  const run = () => {
    document.querySelectorAll('.blocky span').forEach(s => {
      const t = s.textContent.trim().toLowerCase().replace(/:$/, '');
      if (targets.includes(t)) {
        s.style.display = 'none';
        const b = s.closest('.blocky');
        if (b) Object.assign(b.style, styles);
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
