document.addEventListener('DOMContentLoaded', function() {
document.querySelectorAll('.blocky span').forEach(span => {
  const text = span.textContent.toLowerCase();
  if (text.includes('personality') || text.includes('appearance')) {
    span.style.display = 'none';
    const flexParent = span.closest('.flex');
    if (flexParent) {
      flexParent.classList.add('flex_v');
    }
    const blockyParent = span.closest('.blocky');
    if (blockyParent && text.includes('appearance')) {
      blockyParent.style.overflow = 'visible';
    }
  } else if (text.includes('misc')) {
    span.style.display = 'none';
    const blockyParent = span.closest('.blocky');
    if (blockyParent) {
      blockyParent.style.display = 'flex';
      blockyParent.style.flexDirection = 'column';
      blockyParent.style.borderRadius = '0 0 0 100px';
    }
  }
});

const imgElement = document.getElementById('fadeImage');
const imageListItems = document.querySelectorAll('#imageList li');
const images = Array.from(imageListItems).map(li => li.textContent.trim());

if (images.length > 0) {
  let currentIndex = Math.floor(Math.random() * images.length);
  imgElement.src = images[currentIndex];
  imgElement.style.cursor = 'pointer';
  
  imgElement.addEventListener('click', function() {
    currentIndex = (currentIndex + 1) % images.length;
    this.src = images[currentIndex];
  });
}

document.querySelectorAll('.info_img').forEach(img => {
  const originalSrc = img.src;
  const alternateSrc = img.getAttribute('data-alt-src');
  
  if (alternateSrc) {
    img.style.cursor = 'pointer';
    img.addEventListener('click', function() {
      this.src = (this.src === originalSrc) ? alternateSrc : originalSrc;
    });
  }
});

  function createSnowfall(container) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.3;
    `;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    const snowflakes = Array.from({ length: 300 }, () => ({
      x: Math.random() * (canvas.width + 300),
      y: Math.random() * canvas.height - canvas.height,
      radius: Math.random() * 5 + 1,
      speed: Math.random() * 4 + 2,
      drift: -(Math.random() * 3 + 1.5)
    }));
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      snowflakes.forEach(flake => {
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
        flake.y += flake.speed;
        flake.x += flake.drift;
        if (flake.y > canvas.height || flake.x < -20) {
          flake.y = Math.random() * -150;
          flake.x = Math.random() * (canvas.width + 300);
        }
      });
      requestAnimationFrame(animate);
    }
    container.prepend(canvas);
    animate();
  }

  const blockyElements = document.querySelectorAll('.blocky');
  blockyElements.forEach(blocky => {
    const spans = blocky.querySelectorAll('span');
    const hasTargetSpan = Array.from(spans).some(span => {
      const text = span.textContent.toLowerCase();
      return text.includes('personality') || text.includes('appearance') || text.includes('misc');
    });
    if (hasTargetSpan) {
      createSnowfall(blocky);
    }
  });
});
