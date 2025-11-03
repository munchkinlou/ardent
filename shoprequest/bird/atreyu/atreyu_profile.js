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
  canvas.className = 'feather-canvas';
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
  
  const feathers = [];
  
  function createFeather() {
    const lifespan = Math.random() * 300 + 250;
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 0.3,
      dy: Math.random() * 0.4 + 0.2,
      life: lifespan,
      maxLife: lifespan,
      age: 0,
      alpha: 0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.02
    };
  }
  
  const featherImg = new Image();
  featherImg.src = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/5a31c05d-39f6-4910-9239-5d7b3ca952c0/dbgzqmq-0dcd9cf2-e169-484f-89a1-4dc25a828c27.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi81YTMxYzA1ZC0zOWY2LTQ5MTAtOTIzOS01ZDdiM2NhOTUyYzAvZGJnenFtcS0wZGNkOWNmMi1lMTY5LTQ4NGYtODlhMS00ZGMyNWE4MjhjMjcucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.giyhww8QWrRZfrYGY_KtSiY0D0ouLJfo85Nh5jjPL9Q';
  featherImg.onload = () => draw();
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = feathers.length - 1; i >= 0; i--) {
      const f = feathers[i];
      f.age++;
      
      const t = f.age / f.maxLife;
      f.alpha = Math.sin(Math.PI * t);

      f.swayOffset += f.swaySpeed;
      const sway = Math.sin(f.swayOffset) * 1.5;
      
      if (f.alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.translate(f.x + sway, f.y);
        ctx.rotate(f.rotation);
        ctx.drawImage(featherImg, -f.radius * 5, -f.radius * 5, f.radius * 10, f.radius * 10);
        ctx.restore();
      }
      
      f.x += f.dx;
      f.y += f.dy;
      f.rotation += f.rotationSpeed;
      
      if (f.age >= f.maxLife) feathers.splice(i, 1);
    }
    
    if (feathers.length < 50) feathers.push(createFeather());
    requestAnimationFrame(draw);
  }
};
