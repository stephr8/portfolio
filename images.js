
window.addEventListener('DOMContentLoaded', () => {
  let topZ = 1000;
  document.querySelectorAll('img.drawn-img, img.movable-img').forEach((img, index) => {
    // Add staggered animation delay
    img.style.animationDelay = `${index * 0.05}s`;
    
    // Pixel-perfect hover logic
    img.addEventListener('mousemove', (e) => {
      const rect = img.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x >= w || y >= h) {
        img.style.cursor = 'default';
        return;
      }
      let canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      let ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] < 10) {
        img.style.pointerEvents = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el !== img) {
          const newEvt = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: e.clientX,
            clientY: e.clientY
          });
          el.dispatchEvent(newEvt);
        }
        setTimeout(() => { img.style.pointerEvents = 'auto'; }, 0);
        img.style.cursor = 'default';
      } else {
        img.style.cursor = 'grab';
      }
    });
    img.addEventListener('mouseleave', () => {
      img.style.cursor = 'default';
    });

    // Pixel-perfect drag logic
    let offsetX, offsetY, isDragging = false;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    img.addEventListener('mousedown', (e) => {
      const rect = img.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] < 10) {
        img.style.pointerEvents = 'none';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el !== img) {
          const newEvt = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: e.clientX,
            clientY: e.clientY,
            button: e.button
          });
          el.dispatchEvent(newEvt);
        }
        setTimeout(() => { img.style.pointerEvents = 'auto'; }, 0);
        return;
      }
      isDragging = true;
      const parent = img.offsetParent || img.parentElement;
      const parentRect = parent.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      img.style.cursor = 'grabbing';
      topZ++;
      img.style.zIndex = topZ;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const parent = img.offsetParent || img.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const newLeft = ((e.clientX - offsetX - parentRect.left) / parentRect.width) * 100;
      const newTop = ((e.clientY - offsetY - parentRect.top) / parentRect.height) * 100;
      img.style.left = newLeft + '%';
      img.style.top = newTop + '%';
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        img.style.cursor = 'grab';
      }
    });
  });

  // Folder tab management
  const tabs = document.querySelectorAll('.folder-index');
  const folderPaper = document.querySelector('.folder-paper');
  if (tabs.length > 0 && folderPaper) {
    tabs[0].classList.add('active');
    folderPaper.classList.add('color-blue_light');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Change folder paper color
        const color = tab.getAttribute('data-color');
        folderPaper.classList.remove('color-blue_light', 'color-pink', 'color-green', 'color-yellow');
        folderPaper.classList.add(`color-${color}`);
      });
    });
  }

  // New simplified folder tabs
  const newTabs = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const folderContent = document.querySelector('.folder-content');
  const projectCards = document.querySelectorAll('.project-card');
  
  newTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      newTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update folder content border color
      if (folderContent) {
        folderContent.setAttribute('data-active-tab', tabName);
      }
      
      // Filter projects based on tab - set data attribute but don't hide yet
      if (tabName === 'projects') {
        // Show all projects
        projectCards.forEach(card => {
          card.setAttribute('data-visible', 'true');
        });
      } else {
        // Map tab names to filter types
        const filterMap = {
          'skills': 'design',
          'about': 'code',
          'contact': 'weiteres'
        };
        const filterType = filterMap[tabName];
        
        // Mark projects as visible/hidden based on their tags
        projectCards.forEach(card => {
          const tags = card.getAttribute('data-tags');
          if (tags && tags.includes(filterType)) {
            card.setAttribute('data-visible', 'true');
          } else {
            card.setAttribute('data-visible', 'false');
          }
        });
      }
      
      // Reset pagination and trigger page display
      if (window.resetProjectPagination) {
        window.resetProjectPagination();
      }
    });
  });

  // GIF hover animation for project cards
  const projectCardsWithGif = document.querySelectorAll('.project-card');
  
  projectCardsWithGif.forEach(card => {
    const gifImage = card.querySelector('.gif-image');
    
    if (gifImage) {
      const staticSrc = gifImage.dataset.static;
      const animatedSrc = gifImage.dataset.animated;
      
      card.addEventListener('mouseenter', () => {
        gifImage.src = animatedSrc;
      });
      
      card.addEventListener('mouseleave', () => {
        gifImage.src = staticSrc;
      });
    }
  });
});
