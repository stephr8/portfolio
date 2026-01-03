// Smooth scroll to center sections
document.querySelectorAll('nav a[href^="#"], #scroll-to-top a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        
        if (targetId === 'top') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            return;
        }
        
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - (window.innerHeight / 2) + (targetElement.offsetHeight / 2);
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Show/hide scroll-to-top button
const scrollToTopBtn = document.getElementById('scroll-to-top');
window.addEventListener('scroll', () => {
    const isMobile = window.innerWidth <= 768;
    const projectsSection = document.getElementById('projects');
    const footer = document.querySelector('footer');
    
    if (!projectsSection || !footer) return;
    
    const projectsTop = projectsSection.offsetTop;
    const footerTop = footer.offsetTop;
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const currentScroll = window.pageYOffset;
    
    if (isMobile) {
        // On mobile/tablet: show after scrolling 400px, hide near footer
        const shouldShow = currentScroll > 400;
        const nearFooter = scrollPosition > footerTop - 150;
        
        if (shouldShow && !nearFooter) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.pointerEvents = 'auto';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.pointerEvents = 'none';
        }
    } else {
        // On desktop: show when reaching projects section, always visible (no hide at footer)
        if (currentScroll >= projectsTop - 200) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.pointerEvents = 'auto';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.pointerEvents = 'none';
        }
    }
});


// Project navigation
let currentProjectPage = 0;
const projectGrid = document.querySelector('.projects-grid');
const allProjects = Array.from(projectGrid.children);

function getProjectsPerPage() {
    // Show 3 projects on mobile/tablet, 4 on desktop
    return window.innerWidth <= 768 ? 3 : 4;
}

function getVisibleProjects() {
    // Get only projects that should be visible based on current filter
    return allProjects.filter(project => {
        const isVisible = project.getAttribute('data-visible');
        return isVisible === null || isVisible === 'true';
    });
}

function showProjectPage(pageIndex) {
    const projectsPerPage = getProjectsPerPage();
    const visibleProjects = getVisibleProjects();
    const totalPages = Math.ceil(visibleProjects.length / projectsPerPage);
    const startIndex = pageIndex * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    
    // First, hide all projects
    allProjects.forEach(project => {
        project.style.display = 'none';
    });
    
    // Then show only the visible projects for the current page
    visibleProjects.forEach((project, index) => {
        if (index >= startIndex && index < endIndex) {
            project.style.display = 'grid';
        }
    });
    
    // Update button visibility
    document.getElementById('prev-projects').style.visibility = pageIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('next-projects').style.visibility = pageIndex === totalPages - 1 || totalPages === 0 ? 'hidden' : 'visible';
}

// Expose reset function for tab filtering
window.resetProjectPagination = function() {
    currentProjectPage = 0;
    showProjectPage(currentProjectPage);
};

document.getElementById('prev-projects').addEventListener('click', (e) => {
    e.preventDefault();
    if (currentProjectPage > 0) {
        currentProjectPage--;
        showProjectPage(currentProjectPage);
    }
});

document.getElementById('next-projects').addEventListener('click', (e) => {
    e.preventDefault();
    const projectsPerPage = getProjectsPerPage();
    const visibleProjects = getVisibleProjects();
    const totalPages = Math.ceil(visibleProjects.length / projectsPerPage);
    if (currentProjectPage < totalPages - 1) {
        currentProjectPage++;
        showProjectPage(currentProjectPage);
    }
});

// Reset to first page on window resize
window.addEventListener('resize', () => {
    currentProjectPage = 0;
    showProjectPage(currentProjectPage);
});

// Initialize first page
showProjectPage(currentProjectPage);

// Project Detail View (inside folder)
const projectDetailContainer = document.getElementById('projectDetailContainer');
const backToProjectsBtn = document.getElementById('backToProjects');
const projectsWrapper = document.querySelector('.projects-wrapper');

function openProjectDetail(projectCard) {
    const title = projectCard.dataset.title;
    const type = projectCard.dataset.type;
    const description = projectCard.dataset.description;
    const details = projectCard.dataset.details;
    const link = projectCard.dataset.link;
    const images = projectCard.dataset.images.split(',');
    const tags = projectCard.dataset.tags;
    
    // Populate detail view
    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailDescription').textContent = description;
    
    // Format details with proper line breaks and bold titles
    const detailBody = document.getElementById('detailBody');
    let formattedDetails = details.replace(/\n/g, '<br>');
    formattedDetails = formattedDetails.replace(/Verantwortung & Beitrag:/g, '<strong>Verantwortung & Beitrag:</strong>');
    formattedDetails = formattedDetails.replace(/Fokus:/g, '<strong>Fokus:</strong>');
    detailBody.innerHTML = formattedDetails;
    
    document.getElementById('detailLink').href = link;
    
    // Add images
    const imagesContainer = document.getElementById('detailImages');
    imagesContainer.innerHTML = '';
    images.forEach(imgSrc => {
        const img = document.createElement('img');
        img.src = imgSrc.trim();
        img.alt = title;
        imagesContainer.appendChild(img);
    });
    
    // Add chips - format: "label|color,label2|color2"
    const chipsContainer = document.getElementById('detailChips');
    chipsContainer.innerHTML = '';
    const tagsList = tags.split(',');
    
    tagsList.forEach(tagData => {
        const [label, colorType] = tagData.split('|');
        const chip = document.createElement('span');
        chip.className = 'project-chip';
        chip.setAttribute('data-type', colorType.trim());
        chip.textContent = label.trim();
        chipsContainer.appendChild(chip);
    });
    
    // Hide projects grid and show detail view
    projectsWrapper.style.display = 'none';
    projectDetailContainer.style.display = 'block';
}

function closeProjectDetail() {
    projectsWrapper.style.display = 'block';
    projectDetailContainer.style.display = 'none';
}

// Add click listeners to all project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
        openProjectDetail(card);
    });
});

// Back button
backToProjectsBtn.addEventListener('click', closeProjectDetail);

// Scroll-triggered animations (only on tablet and mobile)
if (window.innerWidth <= 1024) {
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    // Observe envelope wrapper
    const envelopeWrapper = document.querySelector('.envelope-wrapper');
    if (envelopeWrapper) {
        observer.observe(envelopeWrapper);
    }

    // Observe all project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        observer.observe(card);
    });

    // Observe all postits
    const postits = document.querySelectorAll('.postit');
    postits.forEach(postit => {
        observer.observe(postit);
    });
}
