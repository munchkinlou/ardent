window.addEventListener('load', function () {
  if (![...document.styleSheets].some(s => (s.href || '').includes('profile.css'))) return;
  document.querySelectorAll('gal').forEach(function (g) {
    var imgs = [].slice.call(g.querySelectorAll('img'));
    if (!imgs.length) return;
    var i = 0;
    var prev = document.createElement('button');
    var next = document.createElement('button');
    var num = document.createElement('num');
    prev.setAttribute('prev', ''); prev.textContent = '\u2039';
    next.setAttribute('next', ''); next.textContent = '\u203A';
    g.appendChild(prev); g.appendChild(next); g.appendChild(num);
    function load(k) {
      var m = imgs[k];
      if (m && !m.getAttribute('src') && m.dataset.src) m.src = m.dataset.src;
    }
    function show(k) {
      i = (k + imgs.length) % imgs.length;
      imgs.forEach(function (m, j) { m.toggleAttribute('cur', j === i); });
      load(i); load(i + 1 === imgs.length ? 0 : i + 1); load(i === 0 ? imgs.length - 1 : i - 1);
      num.textContent = (i + 1) + ' / ' + imgs.length;
    }
    prev.onclick = function () { show(i - 1); };
    next.onclick = function () { show(i + 1); };
    show(0);
  });
});
