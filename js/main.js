document.addEventListener('DOMContentLoaded',async()=>{
  const boot=document.getElementById('boot-screen'),bar=boot.querySelector('.boot-bar');
  let prog=0;const iv=setInterval(()=>{prog+=Math.random()*12+3;if(prog>=90)prog=90;bar.style.width=prog+'%'},100);
  try{
    await OctoroitOS.storage.init();
    OctoroitOS.users.init();
    OctoroitOS.i18n.init();
    OctoroitOS.theme.init();
    OctoroitOS.permissions.init();
    OctoroitOS.audio.init();
    OctoroitOS.a11y.init();
    console.log('[Boot] Core services ready');
  }catch(e){console.error('[Boot] Init error:',e)}
  clearInterval(iv);bar.style.width='100%';
  setTimeout(()=>{boot.style.opacity='0';setTimeout(()=>{boot.classList.add('hidden');OctoroitOS.audio.play('boot');if(!OctoroitOS.users.current||OctoroitOS.users.isLocked){OctoroitOS.renderAuthScreen()}else{OctoroitOS.bootDesktop()}},500)},400);
});

OctoroitOS.renderAuthScreen=()=>{
  const screen=document.getElementById('auth-screen'),select=document.getElementById('auth-user-select'),form=document.getElementById('auth-form'),createBtn=document.getElementById('auth-create'),guestBtn=document.getElementById('auth-guest'),errorEl=document.getElementById('auth-error'),pinInput=document.getElementById('auth-pin'),loginBtn=document.getElementById('auth-login-btn'),backBtn=document.getElementById('auth-back-btn');
  screen.classList.remove('hidden');select.innerHTML='';form.classList.add('hidden');createBtn.classList.remove('hidden');guestBtn.classList.remove('hidden');errorEl.classList.add('hidden');
  OctoroitOS.users.list.forEach(u=>{const card=document.createElement('div');card.className='auth-user-card';card.innerHTML=`<div class="avatar">${u.avatar}</div><div class="name">${u.username}</div>`;card.onclick=()=>{select.classList.add('hidden');createBtn.classList.add('hidden');guestBtn.classList.add('hidden');form.classList.remove('hidden');document.getElementById('auth-avatar-display').textContent=u.avatar;document.getElementById('auth-username-display').textContent=u.username;pinInput.value='';pinInput.focus();pinInput.dataset.user=u.username};select.appendChild(card)});
  loginBtn.onclick=()=>{const user=pinInput.dataset.user,pin=pinInput.value;if(OctoroitOS.users.authenticate(user,pin)){screen.classList.add('hidden');OctoroitOS.bootDesktop()}else{errorEl.classList.remove('hidden');pinInput.value='';pinInput.focus()}};
  pinInput.onkeydown=e=>{if(e.key==='Enter')loginBtn.click()};
  backBtn.onclick=()=>{form.classList.add('hidden');select.classList.remove('hidden');createBtn.classList.remove('hidden');guestBtn.classList.remove('hidden');errorEl.classList.add('hidden')};
  guestBtn.onclick=()=>OctoroitOS.users.startGuest();
  createBtn.onclick=()=>{const name=prompt('Username:'),pin=prompt('4-6 digit PIN:');if(name&&pin){if(OctoroitOS.users.createUser(name,pin)){OctoroitOS.notify(`User "${name}" created`,'success');OctoroitOS.renderAuthScreen()}else alert('Username taken or invalid input.')}}};
};

OctoroitOS.bootDesktop=()=>{
  console.log('[Boot] Loading desktop...');
  OctoroitOS.wm.init();
  OctoroitOS.fs.init();
  if(OctoroitOS.widgets?.init) OctoroitOS.widgets.init();
  if(OctoroitOS.devtools?.init) OctoroitOS.devtools.init();
  OctoroitOS.updateDesktopSwitcher();
  document.getElementById('desktop').classList.remove('hidden');
  document.getElementById('taskbar').classList.remove('hidden');
  const icons=document.getElementById('desktop-icons');icons.innerHTML='';
  const desktopApps=[{id:'terminal',l:OctoroitOS.i18n.t('app.terminal'),i:'⌨️'},{id:'files',l:OctoroitOS.i18n.t('app.files'),i:'📁'},{id:'code',l:OctoroitOS.i18n.t('app.code'),i:'💻'},{id:'calc',l:OctoroitOS.i18n.t('app.calc'),i:'🔢'},{id:'browser',l:OctoroitOS.i18n.t('app.browser'),i:'🌐'},{id:'notes',l:OctoroitOS.i18n.t('app.notes'),i:'📒'},{id:'monitor',l:OctoroitOS.i18n.t('app.monitor'),i:'📊'},{id:'marketplace',l:OctoroitOS.i18n.t('app.marketplace'),i:'🛒'},{id:'devtools',l:OctoroitOS.i18n.t('app.devtools'),i:'🛠️'},{id:'settings',l:OctoroitOS.i18n.t('app.settings'),i:'⚙️'},{id:'trash',l:OctoroitOS.i18n.t('app.trash'),i:'🗑️',special:true}];
  desktopApps.forEach(a=>{const d=document.createElement('div');d.className=`desktop-icon ${a.special?'trash-icon':''}`;d.innerHTML=`<div class="icon">${a.i}</div><div class="label">${a.l}</div>`;if(a.id==='trash'){d.ondblclick=()=>OctoroitOS.launchApp('files',{path:`/home/${OctoroitOS.users.current||'guest'}/trash`});d.addEventListener('dragover',e=>{e.preventDefault();d.classList.add('drag-over')});d.addEventListener('dragleave',()=>d.classList.remove('drag-over'));d.addEventListener('drop',e=>{e.preventDefault();d.classList.remove('drag-over');const paths=JSON.parse(e.dataTransfer.getData('application/x-octoroit-paths')||'[]');paths.forEach(p=>OctoroitOS.fs.trash(p));OctoroitOS.notify(`${paths.length} item(s) trashed`,'success')})}else{d.ondblclick=()=>OctoroitOS.launchApp(a.id)}icons.appendChild(d)});
  const sm=document.getElementById('start-menu'),sb=document.getElementById('start-btn');
  const renderSM=()=>{const grid=sm.querySelector('.start-apps');grid.innerHTML='';Object.keys(OctoroitOS.apps).forEach(id=>{const el=document.createElement('div');el.className='start-app-item';el.innerHTML=`<div class="start-app-icon">${OctoroitOS.getIcon(id)}</div><div class="start-app-name">${id}</div>`;el.onclick=()=>{OctoroitOS.launchApp(id);sm.classList.add('hidden');sb.classList.remove('active')};grid.appendChild(el)})};
  renderSM();sb.onclick=()=>{sm.classList.toggle('hidden');sb.classList.toggle('active')};document.addEventListener('click',e=>{if(!sm.contains(e.target)&&!sb.contains(e.target)){sm.classList.add('hidden');sb.classList.remove('active')}});document.getElementById('start-search').oninput=e=>{const t=e.target.value.toLowerCase();sm.querySelectorAll('.start-app-item').forEach(i=>i.style.display=i.textContent.toLowerCase().includes(t)?'flex':'none')};
  const footer=sm.querySelector('.start-footer');const user=OctoroitOS.users.list.find(u=>u.username===OctoroitOS.users.current)||{username:'guest',avatar:'👻'};footer.innerHTML=`<div class="start-user"><div class="user-avatar">${user.avatar}</div><span>${user.username}</span></div><div style="display:flex;gap:8px;"><button id="sm-lock" style="background:transparent;border:none;color:var(--text-secondary);cursor:pointer;font-size:12px;">🔒 Lock</button><button id="sm-logout" style="background:transparent;border:none;color:#ff5f56;cursor:pointer;font-size:12px;">⏻ Logout</button></div>`;footer.querySelector('#sm-lock').onclick=()=>OctoroitOS.users.lock();footer.querySelector('#sm-logout').onclick=()=>OctoroitOS.users.logout();
  const clk=document.getElementById('clock');setInterval(()=>clk.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),1000);clk.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  OctoroitOS.i18n.updateDOM();OctoroitOS.notify(`${OctoroitOS.i18n.t('auth.welcome')}, ${OctoroitOS.users.current}`,'info');
  console.log('[Boot] Desktop ready');
};

if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW failed:',e));