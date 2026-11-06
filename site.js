// ============================================
// project detail pages: hamburger menu
// ============================================
const detailMenuBtn = document.querySelector('.detail-menu-btn');
const detailSitenav = document.querySelector('.detail-sitenav');

if (detailMenuBtn && detailSitenav) {
  const closeDetailMenu = () => {
    detailSitenav.classList.remove('open');
    detailMenuBtn.setAttribute('aria-expanded', 'false');
  };

  detailMenuBtn.addEventListener('click', () => {
    const open = detailSitenav.classList.toggle('open');
    detailMenuBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!detailSitenav.contains(e.target) && !detailMenuBtn.contains(e.target)) closeDetailMenu();
  });

  detailSitenav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDetailMenu));
}

// ============================================
// index.html: project previews follow the pointer (desktop)
// ============================================
document.querySelectorAll('.project-card').forEach(card => {
  const preview = card.querySelector('.project-thumb');
  if (!preview) return;

  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    preview.style.setProperty('--preview-x', `${event.clientX}px`);
    preview.style.setProperty('--preview-y', `${event.clientY}px`);
  });
});
