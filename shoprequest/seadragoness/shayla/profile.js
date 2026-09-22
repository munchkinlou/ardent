window.addEventListener('load', () => {
  const styled = [...document.styleSheets].some(s => (s.href || '').includes('profile.css'));
  if (!styled) return;

  const v = document.createElement('video');
  v.id = 'vbg';
  v.src = 'https://ik.imagekit.io/arl59/Ardent/Shop%20Requests/Victrazte/Kiyomi/28067-367411324_small.mp4?updatedAt=1747965344409';
  v.loop = v.muted = v.playsInline = v.autoplay = true;
  document.querySelector('#content')?.prepend(v);
  v.play().catch(() => {});

  document.getElementById('v2')?.addEventListener('change', e =>
    e.target.checked ? v.play() : v.pause());
});
