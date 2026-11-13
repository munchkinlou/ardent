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



window.onload = () => {
  const container = document.getElementById('content');
  const canvas = document.createElement('canvas');
  canvas.className = 'firefly-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '50%';
  canvas.style.transform = 'translateX(-50%)';
  canvas.style.zIndex = '10';
  canvas.style.pointerEvents = 'none';
  container.insertBefore(canvas, container.firstChild);
  const ctx = canvas.getContext('2d');

  const MAX_FIREFLIES = 40;
  const COLOR = '255, 185, 80';
  const CORE_COLOR = '255, 235, 190';
  const SPEED = 0.35;
  const GLOW_SIZE = 7;

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const fireflies = [];

  function createFirefly() {
    const lifespan = Math.random() * 600 + 600;
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2 + 0.8,
      angle: Math.random() * Math.PI * 2,
      turn: (Math.random() - 0.5) * 0.02,
      speed: (Math.random() * 0.6 + 0.4) * SPEED,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      age: 0,
      maxLife: lifespan
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = fireflies.length - 1; i >= 0; i--) {
      const f = fireflies[i];
      f.age++;

      const lifeFade = Math.sin(Math.PI * (f.age / f.maxLife));
      f.pulse += f.pulseSpeed;
      const blink = Math.pow((Math.sin(f.pulse) + 1) / 2, 3);
      const alpha = lifeFade * (0.15 + 0.85 * blink);

      f.turn += (Math.random() - 0.5) * 0.004;
      f.turn = Math.max(-0.03, Math.min(0.03, f.turn));
      f.angle += f.turn;
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed;

      if (f.x < -20) f.x = canvas.width + 20;
      if (f.x > canvas.width + 20) f.x = -20;
      if (f.y < -20) f.y = canvas.height + 20;
      if (f.y > canvas.height + 20) f.y = -20;

      if (alpha > 0.01) {
        const glowR = f.radius * GLOW_SIZE;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
        g.addColorStop(0, `rgba(${COLOR}, ${alpha})`);
        g.addColorStop(0.25, `rgba(${COLOR}, ${alpha * 0.5})`);
        g.addColorStop(1, `rgba(${COLOR}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${CORE_COLOR}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (f.age >= f.maxLife) fireflies.splice(i, 1);
    }

    ctx.globalCompositeOperation = 'source-over';

    if (fireflies.length < MAX_FIREFLIES && Math.random() < 0.1) {
      fireflies.push(createFirefly());
    }

    requestAnimationFrame(draw);
  }

  draw();
};
