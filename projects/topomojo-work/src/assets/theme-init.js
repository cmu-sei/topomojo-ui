// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

// Sets the dark theme class before Angular boots, so a dark reload doesn't flash white.
// Mirrors ThemeService (app/theme.service.ts), which takes over once the app starts.
(function () {
  var theme = new URLSearchParams(window.location.search).get('theme');
  if (theme !== 'dark-theme' && theme !== 'light-theme') {
    try {
      theme = localStorage.getItem('topomojo.theme');
    } catch (e) { }
  }
  if (theme !== 'dark-theme' && theme !== 'light-theme') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme';
  }
  document.documentElement.classList.toggle('dark-theme', theme === 'dark-theme');
})();
