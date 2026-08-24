(() => {
  const root = document.documentElement;
  const languageButton = document.querySelector('[data-language-toggle]');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const typeButton = document.querySelector('[data-type-toggle]');
  const readingButton = document.querySelector('[data-reading-toggle]');
  const progress = document.querySelector('[data-reading-progress]');
  const choices = ['auto', 'light', 'dark'];
  const translations = {
    en: {
      'skip-navigation': 'Skip navigation',
      'home-label': 'AI Morning, latest edition',
      tagline: 'The morning AI briefing for software engineers',
      'main-navigation': 'Main navigation',
      'table-of-contents': 'Table of contents for this edition',
      'in-this-edition': 'In this edition',
      toc: 'Contents',
      'quick-toc': 'Quick table of contents',
      'past-editions': 'Past editions',
      'latest-edition': 'Latest edition',
      'reading-mode': 'Reading mode',
      'theme-next': 'Theme: auto. Choose the next theme',
      'font-size': 'Change font size',
      read: 'Read',
      'footer-disclaimer': 'AI Morning is a curated briefing. Verify consequential claims with their primary source before making production, legal, or financial decisions.',
      'other-editions': 'Other editions',
      archive: 'Archive',
      'archive-headline': 'One morning, one clear slice.',
      'archive-dek': 'Published briefings are preserved by date so you can return to the context of any given morning.',
      'all-editions': 'All editions',
      issue: 'Issue',
      edition: 'Edition',
      'archive-footer': 'Each dated edition is a snapshot generated from that day’s JSON. The homepage always shows the latest edition.',
      'read-latest': 'Read the latest edition',
      'theme-label': 'Theme'
    }
  };

  const textFor = (key, language) => language === 'en' ? (translations.en[key] ?? null) : null;
  const storedLanguage = (() => {
    return root.dataset.language === 'en' ? 'en' : 'vi';
  })();
  let language = storedLanguage;

  const applyLanguage = (value) => {
    language = value;
    root.lang = value;
    root.dataset.language = value;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const translated = textFor(element.dataset.i18n, value);
      if (!element.dataset.vi) element.dataset.vi = element.textContent;
      element.textContent = translated ?? element.dataset.vi;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      const translated = textFor(element.dataset.i18nAria, value);
      if (!element.dataset.viAria) element.dataset.viAria = element.getAttribute('aria-label') ?? '';
      element.setAttribute('aria-label', translated ?? element.dataset.viAria);
    });
    if (themeButton) {
      const currentTheme = root.dataset.theme ?? 'auto';
      themeButton.setAttribute('aria-label', value === 'en'
        ? `Theme: ${currentTheme}. Choose the next theme`
        : `Theme: ${currentTheme}. Chọn theme tiếp theo`);
    }
    if (readingButton && root.dataset.reading === 'true') {
      readingButton.textContent = value === 'en' ? 'Exit reading' : 'Thoát đọc';
    }
    if (languageButton) {
      languageButton.querySelector('[data-language-label]').textContent = value === 'en' ? 'VI' : 'EN';
      languageButton.setAttribute('aria-label', value === 'en' ? 'Chuyển ngôn ngữ sang tiếng Việt' : 'Switch language to English');
      languageButton.title = value === 'en' ? 'Tiếng Việt' : 'English';
    }
  };

  applyLanguage(language);
  languageButton?.addEventListener('click', () => {
    if (languageButton.dataset.languageHref) {
      try {
        localStorage.setItem('ai-morning-language', language === 'vi' ? 'en' : 'vi');
      } catch {
        // Navigation still works when storage is unavailable.
      }
      location.assign(languageButton.dataset.languageHref);
      return;
    }
    applyLanguage(language === 'vi' ? 'en' : 'vi');
    try {
      localStorage.setItem('ai-morning-language', language);
    } catch {
      // The selected language still works for this page view.
    }
  });

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
      themeButton.setAttribute('aria-label', language === 'en'
        ? `Theme: ${value}. Choose the next theme`
        : `Theme: ${value}. Chọn theme tiếp theo`);
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
      if (readingButton) readingButton.textContent = enabled
        ? (language === 'en' ? 'Exit reading' : 'Thoát đọc')
        : (language === 'en' ? 'Read' : 'Đọc');
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
      button.textContent = saved
        ? (language === 'en' ? 'Saved' : 'Đã lưu')
        : (language === 'en' ? 'Save' : 'Lưu');
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
        button.textContent = language === 'en' ? 'Copied' : 'Đã chép';
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
        button.textContent = language === 'en' ? 'Copied' : 'Đã chép';
      }
      setTimeout(() => { button.textContent = original; }, 1600);
    });
  });

  const observedSections = [...document.querySelectorAll('[data-scroll-section][id]')];
  const sectionLinks = [...document.querySelectorAll('a[href^="#"]')];
  if (observedSections.length && sectionLinks.length) {
    const updateActiveLink = () => {
      const marker = Math.max(96, Math.min(innerHeight * 0.24, 240));
      let current = observedSections[0];
      observedSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= marker) current = section;
      });
      const id = current?.id;
      sectionLinks.forEach((link) => {
        const active = link.hash === `#${id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    let activeLinkFrame = 0;
    const scheduleActiveLinkUpdate = () => {
      if (activeLinkFrame) return;
      activeLinkFrame = requestAnimationFrame(() => {
        activeLinkFrame = 0;
        updateActiveLink();
      });
    };

    updateActiveLink();
    addEventListener('scroll', scheduleActiveLinkUpdate, { passive: true });
    addEventListener('resize', scheduleActiveLinkUpdate, { passive: true });
    addEventListener('hashchange', scheduleActiveLinkUpdate);
  }

  document.querySelectorAll('.editions, .toc-menu').forEach((menu) => {
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.removeAttribute('open');
        menu.querySelector('summary')?.focus();
      }
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => menu.removeAttribute('open'));
    });
  });

  addEventListener('click', (event) => {
    document.querySelectorAll('.editions[open], .toc-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
})();
