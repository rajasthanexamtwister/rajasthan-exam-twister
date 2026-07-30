/* =============================================
   BCI Quiz — UI & Hotkeys Controller
   Handles keyboard navigation (1-5, N, P, B, S, Ctrl+K),
   theme toggling, modals, toast messages, & sidebar.
   ============================================= */

const UIController = {
  initKeyboardHotkeys(handlers = {}) {
    document.addEventListener('keydown', (e) => {
      // Ignore if user typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') {
          document.activeElement.blur();
        }
        return;
      }

      // Universal Search shortcut Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (handlers.onSearchTrigger) handlers.onSearchTrigger();
        return;
      }

      // Quiz Navigation Keys
      if (document.getElementById('screen-quiz')?.classList.contains('active')) {
        switch (e.key) {
          case '1': if (handlers.onSelectOption) handlers.onSelectOption(0); break;
          case '2': if (handlers.onSelectOption) handlers.onSelectOption(1); break;
          case '3': if (handlers.onSelectOption) handlers.onSelectOption(2); break;
          case '4': if (handlers.onSelectOption) handlers.onSelectOption(3); break;
          case '5': if (handlers.onSelectOption) handlers.onSelectOption(4); break;
          case 'n':
          case 'N':
          case 'ArrowRight': if (handlers.onNext) handlers.onNext(); break;
          case 'p':
          case 'P':
          case 'ArrowLeft': if (handlers.onPrev) handlers.onPrev(); break;
          case 'b':
          case 'B': if (handlers.onBookmark) handlers.onBookmark(); break;
          case 's':
          case 'S': if (handlers.onSkip) handlers.onSkip(); break;
        }
      }

      // Escape key to close modals
      if (e.key === 'Escape') {
        if (handlers.onCloseModals) handlers.onCloseModals();
      }
    });
  },

  showToast(msg, duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('bci_theme', isDark ? 'dark' : 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  },

  loadSavedTheme() {
    const saved = localStorage.getItem('bci_theme');
    if (saved === 'dark') {
      document.body.classList.add('dark-theme');
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = '☀️';
    }
  }
};

window.UIController = UIController;
