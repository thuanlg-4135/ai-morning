(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const typeButton = document.querySelector('[data-type-toggle]');
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

  const updateProgress = () => {
    if (!progress) return;
    const scrollable = root.scrollHeight - root.clientHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, (root.scrollTop / scrollable) * 100)) : 0;
    progress.style.width = `${percent}%`;
  };

  updateProgress();
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });

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
