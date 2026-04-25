const STORAGE = {
  STATE: 'mp2_state',
  FAVORITES: 'mp2_favorites',
  PLAYLISTS: 'mp2_playlists',
  RECENT: 'mp2_recentlyPlayed',
  THEME: 'mp2_theme'
};
const MAX_RECENT = 20;

let songs = [];
let themeDefs = [];
const audio = document.getElementById('audio');
let currentQueue = [];
let state = {
  currentSongId: null,
  volume: 80,
  isMuted: false,
  shuffle: false,
  repeat: 'off',
  activeView: 'library',
  activePlaylistId: null,
  isPlaying: false
};
let favorites = [];
let playlists = [];
let recentlyPlayed = [];
let theme = { scheme: 'spotify', mode: 'dark' };
let addToPlaylistSongId = null;
let editingPlaylistId = null;
let deletingPlaylistId = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
  loadFromStorage();
  applyTheme();
  await loadSongs();
  renderView();
  setupControls();
  setupEvents();
  restoreState();
});

// ==================== SONGS ====================

async function loadSongs() {
  try {
    const [config, songData, playlistData] = await Promise.all([
      fetch('data/config.json').then(r => r.json()),
      fetch('data/songs.json').then(r => r.json()),
      fetch('data/playlists.json').then(r => r.json()),
    ]);

    songs = songData.songs || [];

    if (config.title) {
      $('#playerTitle').textContent = '♫ ' + config.title;
      document.title = config.title;
    }

    if (config.subtitle) {
      const sub = $('#playerSubtitle');
      sub.textContent = config.subtitle;
      sub.classList.add('visible');
    }

    if (config.logo) {
      const logo = $('#playerLogo');
      logo.src = config.logo;
      logo.style.display = 'block';
    }

    if (config.themes && config.themes.length) {
      themeDefs = config.themes;
      renderThemeCards();
      applyTheme();
    }

    // Load seeded playlists from playlists.json, merge with user playlists
    if (playlistData.playlists && playlistData.playlists.length) {
      const seeded = playlistData.playlists.map(pl => ({ ...pl, seeded: true }));
      playlists = playlists.filter(pl => !pl.seeded);
      playlists = [...seeded, ...playlists];
    }

    await Promise.all(songs.map(async (s) => {
      try { const r = await fetch(s.file, { method: 'HEAD' }); s.available = r.ok; }
      catch { s.available = false; }
    }));
  } catch { songs = []; }
}

function getSong(id) { return songs.find(s => s.id === id); }

// ==================== PLAYBACK ====================

function playSong(id) {
  const song = getSong(id);
  if (!song || !song.available) return;

  if (state.currentSongId !== id) {
    audio.src = song.file;
    state.currentSongId = id;
    addToRecent(id);
  }

  audio.play().catch(() => showError('Could not play file.'));
  state.isPlaying = true;
  updateNowPlaying();
  updateList();
  saveState();
}

function pauseSong() {
  audio.pause();
  state.isPlaying = false;
  updateNowPlaying();
  updateList();
  saveState();
}

function togglePlay() {
  if (!state.currentSongId) {
    const first = currentQueue.find(id => getSong(id)?.available);
    if (first) playSong(first);
    return;
  }
  state.isPlaying ? pauseSong() : playSong(state.currentSongId);
}

function nextSong() {
  const avail = currentQueue.filter(id => getSong(id)?.available);
  if (!avail.length) return;

  if (state.shuffle) {
    const others = avail.filter(id => id !== state.currentSongId);
    playSong((others.length ? others : avail)[Math.floor(Math.random() * (others.length || avail.length))]);
    return;
  }

  const idx = avail.indexOf(state.currentSongId);
  if (idx < avail.length - 1) playSong(avail[idx + 1]);
  else if (state.repeat === 'all') playSong(avail[0]);
  else { pauseSong(); audio.currentTime = 0; }
}

function prevSong() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const avail = currentQueue.filter(id => getSong(id)?.available);
  if (!avail.length) return;
  const idx = avail.indexOf(state.currentSongId);
  if (idx > 0) playSong(avail[idx - 1]);
  else if (state.repeat === 'all') playSong(avail[avail.length - 1]);
  else audio.currentTime = 0;
}

// ==================== CONTROLS ====================

function setupControls() {
  audio.volume = state.isMuted ? 0 : state.volume / 100;
  $('#volumeSlider').value = state.volume;
  updateVolumeSliderFill();
  updateVolumeIcon();

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || seeking) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    $('#progressBar').style.width = pct + '%';
    $('#progressInput').value = (audio.currentTime / audio.duration) * 1000;
    $('#currentTime').textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    $('#duration').textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if (state.repeat === 'one') { audio.currentTime = 0; audio.play(); return; }
    nextSong();
  });

  audio.addEventListener('error', () => {
    showError('Could not load file. Check that it exists in /media.');
    state.isPlaying = false;
    updateNowPlaying();
  });

  let seeking = false;

  $('#progressInput').addEventListener('mousedown', () => { seeking = true; });
  $('#progressInput').addEventListener('touchstart', () => { seeking = true; }, { passive: true });

  $('#progressInput').addEventListener('input', () => {
    seeking = true;
    if (!audio.duration) return;
    const val = $('#progressInput').value;
    const pct = val / 10;
    $('#progressBar').style.width = pct + '%';
    $('#currentTime').textContent = fmt((val / 1000) * audio.duration);
  });

  $('#progressInput').addEventListener('change', () => {
    if (audio.duration) {
      audio.currentTime = ($('#progressInput').value / 1000) * audio.duration;
    }
    seeking = false;
  });

  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnPrev').addEventListener('click', prevSong);
  $('#btnNext').addEventListener('click', nextSong);

  $('#btnShuffle').addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    $('#btnShuffle').classList.toggle('active', state.shuffle);
    saveState();
  });
  $('#btnShuffle').classList.toggle('active', state.shuffle);

  $('#btnRepeat').addEventListener('click', () => {
    const modes = ['off', 'all', 'one'];
    state.repeat = modes[(modes.indexOf(state.repeat) + 1) % 3];
    updateRepeatBtn();
    saveState();
  });
  updateRepeatBtn();

  $('#btnVolume').addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    audio.volume = state.isMuted ? 0 : state.volume / 100;
    updateVolumeIcon();
    saveState();
  });

  $('#volumeSlider').addEventListener('input', () => {
    state.volume = parseInt($('#volumeSlider').value);
    state.isMuted = false;
    audio.volume = state.volume / 100;
    updateVolumeIcon();
    updateVolumeSliderFill();
    saveState();
  });
}

function updateNowPlaying() {
  const song = getSong(state.currentSongId);
  if (song) {
    $('#songName').textContent = song.title + ' · ' + song.artist;
  } else {
    $('#songName').innerHTML = '&mdash;';
  }
  $('#btnPlay').innerHTML = state.isPlaying ? '&#9646;&#9646;' : '&#9654;';
}

function updateRepeatBtn() {
  const btn = $('#btnRepeat');
  btn.classList.toggle('active', state.repeat !== 'off');
  btn.title = state.repeat === 'off' ? 'Repeat' : state.repeat === 'all' ? 'Repeat All' : 'Repeat One';
  btn.innerHTML = state.repeat === 'one' ? '&#8635;<sup style="font-size:0.5em">1</sup>' : '&#8635;';
}

function updateVolumeIcon() {
  const v = state.isMuted ? 0 : state.volume;
  $('#btnVolume').innerHTML = v === 0 ? '&#128263;' : v < 50 ? '&#128265;' : '&#128266;';
}

function updateVolumeSliderFill() {
  const pct = state.volume;
  $('#volumeSlider').style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--bg-accent-area) ${pct}%)`;
}

function restoreState() {
  if (state.currentSongId) {
    const song = getSong(state.currentSongId);
    if (song && song.available) {
      audio.src = song.file;
      updateNowPlaying();
      updateList();
    } else {
      state.currentSongId = null;
    }
  }
  buildQueue();
}

// ==================== VIEWS ====================

function renderView() {
  updateTabs();
  const q = $('#searchInput').value.trim().toLowerCase();
  const view = state.activeView;

  if (view === 'library') {
    renderSongItems(filterQ(songs, q), 'No songs found.');
  } else if (view === 'favorites') {
    renderSongItems(filterQ(songs.filter(s => favorites.includes(s.id)), q), 'No favorites yet.');
  } else if (view === 'recent') {
    renderRecentItems(q);
  } else if (view === 'playlist') {
    const pl = playlists.find(p => p.id === state.activePlaylistId);
    if (!pl) { switchView('library'); return; }
    renderSongItems(filterQ(pl.songIds.map(id => getSong(id)).filter(Boolean), q), 'Empty playlist.', true);
  }
  buildQueue();
}

function filterQ(list, q) {
  if (!q) return list;
  return list.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q) ||
    (s.altName && s.altName.some(a => a.toLowerCase().includes(q)))
  );
}

function renderSongItems(list, emptyMsg, isPlView) {
  const ul = $('#songList');
  if (!list.length) {
    ul.innerHTML = `<div class="empty-msg"><span class="empty-icon">&#9835;</span>${emptyMsg}</div>`;
    return;
  }

  ul.innerHTML = list.map((s, i) => {
    const active = state.currentSongId === s.id;
    const fav = favorites.includes(s.id);
    const na = !s.available;
    return `<li class="song-item${active ? ' active' : ''}${na ? ' unavailable' : ''}" data-id="${s.id}">
      <span class="idx">${active && state.isPlaying ? '&#9654;' : i + 1}</span>
      <span class="name">${s.title} &middot; ${s.artist}</span>
      ${na ? '<span class="badge-na">N/A</span>' : ''}
      <button class="icon-btn fav-btn${fav ? ' on' : ''}" data-fav="${s.id}">${fav ? '&#9829;' : '&#9825;'}</button>
      <button class="icon-btn menu-btn" data-menu="${s.id}" data-plv="${!!isPlView}">&#8943;</button>
    </li>`;
  }).join('');

  attachListEvents();
}

function renderRecentItems(q) {
  const ul = $('#songList');
  let items = recentlyPlayed.map(r => { const s = getSong(r.songId); return s ? { ...s, playedAt: r.playedAt } : null; }).filter(Boolean);
  if (q) items = items.filter(s =>
    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q) || (s.altName && s.altName.some(a => a.toLowerCase().includes(q)))
  );

  if (!items.length) {
    ul.innerHTML = `<div class="empty-msg"><span class="empty-icon">&#9834;</span>${q ? 'No matches.' : 'No recent plays yet.'}</div>`;
    return;
  }

  ul.innerHTML = items.map((s, i) => {
    const active = state.currentSongId === s.id;
    const fav = favorites.includes(s.id);
    const na = !s.available;
    return `<li class="song-item${active ? ' active' : ''}${na ? ' unavailable' : ''}" data-id="${s.id}">
      <span class="idx">${active && state.isPlaying ? '&#9654;' : i + 1}</span>
      <span class="name">${s.title} &middot; ${s.artist}</span>
      <span class="recent-time">${timeAgo(s.playedAt)}</span>
      ${na ? '<span class="badge-na">N/A</span>' : ''}
      <button class="icon-btn fav-btn${fav ? ' on' : ''}" data-fav="${s.id}">${fav ? '&#9829;' : '&#9825;'}</button>
      <button class="icon-btn menu-btn" data-menu="${s.id}" data-plv="false">&#8943;</button>
    </li>`;
  }).join('');

  attachListEvents();
}

function attachListEvents() {
  $$('.song-item').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn') || e.target.closest('.menu-btn')) return;
      const s = getSong(li.dataset.id);
      if (s && s.available) playSong(s.id);
    });
  });
  $$('.fav-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(b.dataset.fav); }));
  $$('.menu-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); showSongCtx(e, b.dataset.menu, b.dataset.plv === 'true'); }));
}

function updateList() {
  $$('.song-item').forEach((li, i) => {
    const active = li.dataset.id === state.currentSongId;
    li.classList.toggle('active', active);
    li.querySelector('.idx').innerHTML = active && state.isPlaying ? '&#9654;' : (i + 1);
  });
}

function buildQueue() {
  if (state.activeView === 'library') currentQueue = songs.map(s => s.id);
  else if (state.activeView === 'favorites') currentQueue = songs.filter(s => favorites.includes(s.id)).map(s => s.id);
  else if (state.activeView === 'recent') currentQueue = recentlyPlayed.map(r => r.songId);
  else if (state.activeView === 'playlist') {
    const pl = playlists.find(p => p.id === state.activePlaylistId);
    currentQueue = pl ? pl.songIds : [];
  }
  if (!currentQueue.length) currentQueue = songs.map(s => s.id);
}

function switchView(view, plId) {
  state.activeView = view;
  state.activePlaylistId = plId || null;
  $('#searchInput').value = '';
  closePLDropdown();
  renderView();
  saveState();
}

// ==================== TABS ====================

function updateTabs() {
  $$('.tab').forEach(t => t.classList.remove('active'));
  if (state.activeView === 'playlist') $('#tabPlaylists').classList.add('active');
  else { const t = $(`.tab[data-view="${state.activeView}"]`); if (t) t.classList.add('active'); }
}

function renderPLDropdown() {
  const el = $('#ddPlaylistList');
  el.innerHTML = playlists.map(pl => `
    <div class="dd-item" data-plid="${pl.id}">
      <span>${pl.name}${pl.seeded ? ' <span class="badge-seeded">&#128190;</span>' : ''}</span>
      ${!pl.seeded ? `<button class="icon-btn" data-plmenu="${pl.id}">&#8943;</button>` : ''}
    </div>`).join('');

  el.querySelectorAll('.dd-item').forEach(d => {
    d.addEventListener('click', (e) => { if (!e.target.closest('[data-plmenu]')) switchView('playlist', d.dataset.plid); });
  });
  el.querySelectorAll('[data-plmenu]').forEach(b => {
    b.addEventListener('click', (e) => { e.stopPropagation(); showPLCtx(e, b.dataset.plmenu); });
  });
}

function togglePLDropdown() {
  const dd = $('#playlistDropdown');
  if (dd.classList.contains('open')) { closePLDropdown(); } else { renderPLDropdown(); dd.classList.add('open'); }
}

function closePLDropdown() { $('#playlistDropdown').classList.remove('open'); }

// ==================== FAVORITES ====================

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id); else favorites.splice(idx, 1);
  saveFavorites();
  if (state.activeView === 'favorites') renderView();
  else {
    $$(`.fav-btn[data-fav="${id}"]`).forEach(b => {
      const on = favorites.includes(id);
      b.classList.toggle('on', on);
      b.innerHTML = on ? '&#9829;' : '&#9825;';
    });
  }
}

// ==================== PLAYLISTS ====================

function createPlaylist(name) {
  const pl = { id: 'pl-' + Date.now(), name: name.trim(), songIds: [] };
  playlists.push(pl);
  savePlaylists();
  return pl;
}

function renamePlaylist(id, name) {
  const pl = playlists.find(p => p.id === id);
  if (pl) { pl.name = name.trim(); savePlaylists(); if (state.activeView === 'playlist' && state.activePlaylistId === id) renderView(); }
}

function deletePlaylist(id) {
  playlists = playlists.filter(p => p.id !== id);
  savePlaylists();
  if (state.activeView === 'playlist' && state.activePlaylistId === id) switchView('library');
}

function removeSongFromPL(plId, songId) {
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  pl.songIds = pl.songIds.filter(id => id !== songId);
  savePlaylists();
  if (state.activeView === 'playlist' && state.activePlaylistId === plId) renderView();
}

// ==================== RECENTLY PLAYED ====================

function addToRecent(songId) {
  recentlyPlayed = recentlyPlayed.filter(r => r.songId !== songId);
  recentlyPlayed.unshift({ songId, playedAt: Date.now() });
  if (recentlyPlayed.length > MAX_RECENT) recentlyPlayed = recentlyPlayed.slice(0, MAX_RECENT);
  saveRecent();
  if (state.activeView === 'recent') renderView();
}

// ==================== CONTEXT MENUS ====================

function showSongCtx(event, songId, isPlView) {
  const menu = $('#contextMenu');
  let html = `<button class="ctx-item" data-action="add" data-sid="${songId}">+ Add to Playlist</button>`;
  const activePl = playlists.find(p => p.id === state.activePlaylistId);
  if (isPlView && state.activePlaylistId && activePl && !activePl.seeded)
    html += `<button class="ctx-item danger" data-action="remove" data-sid="${songId}">Remove from Playlist</button>`;
  menu.innerHTML = html;
  menu.querySelectorAll('.ctx-item').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.action === 'add') openAddToPL(b.dataset.sid);
    else removeSongFromPL(state.activePlaylistId, b.dataset.sid);
    closeCtx();
  }));
  posCtx(menu, event);
}

function showPLCtx(event, plId) {
  closePLDropdown();
  const menu = $('#contextMenu');
  menu.innerHTML = `
    <button class="ctx-item" data-action="rename">Rename</button>
    <button class="ctx-item danger" data-action="delete">Delete</button>`;
  menu.querySelector('[data-action="rename"]').addEventListener('click', () => { openRenamePL(plId); closeCtx(); });
  menu.querySelector('[data-action="delete"]').addEventListener('click', () => { openDeleteConfirm(plId); closeCtx(); });
  posCtx(menu, event);
}

function posCtx(menu, e) {
  menu.classList.add('open');
  menu.style.left = Math.min(e.clientX, innerWidth - 180) + 'px';
  menu.style.top = Math.min(e.clientY, innerHeight - 80) + 'px';
}

function closeCtx() { $('#contextMenu').classList.remove('open'); }

// ==================== MODALS ====================

function openModal(id) { closeCtx(); closePLDropdown(); document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function openAddToPL(songId) {
  addToPlaylistSongId = songId;
  const c = $('#playlistCheckboxes');
  const userPlaylists = playlists.filter(pl => !pl.seeded);
  c.innerHTML = userPlaylists.length
    ? userPlaylists.map(pl => `<label class="pl-check"><input type="checkbox" value="${pl.id}" ${pl.songIds.includes(songId) ? 'checked' : ''}>${pl.name}</label>`).join('')
    : '<p style="color:var(--text-secondary);font-size:0.8rem;padding:4px">No playlists yet.</p>';
  openModal('addToPlaylistModal');
}

function saveAddToPL() {
  if (!addToPlaylistSongId) return;
  $$('#playlistCheckboxes input[type="checkbox"]').forEach(cb => {
    const pl = playlists.find(p => p.id === cb.value);
    if (!pl) return;
    if (cb.checked && !pl.songIds.includes(addToPlaylistSongId)) pl.songIds.push(addToPlaylistSongId);
    else if (!cb.checked) pl.songIds = pl.songIds.filter(id => id !== addToPlaylistSongId);
  });
  savePlaylists();
  closeModal('addToPlaylistModal');
  addToPlaylistSongId = null;
  if (state.activeView === 'playlist') renderView();
}

function openNewPL(fromModal) {
  editingPlaylistId = null;
  $('#playlistNameTitle').textContent = 'New Playlist';
  $('#playlistNameInput').value = '';
  if (fromModal) closeModal('addToPlaylistModal');
  openModal('playlistNameModal');
  setTimeout(() => $('#playlistNameInput').focus(), 100);
}

function openRenamePL(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  editingPlaylistId = id;
  $('#playlistNameTitle').textContent = 'Rename Playlist';
  $('#playlistNameInput').value = pl.name;
  openModal('playlistNameModal');
  setTimeout(() => { $('#playlistNameInput').focus(); $('#playlistNameInput').select(); }, 100);
}

function savePLName() {
  const name = $('#playlistNameInput').value.trim();
  if (!name) return;
  if (editingPlaylistId) { renamePlaylist(editingPlaylistId, name); }
  else {
    const pl = createPlaylist(name);
    if (addToPlaylistSongId) { pl.songIds.push(addToPlaylistSongId); savePlaylists(); openAddToPL(addToPlaylistSongId); closeModal('playlistNameModal'); return; }
  }
  closeModal('playlistNameModal');
}

function openDeleteConfirm(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  deletingPlaylistId = id;
  $('#deletePlaylistName').textContent = pl.name;
  openModal('confirmDeleteModal');
}

function confirmDelete() {
  if (deletingPlaylistId) { deletePlaylist(deletingPlaylistId); deletingPlaylistId = null; }
  closeModal('confirmDeleteModal');
}

// ==================== THEME ====================

function applyTheme() {
  const def = themeDefs.find(t => t.id === theme.scheme) || themeDefs[0];
  if (def) {
    const vars = def[theme.mode] || def.dark;
    Object.entries(vars).forEach(([prop, val]) => {
      document.body.style.setProperty(prop, val);
    });
  }
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.scheme === theme.scheme));
  $$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === theme.mode));
}

function setTheme(scheme, mode) {
  if (scheme) theme.scheme = scheme;
  if (mode) theme.mode = mode;
  applyTheme();
  saveTheme();
  updateVolumeSliderFill();
}

function renderThemeCards() {
  const container = $('#themeOptions');
  container.innerHTML = themeDefs.map(t =>
    `<button class="theme-card${t.id === theme.scheme ? ' active' : ''}" data-scheme="${t.id}">
      <span class="theme-dot" style="background:${t.dot}"></span> ${t.name}
    </button>`
  ).join('');
  container.querySelectorAll('.theme-card').forEach(c => {
    c.addEventListener('click', () => setTheme(c.dataset.scheme, null));
  });
}

// ==================== STORAGE ====================

function saveState() {
  localStorage.setItem(STORAGE.STATE, JSON.stringify({
    currentSongId: state.currentSongId, volume: state.volume, isMuted: state.isMuted,
    shuffle: state.shuffle, repeat: state.repeat, activeView: state.activeView, activePlaylistId: state.activePlaylistId
  }));
}

function saveFavorites() { localStorage.setItem(STORAGE.FAVORITES, JSON.stringify(favorites)); }
function savePlaylists() { localStorage.setItem(STORAGE.PLAYLISTS, JSON.stringify(playlists.filter(pl => !pl.seeded))); }
function saveRecent() { localStorage.setItem(STORAGE.RECENT, JSON.stringify(recentlyPlayed)); }
function saveTheme() { localStorage.setItem(STORAGE.THEME, JSON.stringify(theme)); }

function loadFromStorage() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE.STATE));
    if (s) {
      state.currentSongId = s.currentSongId || null;
      state.volume = s.volume ?? 80;
      state.isMuted = s.isMuted || false;
      state.shuffle = s.shuffle || false;
      state.repeat = s.repeat || 'off';
      state.activeView = s.activeView || 'library';
      state.activePlaylistId = s.activePlaylistId || null;
    }
  } catch {}
  try { favorites = JSON.parse(localStorage.getItem(STORAGE.FAVORITES)) || []; } catch { favorites = []; }
  try { playlists = JSON.parse(localStorage.getItem(STORAGE.PLAYLISTS)) || []; } catch { playlists = []; }
  try { recentlyPlayed = JSON.parse(localStorage.getItem(STORAGE.RECENT)) || []; } catch { recentlyPlayed = []; }
  try { const t = JSON.parse(localStorage.getItem(STORAGE.THEME)); if (t) theme = t; } catch {}
}

function exportSettings() {
  const data = { exportedAt: new Date().toISOString(), version: 1,
    state: { volume: state.volume, isMuted: state.isMuted, shuffle: state.shuffle, repeat: state.repeat },
    favorites, playlists, recentlyPlayed, theme };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = `musicbox-v2-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

function importSettings(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.version !== 1) { alert('Incompatible version.'); return; }
      if (d.favorites) { favorites = d.favorites; saveFavorites(); }
      if (d.playlists) { playlists = d.playlists; savePlaylists(); }
      if (d.recentlyPlayed) { recentlyPlayed = d.recentlyPlayed; saveRecent(); }
      if (d.theme) { theme = d.theme; saveTheme(); applyTheme(); }
      if (d.state) {
        state.volume = d.state.volume ?? state.volume;
        state.isMuted = d.state.isMuted ?? state.isMuted;
        state.shuffle = d.state.shuffle ?? state.shuffle;
        state.repeat = d.state.repeat ?? state.repeat;
        audio.volume = state.isMuted ? 0 : state.volume / 100;
        $('#volumeSlider').value = state.volume;
        updateVolumeIcon(); updateVolumeSliderFill();
        $('#btnShuffle').classList.toggle('active', state.shuffle);
        updateRepeatBtn(); saveState();
      }
      renderView(); updateNowPlaying();
      alert('Imported!');
    } catch { alert('Invalid file.'); }
  };
  reader.readAsText(file);
}

// ==================== EVENTS ====================

function setupEvents() {
  $$('.tab[data-view]').forEach(t => t.addEventListener('click', () => {
    t.id === 'tabPlaylists' ? togglePLDropdown() : switchView(t.dataset.view);
  }));

  $('#btnSettings').addEventListener('click', () => openModal('settingsModal'));
  $('#btnNewPlaylist').addEventListener('click', (e) => { e.stopPropagation(); closePLDropdown(); openNewPL(false); });

  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); }));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.menu-btn') && !e.target.closest('[data-plmenu]')) closeCtx();
    if (!e.target.closest('.tab-dd-wrap')) closePLDropdown();
  });

  $$('.mode-btn').forEach(b => b.addEventListener('click', () => setTheme(null, b.dataset.mode)));

  $('#btnExport').addEventListener('click', exportSettings);
  $('#btnImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => { if (e.target.files[0]) importSettings(e.target.files[0]); e.target.value = ''; });

  $('#btnDoneAddToPlaylist').addEventListener('click', saveAddToPL);
  $('#btnCreateFromModal').addEventListener('click', () => openNewPL(true));
  $('#btnSavePlaylistName').addEventListener('click', savePLName);
  $('#playlistNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') savePLName(); });
  $('#btnConfirmDelete').addEventListener('click', confirmDelete);

  $('#searchInput').addEventListener('input', () => renderView());
  window.addEventListener('beforeunload', saveState);
}

// ==================== UTILITIES ====================

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + Math.floor(s % 60).toString().padStart(2, '0');
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

function showError(msg) { $('#errorMsg').textContent = msg; }
