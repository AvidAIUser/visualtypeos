// Global error catcher to prevent silent crashes
window.addEventListener('error', e => console.error('[Global Error]', e.message, e.filename, e.lineno));
window.addEventListener('unhandledrejection', e => console.error('[Unhandled Promise]', e.reason));

document.addEventListener('DOMContentLoaded', async () => {
  const boot = document.getElementById('boot-screen');
  const bar = boot?.querySelector('.boot-bar');
  let prog = 0;
  const iv = setInterval(() => {
    prog += Math.random() * 12 + 3;
    if (prog >= 90) prog = 90;
    if (bar) bar.style.width = prog + '%';
  }, 100);

  try {
    await OctoroitOS.storage.init();
    OctoroitOS.users.init();
    OctoroitOS.i18n.init();
    OctoroitOS.theme.init();
    OctoroitOS.permissions.init();
    OctoroitOS.audio.init();
    OctoroitOS.a11y.init();
    console.log('[Boot] Core services initialized');
  } catch (e) {
    console.error('[Boot] Service init failed:', e);
  }

  clearInterval(iv);
  if (bar) bar.style.width = '100%';

  setTimeout(() => {
    if (boot) boot.style.opacity = '0';
    setTimeout(() => {
      if (boot) boot.classList.add('hidden');
      try { OctoroitOS.audio.play('boot'); } catch {}
      
      if (!OctoroitOS.users.current || OctoroitOS.users.isLocked) {
        OctoroitOS.renderAuthScreen();
      } else {
        OctoroitOS.bootDesktop();
      }
    }, 500);
  }, 400);
});

OctoroitOS.renderAuthScreen = () => {
  console.log('[Auth] Rendering login screen');
  const screen = document.getElementById('auth-screen');
  const select = document.getElementById('auth-user-select');
  const form = document.getElementById('auth-form');
  const createBtn = document.getElementById('auth-create');
  const guestBtn = document.getElementById('auth-guest');
  const errorEl = document.getElementById('auth-error');
  const pinInput = document.getElementById('auth-pin');
  const loginBtn = document.getElementById('auth-login-btn');
  const backBtn = document.getElementById('auth-back-btn');

  if (!screen || !select) return console.error('[Auth] Missing DOM elements');

  screen.classList.remove('hidden');
  select.innerHTML = '';
  form.classList.add('hidden');
  createBtn.classList.remove('hidden');
  guestBtn.classList.remove('hidden');
  errorEl.classList.add('hidden');

  (OctoroitOS.users.list || []).forEach(u => {
    const card = document.createElement('div');
    card.className = 'auth-user-card';
    card.innerHTML = `<div class="avatar">${u.avatar}</div><div class="name">${u.username}</div>`;
    card.onclick = () => {
      select.classList.add('hidden');
      createBtn.classList.add('hidden');
      guestBtn.classList.add('hidden');
      form.classList.remove('hidden');
      document.getElementById('auth-avatar-display').textContent = u.avatar;
      document.getElementById('auth-username-display').textContent = u.username;
      pinInput.value = '';
      pinInput.focus();
      pinInput.dataset.user = u.username;
    };
    select.appendChild(card);
  });

  loginBtn.onclick = () => {
    const user = pinInput.dataset.user;
    const pin = pinInput.value;
    if (OctoroitOS.users.authenticate(user, pin)) {
      screen.classList.add('hidden');
      OctoroitOS.bootDesktop();
    } else {
      errorEl.classList.remove('hidden');
      pinInput.value = '';
      pinInput.focus();
    }
  };

  pinInput.onkeydown = e => { if (e.key === 'Enter') loginBtn.click(); };
  backBtn.onclick = () => {
    form.classList.add('hidden');
    select.classList.remove('hidden');
    createBtn.classList.remove('hidden');
    guestBtn.classList.remove('hidden');
    errorEl.classList.add('hidden');
  };
  guestBtn.onclick = () => OctoroitOS.users.startGuest();
  createBtn.onclick = () => {
    const name = prompt('Username:');
    const pin = prompt('4-6 digit PIN:');
    if (name && pin) {
      if (OctoroitOS.users.createUser(name, pin)) {
        OctoroitOS.notify(`User "${name}" created`, 'success');
        OctoroitOS.renderAuthScreen();
      } else alert('Username taken or invalid input.');
    }
  };
};

OctoroitOS.bootDesktop = () => {
  console.log('[Boot] Initializing desktop...');
  try {
    // Safe service inits
    if (OctoroitOS.wm?.init) OctoroitOS.wm.init();
    if (OctoroitOS.fs?.init) OctoroitOS.fs.init();
    if (OctoroitOS.widgets?.init) OctoroitOS.widgets.init();
    if (OctoroitOS.devtools?.init) OctoroitOS.devtools.init();
    if (OctoroitOS.updateDesktopSwitcher) OctoroitOS.updateDesktopSwitcher();

    // Force UI visible immediately
    document.getElementById('desktop')?.classList.remove('hidden');
    document.getElementById('taskbar')?.classList.remove('hidden');

    // Safe i18n fallback
    const t = (key, fallback) => {
      try { return OctoroitOS.i18n?.t?.(key) || fallback; } catch { return fallback; }
    };

    // Desktop Icons
    const icons = document.getElementById('desktop-icons');
    if (icons) {
      icons.innerHTML = '';
      const apps = [
        {id:'terminal',l:t('app.terminal','Terminal'),i:'⌨️'},
        {id:'files',l:t('app.files','Files'),i:'📁'},
        {id:'code',l:t('app.code','Code'),i:'💻'},
        {id:'calc',l:t('app.calc','Calc'),i:'🔢'},
        {id:'browser',l:t('app.browser','Browser'),i:'🌐'},
        {id:'notes',l:t('app.notes','Notes'),i:'📒'},
        {id:'monitor',l:t('app.monitor','Monitor'),i:'📊'},
        {id:'marketplace',l:t('app.marketplace','Market'),i:'🛒'},
        {id:'devtools',l:t('app.devtools','DevTools'),i:'🛠️'},
        {id:'settings',l:t('app.settings','Settings'),i:'⚙️'},
        {id:'trash',l:t('app.trash','Trash'),i:'🗑️',special:true}
      ];
      apps.forEach(a => {
        const d = document.createElement('div');
        d.className = `desktop-icon ${a.special?'trash-icon':''}`;
        d.innerHTML = `<div class="icon">${a.i}</div><div class="label">${a.l}</div>`;
        if (a.id === 'trash') {
          d.ondblclick = () => OctoroitOS.launchApp('files', {path: `/home/${OctoroitOS.users?.current||'guest'}/trash`});
          d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('drag-over'); });
          d.addEventListener('dragleave', () => d.classList.remove('drag-over'));
          d.addEventListener('drop', e => {
            e.preventDefault(); d.classList.remove('drag-over');
            try {
              const paths = JSON.parse(e.dataTransfer.getData('application/x-octoroit-paths')||'[]');
              paths.forEach(p => OctoroitOS.fs?.trash?.(p));
              OctoroitOS.notify?.(`${paths.length} item(s) trashed`, 'success');
            } catch(err) { console.warn('[Trash Drop]', err); }
          });
        } else {
          d.ondblclick = () => OctoroitOS.launchApp(a.id);
        }
        icons.appendChild(d);
      });
    }

    // Start Menu
    const sm = document.getElementById('start-menu');
    const sb = document.getElementById('start-btn');
    if (sm && sb) {
      const renderSM = () => {
        const grid = sm.querySelector('.start-apps');
        if (!grid) return;
        grid.innerHTML = '';
        Object.keys(OctoroitOS.apps || {}).forEach(id => {
          const el = document.createElement('div');
          el.className = 'start-app-item';
          el.innerHTML = `<div class="start-app-icon">${OctoroitOS.getIcon(id)}</div><div class="start-app-name">${id}</div>`;
          el.onclick = () => { OctoroitOS.launchApp(id); sm.classList.add('hidden'); sb.classList.remove('active'); };
          grid.appendChild(el);
        });
      };
      renderSM();
      sb.onclick = () => { sm.classList.toggle('hidden'); sb.classList.toggle('active'); };
      document.addEventListener('click', e => {
        if (!sm.contains(e.target) && !sb.contains(e.target)) { sm.classList.add('hidden'); sb.classList.remove('active'); }
      });
      const search = document.getElementById('start-search');
      if (search) search.oninput = e => {
        const term = e.target.value.toLowerCase();
        sm.querySelectorAll('.start-app-item').forEach(i => i.style.display = i.textContent.toLowerCase().includes(term) ? 'flex' : 'none');
      };
    }

    // Footer & Clock
    const footer = sm?.querySelector('.start-footer');
    if (footer) {
      const user = (OctoroitOS.users?.list || []).find(u => u.username === OctoroitOS.users?.current) || {username:'guest', avatar:'👻'};
      footer.innerHTML = `<div class="start-user"><div class="user-avatar">${user.avatar}</div><span>${user.username}</span></div><div style="display:flex;gap:8px;"><button id="sm-lock" style="background:transparent;border:none;color:var(--text-secondary);cursor:pointer;font-size:12px;">🔒 Lock</button><button id="sm-logout" style="background:transparent;border:none;color:#ff5f56;cursor:pointer;font-size:12px;">⏻ Logout</button></div>`;
      footer.querySelector('#sm-lock').onclick = () => OctoroitOS.users?.lock?.();
      footer.querySelector('#sm-logout').onclick = () => OctoroitOS.users?.logout?.();
    }

    const clk = document.getElementById('clock');
    if (clk) {
      const update = () => clk.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      update(); setInterval(update, 1000);
    }

    if (OctoroitOS.i18n?.updateDOM) OctoroitOS.i18n.updateDOM();
    OctoroitOS.notify?.(`Welcome, ${OctoroitOS.users?.current || 'User'}`, 'info');
    console.log('[Boot] ✅ Desktop successfully loaded');
  } catch (err) {
    console.error('[Boot] ❌ Desktop init failed:', err);
    // Force UI visible even on crash
    document.getElementById('desktop')?.classList.remove('hidden');
    document.getElementById('taskbar')?.classList.remove('hidden');
  }
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(e => console.warn('[SW] Failed:', e));