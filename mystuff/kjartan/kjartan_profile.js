document.querySelectorAll('.artcompendium_img_wrap, #lightbox_overlay').forEach(function(el) {
    el.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
  });
  
  document.querySelectorAll('.artcompendium_img_wrap img, #lightbox_img').forEach(function(img) {
    img.addEventListener('dragstart', function(e) {
      e.preventDefault();
    });
  });
  
  document.querySelectorAll('.artcompendium_img_wrap img').forEach(function(img) {
    img.addEventListener('click', function() {
      var overlay = document.getElementById('lightbox_overlay');
      var lightboxImg = document.getElementById('lightbox_img');
      var credit = this.parentElement.querySelector('.artcompendium_credit');
      var lightboxCredit = document.getElementById('lightbox_credit');
      lightboxImg.src = this.src;
      lightboxCredit.innerHTML = credit ? credit.innerHTML : '';
      overlay.style.display = 'flex';
    });
  });
  
  document.getElementById('lightbox_close').onclick = function() {
    document.getElementById('lightbox_overlay').style.display = 'none';
  };
  document.getElementById('lightbox_overlay').onclick = function(e) {
    if (e.target === this) {
      this.style.display = 'none';
    }
  };
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var overlay = document.getElementById('lightbox_overlay');
      if (overlay && overlay.style.display === 'flex') {
        overlay.style.display = 'none';
      }
    }
  });
