// ============================================
// index.html: folder tab filtering + pagination
// ============================================
// Which chip type each tab filters by. "projects" = show all.
const TAB_FILTER = { projects: null, skills: 'design', about: 'code', contact: 'weiteres' };

const grid = document.getElementById('projectsGrid');

if (grid) {
  const contentPanel = document.querySelector('.folder-content');
  const allCards = Array.from(grid.querySelectorAll('.project-card'));

  // give every card an explicit match state up front (matches current tab)
  allCards.forEach(card => { card.dataset.match = 'true'; });

  let currentPage = 0;
  const MAX_PER_PAGE = 4; // hard cap — never show more than 4 project cards on one page
  function projectsPerPage() { return Math.min(MAX_PER_PAGE, window.innerWidth <= 768 ? 3 : 4); }
  function matchingCards() { return allCards.filter(c => c.dataset.match !== 'false'); }

  function showPage(page) {
    const perPage = projectsPerPage();
    const matching = matchingCards();
    const start = page * perPage, end = start + perPage;
    allCards.forEach(c => {
      if (c.dataset.match === 'false') { c.style.display = 'none'; return; }
      const i = matching.indexOf(c);
      c.style.display = (i >= start && i < end) ? 'grid' : 'none';
    });
    const totalPages = Math.ceil(matching.length / perPage) || 1;
    document.getElementById('prev-projects').style.visibility = page === 0 ? 'hidden' : 'visible';
    document.getElementById('next-projects').style.visibility = page >= totalPages - 1 ? 'hidden' : 'visible';
  }

  document.getElementById('prev-projects').addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; showPage(currentPage); }
  });
  document.getElementById('next-projects').addEventListener('click', () => {
    const totalPages = Math.ceil(matchingCards().length / projectsPerPage()) || 1;
    if (currentPage < totalPages - 1) { currentPage++; showPage(currentPage); }
  });
  window.addEventListener('resize', () => { currentPage = 0; showPage(currentPage); });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      contentPanel.dataset.activeTab = tab;

      const filter = TAB_FILTER[tab];
      allCards.forEach(card => {
        const chips = (card.dataset.chips || '').split(',').map(s => s.trim()).filter(Boolean);
        const match = !filter || chips.includes(filter);
        card.dataset.match = match ? 'true' : 'false';
      });

      currentPage = 0;
      showPage(currentPage);
    });
  });

  showPage(0);
}

// ============================================
// project detail pages: detail-note scroll-spy
// ============================================
// Highlights the detail note nav entry matching whichever section is
// currently in view, so the "quick jump" list doubles as a reading-
// progress cue.
const overviewNoteLinks = document.querySelectorAll('.detail-postit-nav-list a, .overview-note-nav a');
const detailSections = document.querySelectorAll('.detail-section');

if (overviewNoteLinks.length && detailSections.length) {
  const scrollSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const key = entry.target.id.replace('section-', '');
      overviewNoteLinks.forEach(a => a.classList.toggle('active', a.dataset.key === key));
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  detailSections.forEach(s => scrollSpyObserver.observe(s));

  overviewNoteLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(a.getAttribute('href').slice(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

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