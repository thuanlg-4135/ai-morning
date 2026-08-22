(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const typeButton = document.querySelector('[data-type-toggle]');
  const readingButton = document.querySelector('[data-reading-toggle]');
  const progress = document.querySelector('[data-reading-progress]');
  const choices = ['auto', 'light', 'dark'];

  const storedTheme = (() => {
    try {
      const value = localStorage.getItem('ai-morning-theme');
      return choices.includes(value) ? value : 'auto';
    } catch {
      return 'auto';
    }
  })();

  let theme = storedTheme;

  const applyTheme = (value) => {
    theme = value;
    if (value === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.dataset.theme = value;
    }

    if (themeButton) {
      const label = themeButton.querySelector('[data-theme-label]');
      if (label) label.textContent = value.toUpperCase();
      themeButton.setAttribute('aria-label', `Theme: ${value}. Chọn theme tiếp theo`);
      themeButton.title = `Theme: ${value.toUpperCase()}`;
    }
  };

  applyTheme(theme);

  themeButton?.addEventListener('click', () => {
    const next = choices[(choices.indexOf(theme) + 1) % choices.length];
    applyTheme(next);
    try {
      localStorage.setItem('ai-morning-theme', next);
    } catch {
      // The selected theme still works for this page view.
    }
  });

  const storedType = (() => {
    try {
      return localStorage.getItem('ai-morning-large-type') === 'true';
    } catch {
      return false;
    }
  })();

  document.body.classList.toggle('large-type', storedType);
  typeButton?.setAttribute('aria-pressed', String(storedType));

  typeButton?.addEventListener('click', () => {
    const isLarge = document.body.classList.toggle('large-type');
    typeButton.setAttribute('aria-pressed', String(isLarge));
    try {
      localStorage.setItem('ai-morning-large-type', String(isLarge));
    } catch {
      // The type-size preference still works for this page view.
    }
  });

  const setReadingMode = (enabled) => {
    if (enabled) {
      root.dataset.reading = 'true';
    } else {
      root.removeAttribute('data-reading');
    }
    readingButton?.setAttribute('aria-pressed', String(enabled));
    if (readingButton) readingButton.textContent = enabled ? 'Thoát đọc' : 'Đọc';
  };

  const storedReadingMode = (() => {
    try {
      return localStorage.getItem('ai-morning-reading') === 'true';
    } catch {
      return false;
    }
  })();

  setReadingMode(storedReadingMode);

  readingButton?.addEventListener('click', () => {
    const enabled = root.dataset.reading !== 'true';
    setReadingMode(enabled);
    try {
      localStorage.setItem('ai-morning-reading', String(enabled));
    } catch {
      // Reading mode still works for this page view.
    }
  });

  const updateProgress = () => {
    if (!progress) return;
    const scrollable = root.scrollHeight - root.clientHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, (scrollY / scrollable) * 100)) : 0;
    progress.style.width = `${percent}%`;
  };

  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });

  const bookmarkKey = 'ai-morning-bookmarks';
  const readBookmarks = () => {
    try {
      const value = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  };
  const bookmarks = readBookmarks();
  const bookmarkId = (id) => `${location.pathname}#${id}`;

  document.querySelectorAll('[data-bookmark]').forEach((button) => {
    const id = button.dataset.bookmark;
    const key = bookmarkId(id);
    const section = document.getElementById(id);
    const applyBookmark = (saved) => {
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? 'Đã lưu' : 'Lưu';
      section?.classList.toggle('is-bookmarked', saved);
    };

    applyBookmark(bookmarks.has(key));
    button.addEventListener('click', () => {
      const saved = !bookmarks.has(key);
      if (saved) bookmarks.add(key);
      else bookmarks.delete(key);
      applyBookmark(saved);
      try {
        localStorage.setItem(bookmarkKey, JSON.stringify([...bookmarks]));
      } catch {
        // Bookmark state still works for this page view.
      }
    });
  });

  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      const original = button.textContent;
      const url = new URL(button.dataset.copyLink, location.href).href;
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = 'Đã chép';
      } catch {
        const selection = document.createElement('textarea');
        selection.value = url;
        selection.setAttribute('readonly', '');
        selection.style.position = 'fixed';
        selection.style.opacity = '0';
        document.body.append(selection);
        selection.select();
        document.execCommand('copy');
        selection.remove();
        button.textContent = 'Đã chép';
      }
      setTimeout(() => { button.textContent = original; }, 1600);
    });
  });

  const observedSections = [...document.querySelectorAll('main section[id]')];
  const sectionLinks = [...document.querySelectorAll('a[href^="#"]')];
  if ('IntersectionObserver' in window && observedSections.length && sectionLinks.length) {
    const activeSections = new Map();
    const updateActiveLink = () => {
      const visible = [...activeSections.entries()]
        .filter(([, entry]) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a[1].boundingClientRect.top) - Math.abs(b[1].boundingClientRect.top));
      const id = visible[0]?.[0];
      sectionLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#${id}`));
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => activeSections.set(entry.target.id, entry));
      updateActiveLink();
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.01] });
    observedSections.forEach((section) => observer.observe(section));
  }

  document.querySelectorAll('.editions').forEach((menu) => {
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.removeAttribute('open');
        menu.querySelector('summary')?.focus();
      }
    });
  });

  addEventListener('click', (event) => {
    document.querySelectorAll('.editions[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
})();
