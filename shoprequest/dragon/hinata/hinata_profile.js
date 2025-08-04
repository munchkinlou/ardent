document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.blocky span').forEach(span => {
        if (span.textContent.toLowerCase().includes('personality') || 
            span.textContent.toLowerCase().includes('appearance') || 
            span.textContent.toLowerCase().includes('misc')) {
            span.style.display = 'none';
        }
    });
    document.querySelectorAll('.blocky').forEach(blocky => {
        if (blocky.textContent.includes('hideme')) {
            blocky.style.border = 'none';
            blocky.style.background = 'transparent';
            blocky.style.boxShadow = 'none';
            blocky.style.backdropFilter = 'none';
            blocky.style.padding = '0';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const infoApp = document.querySelector('.infoapp');
    const infoper = document.querySelector('.infoper');
    
    if (infoApp) {
        const infoAppImg = infoApp.querySelector('.infoapp_img');
        
        infoApp.addEventListener('click', function(e) {
            infoAppImg.classList.toggle('flipped');
        });
    }
    
    if (infoper) {
        const infoperImg = infoper.querySelector('.infoper_img');
        
        infoper.addEventListener('click', function(e) {
            infoperImg.classList.toggle('flipped');
        });
    }
});

window.onload = () => {
  const container = document.getElementById('content');
  const canvas = document.createElement('canvas');
  canvas.className = 'flower-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '50%';
  canvas.style.transform = 'translateX(-50%)';
  canvas.style.zIndex = '10';
  canvas.style.pointerEvents = 'none';
  container.insertBefore(canvas, container.firstChild);
  const ctx = canvas.getContext('2d');
  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const sparks = [];

  function createSpark() {
    const lifespan = Math.random() * 200 + 200;
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: Math.random() * 0.3 + 0.1,
      life: lifespan,
      maxLife: lifespan,
      age: 0,
      alpha: 0
    };
  }

  const flowerImg = new Image();
  flowerImg.src = 'https://ik.imagekit.io/arl60/Ardent/shop/Dragon/Hinata/cherryblossom.png?updatedAt=1754296351111';

  flowerImg.onload = () => draw();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.age++;
      const t = s.age / s.maxLife;
      s.alpha = Math.sin(Math.PI * t);

      if (s.alpha > 0.01) {
        ctx.globalAlpha = s.alpha;
        ctx.drawImage(flowerImg, s.x, s.y, s.radius * 10, s.radius * 10);
        ctx.globalAlpha = 1;
      }

      s.x += s.dx;
      s.y += s.dy;

      if (s.age >= s.maxLife) sparks.splice(i, 1);
    }

    if (sparks.length < 50) sparks.push(createSpark());

    requestAnimationFrame(draw);
  }
};
