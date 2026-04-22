# 🌐 Octoroit Virtual OS
A production-grade, multi-user, accessible, and offline-capable web desktop environment built entirely with vanilla HTML/CSS/JS for static hosting.

## 🚀 Quick Deploy
1. Create a folder named `octoroit-os`
2. Paste all files into their matching paths
3. Push to GitHub → Settings → Pages → Deploy from `main` branch
4. Visit `https://<username>.github.io/octoroit-os/`

## 🔑 Default Login
- **Username:** `admin`
- **PIN:** `1234`
- Guest mode available. Create new users from login screen.

## ♿ Accessibility & i18n
- Full keyboard navigation (`Alt+Tab`, `Esc`, `Tab` trapping)
- Screen reader live regions & skip links
- Voice commands (`Ctrl+Shift+V`)
- 4 languages: EN, ES, FR, JA (extensible)
- High contrast & reduced motion support

## 🛠️ Architecture
- `js/core.js` - OS namespace, namespaced storage, advanced FS, theme, audio, perms
- `js/services/` - Auth, i18n, a11y, widgets, devtools
- `js/apps/` - 11 integrated applications
- `sw.js` - Offline cache & instant boot
- Zero dependencies. GitHub Pages optimized.

## 📜 License
MIT © 2024 Octoroit Project