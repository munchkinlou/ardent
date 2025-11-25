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
}
