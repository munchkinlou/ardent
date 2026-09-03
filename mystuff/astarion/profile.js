(function () {
  const targets = ['full name', 'nicknames', 'age', 'birthdate', 'size',
                   'height', 'build', 'alignment', 'gender', 'sexuality', 'pack',
                   'rank', 'posts', 'gemstones', 'post log', 'player'];
  const styles = {
    padding: '30px 0 7px',
    margin: '0 2% 15px',
    textAlign: 'center',
    fontSize: '18px',
    fontFamily: '"Didact Gothic", sans-serif',
    textShadow: '0 1px 5px black, 0 0 2px black',
    display: 'flex',
    justifyContent: 'center'
  };
  const run = () => {
    document.querySelectorAll('.blocky span').forEach(s => {
      const t = s.textContent.trim().toLowerCase().replace(/:$/, '');
      if (targets.includes(t)) {
        const b = s.closest('.blocky');
        if (b) Object.assign(b.style, styles);
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
