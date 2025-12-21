
window.addEventListener('DOMContentLoaded', () => {
  let topZ = 1000;
  document.querySelectorAll('img.drawn-img, img.movable-img').forEach((img) => {
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
      offsetX = e.clientX - img.offsetLeft;
      offsetY = e.clientY - img.offsetTop;
      img.style.cursor = 'grabbing';
      topZ++;
      img.style.zIndex = topZ;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      img.style.left = (e.clientX - offsetX) + 'px';
      img.style.top = (e.clientY - offsetY) + 'px';
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
  
  newTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      newTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        if (content.getAttribute('data-content') === tabName) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Update folder content border color
      if (folderContent) {
        folderContent.setAttribute('data-active-tab', tabName);
      }
    });
  });
});
