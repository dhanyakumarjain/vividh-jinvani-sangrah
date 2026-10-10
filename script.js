const STORAGE = {
  STATE: 'mp2_state',
  FAVORITES: 'mp2_favorites',
  PLAYLISTS: 'mp2_playlists',
  RECENT: 'mp2_recentlyPlayed',
  THEME: 'mp2_theme'
};
const MAX_RECENT = 10;
const MAX_RECENT_HOME = 3;

// ==================== THEMES ====================
// The six themes are defined purely as [data-theme="..."] blocks in style.css.
// Here we only keep the metadata needed to render the Settings swatches.
const THEMES = [
  { id: 'saffron', name: 'Saffron', dot: '#f97316', swatch2: '#fbbf24' },
  { id: 'blue', name: 'Blue', dot: '#2563eb', swatch2: '#7c3aed' },
  { id: 'green', name: 'Green', dot: '#059669', swatch2: '#14b8a6' },
  { id: 'pink', name: 'Pink', dot: '#db2777', swatch2: '#7c3aed' },
  { id: 'purple', name: 'Purple', dot: '#7c3aed', swatch2: '#d946ef' },
  { id: 'dark', name: 'Lotus', dot: '#f59e0b', swatch2: '#6366f1' }
];
const VIEWS = ['home', 'playlists', 'favorites', 'search', 'settings'];

let songs = [];
let playlists = [];
let favorites = [];
let recentlyPlayed = [];
let theme = { scheme: 'saffron' };
let currentQueue = [];
let currentDataVersion = null;
let addToPlaylistSongId = null;
let editingPlaylistId = null;
let deletingPlaylistId = null;
let seeking = false;

const audio = document.getElementById('audio');
const state = {
  currentSongId: null,
  volume: 80,
  isMuted: false,
  shuffle: false,
  repeat: 'off',
  autoNext: true,
  activeView: 'home',
  playlistDetailId: null,
  isPlaying: false,
  savedTime: 0
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ==================== UTILITIES ====================

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function setIcon(el, iconId) {
  if (!el) return;
  const use = el.querySelector('use');
  if (use) use.setAttribute('href', '#i-' + iconId);
}

function setRangeFill(el, pct) {
  if (!el) return;
  const p = Math.max(0, Math.min(100, pct || 0));
  el.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${p}%, var(--border) ${p}%, var(--border) 100%)`;
}

function fmt(s) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return Math.floor(s / 60) + ':' + Math.floor(s % 60).toString().padStart(2, '0');
}

function showError(msg) {
  const e = $('#errorMsg');
  if (e) e.textContent = msg || '';
  const f = $('#fpError');
  if (f) { f.textContent = msg || ''; f.hidden = !msg; }
}

function getSong(id) { return songs.find(s => s.id === id); }

// ==================== SORT ====================
// Numeric prefixes (0101.01, 104.01 ...) sort numerically in ascending order;
// non-numeric titles come after all numbered titles, alphabetically.
function parseSongSortKey(title) {
  const m = (title || '').match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function compareSongTitles(a, b) {
  const ka = parseSongSortKey(a.title);
  const kb = parseSongSortKey(b.title);
  if (ka !== null && kb !== null) {
    if (ka !== kb) return ka - kb;
    return (a.title || '').localeCompare(b.title || '');
  }
  if (ka !== null) return -1;
  if (kb !== null) return 1;
  return (a.title || '').localeCompare(b.title || '');
}

function sortPlaylists() {
  playlists.sort((a, b) => {
    const aHasDigits = /^\d{4}\s/.test(a.name || '');
    const bHasDigits = /^\d{4}\s/.test(b.name || '');
    if (aHasDigits && bHasDigits) {
      const aNum = parseInt((a.name || '').substring(0, 4)) || 0;
      const bNum = parseInt((b.name || '').substring(0, 4)) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return (a.name || '').localeCompare(b.name || '');
    }
    if (aHasDigits) return -1;
    if (bHasDigits) return 1;
    if (a.seeded && !b.seeded) return -1;
    if (!a.seeded && b.seeded) return 1;
    return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
  });
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
  loadFromStorage();
  if (!THEMES.some(t => t.id === theme.scheme)) theme = { scheme: 'saffron' };
  applyTheme();
  renderThemeCards();
  await loadSongs();

  state.activeView = 'home';
  state.playlistDetailId = null;
  navigate('home', { track: false, save: false });

  setupControls();
  setupEvents();
  restoreState();
  startDataUpdateChecker();
});

// ==================== DATA ====================

async function loadSongs() {
  try {
    const config = await fetch(`data/config.json?t=${Date.now()}`).then(r => r.json());
    const cacheBuster = config.lastUpdated || Date.now();

    const [songData, playlistData] = await Promise.all([
      fetch(`data/songs.json?v=${cacheBuster}`).then(r => r.json()),
      fetch(`data/playlists.json?v=${cacheBuster}`).then(r => r.json())
    ]);

    songs = songData.songs || [];

    const uniqueSongs = [];
    const seenPaths = new Set();
    for (const song of songs) {
      if (!seenPaths.has(song.file)) {
        seenPaths.add(song.file);
        uniqueSongs.push(song);
      }
    }
    songs = uniqueSongs;
    songs.sort(compareSongTitles);

    if (config.title) {
      const h = $('#homeTitle');
      if (h) h.textContent = config.title;
      const sn = $('#sideAppName');
      if (sn) sn.textContent = config.title;
      document.title = config.title;
    }
    if (config.subtitle) {
      const s = $('#homeSubtitle');
      if (s) s.textContent = config.subtitle;
    }

    if (playlistData.playlists && playlistData.playlists.length) {
      const seeded = playlistData.playlists.map(pl => ({ ...pl, seeded: true }));
      playlists = playlists.filter(pl => !pl.seeded);
      playlists = [...seeded, ...playlists];
      sortPlaylists();
    }

    songs.forEach(s => { s.available = true; });

    if (config.lastUpdated) displayLastUpdated(config.lastUpdated);

    loadDurationsLazily();
  } catch (e) {
    songs = [];
    showError('Could not load song data. Run the site through scripts/serve.py.');
  }
}

function loadDurationsLazily() {
  const pending = songs.filter(s => !s.duration || s.duration === 0);
  if (!pending.length) return;
  let i = 0;
  function loadNext() {
    if (i >= pending.length) return;
    const batch = pending.slice(i, i + 3);
    i += 3;
    let done = 0;
    batch.forEach(song => {
      const a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => {
        song.duration = a.duration;
        const span = document.querySelector(`.song-row[data-id="${song.id}"] .song-dur`);
        if (span) span.textContent = fmt(a.duration);
        done++;
        if (done === batch.length) setTimeout(loadNext, 200);
      }, { once: true });
      a.addEventListener('error', () => {
        done++;
        if (done === batch.length) setTimeout(loadNext, 200);
      }, { once: true });
      a.src = song.file;
    });
  }
  setTimeout(loadNext, 1500);
}

function resolvePlaylistSongs(pl) {
  const seenIds = new Set();
  const seenTitles = new Set();
  const list = (pl.songIds || [])
    .map(id => getSong(id))
    .filter(s => {
      if (!s || seenIds.has(s.id)) return false;
      const titleKey = (s.title || '').trim().toLowerCase();
      if (seenTitles.has(titleKey)) return false;
      seenIds.add(s.id);
      seenTitles.add(titleKey);
      return true;
    });
  if (!pl.userOrdered) list.sort(compareSongTitles);
  return list;
}

// ==================== ANALYTICS ====================

function trackEvent(eventName, eventParams = {}) {
  if (typeof gtag !== 'undefined') gtag('event', eventName, eventParams);
}

// ==================== NAVIGATION ====================

function navigate(view, opts = {}) {
  if (!VIEWS.includes(view)) view = 'home';
  state.activeView = view;
  $$('.page[data-page]').forEach(p => { p.hidden = p.dataset.page !== view; });
  $$('.nav-link[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === view));

  if (view === 'home') renderHome();
  else if (view === 'playlists') renderPlaylistsPage();
  else if (view === 'favorites') renderFavorites();
  else if (view === 'search') renderSearch();
  else if (view === 'settings') renderSettings();

  if (opts.save !== false) saveState();
  if (opts.track !== false) trackEvent('view_change', { view });
}

function openPlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  state.activeView = 'playlists';
  state.playlistDetailId = id;
  $$('.page[data-page]').forEach(p => { p.hidden = p.dataset.page !== 'playlists'; });
  $$('.nav-link[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === 'playlists'));
  renderPlaylistsPage();
  saveState();
  trackEvent('view_change', { view: 'playlist', playlist_id: id });
}

// ==================== RENDER: SONG LISTS ====================

function songRowHTML(s, opts = {}) {
  const active = state.currentSongId === s.id;
  const fav = favorites.includes(s.id);
  const na = s.available === false;
  const durStr = s.duration && s.duration > 0 ? fmt(s.duration) : '';
  const plv = opts.isPlView && !opts.seeded ? '1' : '';
  return `<div class="song-row${active ? ' active' : ''}${na ? ' unavailable' : ''}" data-id="${s.id}">
    <div class="song-top">
      <span class="song-icon"><svg><use href="#i-music"/></svg></span>
      <span class="song-title">${esc(s.title)}</span>
      ${durStr ? `<span class="song-dur">${durStr}</span>` : ''}
    </div>
    <div class="song-bottom">
      <span class="song-artist">${esc(s.artist || '')}</span>
      <span class="song-actions">
        <button class="song-action fav${fav ? ' on' : ''}" data-fav="${s.id}" aria-label="Favourite"><svg><use href="#i-heart"/></svg></button>
        <button class="song-action" data-menu="${s.id}" data-plv="${plv}" aria-label="More options"><svg><use href="#i-more"/></svg></button>
      </span>
    </div>
  </div>`;
}

function renderSongList(container, list, emptyMsg, opts = {}) {
  if (!container) return;
  container._ids = list.map(s => s.id);
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><svg><use href="#i-music"/></svg>${esc(emptyMsg)}</div>`;
    return;
  }
  container.innerHTML = list.map(s => songRowHTML(s, opts)).join('');
  bindListInteractions(container);
}

function bindListInteractions(container) {
  container.onclick = (e) => {
    const row = e.target.closest('.song-row');
    if (!row || !container.contains(row)) return;
    const id = row.dataset.id;
    if (e.target.closest('.song-action.fav')) { toggleFavorite(id); return; }
    const menuBtn = e.target.closest('.song-action[data-menu]');
    if (menuBtn) { showSongCtx(e, id, menuBtn.dataset.plv === '1'); return; }
    playFromList(container._ids, id);
  };
}

// ==================== RENDER: PLAYLISTS ====================

function playlistCardHTML(pl) {
  return `<div class="playlist-card" data-plid="${pl.id}">
    <span class="pc-icon"><svg><use href="#i-music"/></svg></span>
    <span class="pc-name">${esc(pl.name)}</span>
    ${!pl.seeded ? `<button class="song-action" data-plmenu="${pl.id}" aria-label="Options"><svg><use href="#i-more"/></svg></button>` : ''}
  </div>`;
}

function bindPlaylistCards(container) {
  container.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-plmenu]')) return;
      openPlaylist(card.dataset.plid);
    });
  });
  container.querySelectorAll('[data-plmenu]').forEach(b => {
    b.addEventListener('click', (e) => { e.stopPropagation(); showPLCtx(e, b.dataset.plmenu); });
  });
}

const PL_INITIAL = 6;
const PL_STEP = 12;
let playlistsObserver = null;

function renderPlaylistGrid(container, list) {
  if (!container) return;
  container._plList = list;
  container._plShown = 0;
  loadNextPlaylists(container);
}

function loadNextPlaylists(container) {
  const list = container._plList || [];
  if (!list.length) {
    container.innerHTML = '<div class="empty-state">No playlists yet.</div>';
    return;
  }
  const step = container._plShown === 0 ? PL_INITIAL : PL_STEP;
  container._plShown = Math.min(container._plShown + step, list.length);
  container.innerHTML = list.slice(0, container._plShown).map(playlistCardHTML).join('');
  bindPlaylistCards(container);
  if (container._plShown < list.length) {
    const sentinel = document.createElement('div');
    sentinel.className = 'pl-sentinel';
    container.appendChild(sentinel);
    observePlaylistSentinel(container, sentinel);
  }
}

function observePlaylistSentinel(container, sentinel) {
  if (playlistsObserver) playlistsObserver.disconnect();
  if (typeof IntersectionObserver === 'undefined') {
    sentinel.remove();
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost pl-more';
    btn.textContent = 'Load more';
    btn.addEventListener('click', () => loadNextPlaylists(container));
    container.appendChild(btn);
    return;
  }
  playlistsObserver = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      playlistsObserver.disconnect();
      loadNextPlaylists(container);
    }
  }, { rootMargin: '200px' });
  playlistsObserver.observe(sentinel);
}

// ==================== RENDER: PAGES ====================

function renderHome() {
  const grid = $('#homePlaylists');
  if (grid) renderPlaylistGrid(grid, playlists);

  const recent = recentlyPlayed.map(r => getSong(r.songId)).filter(Boolean).slice(0, MAX_RECENT_HOME);
  const block = $('#homeRecentBlock');
  const box = $('#homeRecent');
  if (block && box) {
    if (recent.length) {
      block.hidden = false;
      renderSongList(box, recent, '');
    } else {
      block.hidden = true;
      box.innerHTML = '';
    }
  }
}

function renderPlaylistsPage() {
  const grid = $('#playlistsGrid');
  const detail = $('#playlistDetail');
  const pl = state.playlistDetailId ? playlists.find(p => p.id === state.playlistDetailId) : null;

  if (pl) {
    grid.hidden = true;
    detail.hidden = false;
    $('#playlistDetailTitle').textContent = pl.name;
    renderSongList($('#playlistDetailSongs'), resolvePlaylistSongs(pl), 'This playlist is empty.',
      { isPlView: true, seeded: pl.seeded });
  } else {
    state.playlistDetailId = null;
    grid.hidden = false;
    detail.hidden = true;
    renderPlaylistGrid(grid, playlists);
  }
}

function renderFavorites() {
  const list = songs.filter(s => favorites.includes(s.id)).sort(compareSongTitles);
  renderSongList($('#favoritesList'), list, 'No favourites yet. Tap the heart on any song.');
}

function renderSearch() {
  const q = ($('#searchInput').value || '').trim().toLowerCase();
  const box = $('#searchResults');
  if (!q) {
    box._ids = [];
    box.innerHTML = '<div class="empty-state"><svg><use href="#i-search"/></svg>Type to search songs, artists or albums.</div>';
    return;
  }
  renderSongList(box, filterQ(songs, q), 'No matches found.');
}

function renderSettings() {
  $('#statSongs').textContent = songs.length;
  $('#statPlaylists').textContent = playlists.length;
  const t = $('#autoNextToggle');
  t.classList.toggle('on', state.autoNext);
  t.setAttribute('aria-checked', String(state.autoNext));
  $('#settingsVolume').value = state.volume;
  $('#volLabel').textContent = state.volume + '%';
  updateVolumeFill();
}

function filterQ(list, q) {
  if (!q) return list;
  return list.filter(s =>
    (s.title || '').toLowerCase().includes(q) ||
    (s.artist || '').toLowerCase().includes(q) ||
    (s.album || '').toLowerCase().includes(q) ||
    (s.altName && s.altName.some(a => (a || '').toLowerCase().includes(q)))
  );
}

// ==================== PLAYBACK ====================

function playFromList(ids, id) {
  currentQueue = Array.isArray(ids) && ids.length ? ids.filter(x => getSong(x)) : songs.map(s => s.id);
  playSong(id);
}

function playSong(id) {
  const song = getSong(id);
  if (!song) return;

  if (state.currentSongId !== id) {
    audio.src = song.file;
    state.currentSongId = id;
    addToRecent(id);
  }

  audio.play()
    .then(() => {
      state.isPlaying = true;
      song.available = true;
      updatePlaybackUI();
      saveState();
      trackEvent('song_play', {
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist || 'Unknown',
        song_album: song.album || 'Unknown',
        view: state.activeView,
        shuffle_enabled: state.shuffle,
        repeat_mode: state.repeat
      });
    })
    .catch((error) => {
      song.available = false;
      showError(`Could not play "${song.title}". File may be missing or unavailable.`);
      state.isPlaying = false;
      updatePlaybackUI();
      trackEvent('playback_error', {
        song_id: song.id,
        song_title: song.title,
        error_type: 'play_failed',
        error_message: error.message || 'Unknown error'
      });
    });
}

function pauseSong() {
  audio.pause();
  state.isPlaying = false;
  updatePlaybackUI();
  saveState();
  const song = getSong(state.currentSongId);
  if (song) {
    trackEvent('song_pause', {
      song_id: song.id,
      song_title: song.title,
      current_time: Math.floor(audio.currentTime),
      duration: Math.floor(audio.duration)
    });
  }
}

function togglePlay() {
  if (!state.currentSongId) {
    const first = currentQueue.find(id => { const s = getSong(id); return s && s.available !== false; });
    if (first) playSong(first);
    return;
  }
  state.isPlaying ? pauseSong() : playSong(state.currentSongId);
}

function availableQueue() {
  return currentQueue.filter(id => { const s = getSong(id); return s && s.available !== false; });
}

function nextSong(userInitiated = true) {
  const avail = availableQueue();
  if (!avail.length) return;

  if (userInitiated) {
    trackEvent('player_next', {
      from_song_id: state.currentSongId,
      shuffle_enabled: state.shuffle,
      repeat_mode: state.repeat
    });
  }

  if (state.shuffle && avail.length > 1) {
    const others = avail.filter(id => id !== state.currentSongId);
    playSong(others[Math.floor(Math.random() * others.length)]);
    return;
  }

  const idx = avail.indexOf(state.currentSongId);
  if (idx < avail.length - 1) playSong(avail[idx + 1]);
  else if (state.repeat === 'all') playSong(avail[0]);
  else { pauseSong(); audio.currentTime = 0; }
}

function prevSong() {
  if (audio.currentTime > 3) {
    trackEvent('player_restart', { song_id: state.currentSongId, current_time: Math.floor(audio.currentTime) });
    audio.currentTime = 0;
    return;
  }
  trackEvent('player_previous', { from_song_id: state.currentSongId, repeat_mode: state.repeat });

  const avail = availableQueue();
  if (!avail.length) return;
  const idx = avail.indexOf(state.currentSongId);
  if (idx > 0) playSong(avail[idx - 1]);
  else if (state.repeat === 'all') playSong(avail[avail.length - 1]);
  else audio.currentTime = 0;
}

// ==================== PLAYER UI ====================

function updatePlaybackUI() {
  const song = getSong(state.currentSongId);

  if (song) {
    $('#miniPlayer').hidden = false;
    $('#miniTitle').textContent = song.title || '—';
    $('#miniArtist').textContent = song.artist || '';
    setIcon($('#miniPlay'), state.isPlaying ? 'pause' : 'play');

    $('#fpTitle').textContent = song.title || '—';
    $('#fpArtist').textContent = song.artist || '';
    setIcon($('#btnPlay'), state.isPlaying ? 'pause' : 'play');
    $('#btnPlay').classList.toggle('playing', state.isPlaying);
    $('#fullFav').classList.toggle('on', favorites.includes(song.id));
  } else {
    $('#miniPlayer').hidden = true;
  }

  $$('.song-row').forEach(row => {
    row.classList.toggle('active', row.dataset.id === state.currentSongId);
  });

  renderQueue();
}

function updateRepeatBtn() {
  const btn = $('#btnRepeat');
  const mode = state.repeat;
  btn.classList.toggle('active', mode !== 'off');
  setIcon(btn, mode === 'one' ? 'repeat1' : 'repeat');
  btn.title = 'Repeat: ' + (mode === 'off' ? 'Off' : mode === 'all' ? 'All' : 'One');
}

function updateVolumeIcon() {
  const v = state.isMuted ? 0 : state.volume;
  setIcon($('#btnVolume'), v === 0 ? 'volume-x' : 'volume');
}

function updateVolumeFill() {
  const pct = state.isMuted ? 0 : state.volume;
  setRangeFill($('#volumeSlider'), pct);
  setRangeFill($('#settingsVolume'), pct);
}

function openFullPlayer() {
  $('#fullPlayer').hidden = false;
  document.body.style.overflow = 'hidden';
  renderQueue();
}

function closeFullPlayer() {
  $('#fullPlayer').hidden = true;
  document.body.style.overflow = '';
}

function exitPlayer() {
  try { audio.pause(); } catch (e) {}
  state.isPlaying = false;
  state.currentSongId = null;
  closeFullPlayer();
  updatePlaybackUI();
  saveState();
  try { window.close(); } catch (e) {}
}

function renderQueue() {
  const wrap = $('#fpQueueWrap');
  const q = $('#fpQueue');
  if (!wrap || !q) return;
  if (!currentQueue.length) { wrap.hidden = true; q.innerHTML = ''; return; }
  wrap.hidden = false;
  const list = currentQueue.slice(0, 200).map(id => {
    const s = getSong(id);
    if (!s) return '';
    const cur = id === state.currentSongId;
    return `<button class="fp-queue-item${cur ? ' current' : ''}" data-id="${id}">
      <svg><use href="#i-${cur && state.isPlaying ? 'volume' : 'music'}"/></svg>
      <span class="q-title">${esc(s.title)}</span>
      ${s.duration ? `<span class="q-dur">${fmt(s.duration)}</span>` : ''}
    </button>`;
  }).join('');
  q.innerHTML = list;
}

// ==================== CONTROLS ====================

function setupControls() {
  audio.volume = state.isMuted ? 0 : state.volume / 100;
  $('#volumeSlider').value = state.volume;
  updateVolumeFill();
  updateVolumeIcon();
  updateRepeatBtn();
  $('#btnShuffle').classList.toggle('active', state.shuffle);

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration || seeking) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    const input = $('#progressInput');
    input.value = pct * 10;
    setRangeFill(input, pct);
    $('#currentTime').textContent = fmt(audio.currentTime);
    $('#miniProgress').style.width = pct + '%';
    if (!audio.paused && Math.floor(audio.currentTime) % 5 === 0) saveState();
  });

  audio.addEventListener('loadedmetadata', () => {
    $('#duration').textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => {
    const song = getSong(state.currentSongId);
    if (song) {
      trackEvent('song_complete', {
        song_id: song.id,
        song_title: song.title,
        duration: Math.floor(audio.duration),
        repeat_mode: state.repeat,
        shuffle_enabled: state.shuffle
      });
    }
    if (state.repeat === 'one') {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    const avail = availableQueue();
    const idx = avail.indexOf(state.currentSongId);
    const canAdvance = idx > -1 && idx < avail.length - 1;
    if (state.repeat === 'all') nextSong(false);
    else if (state.autoNext && canAdvance) nextSong(false);
    else {
      state.isPlaying = false;
      audio.currentTime = 0;
      updatePlaybackUI();
      saveState();
    }
  });

  audio.addEventListener('error', () => {
    const song = getSong(state.currentSongId);
    if (song) {
      song.available = false;
      showError(`Error loading "${song.title}". File may be missing or corrupted.`);
      trackEvent('playback_error', { song_id: song.id, song_title: song.title, error_type: 'file_load_error' });
    } else {
      showError('Could not load file. Check that it exists in /media.');
      trackEvent('playback_error', { error_type: 'unknown_file' });
    }
    state.isPlaying = false;
    updatePlaybackUI();
  });

  const progress = $('#progressInput');
  const beginSeek = () => { seeking = true; };
  const commitSeek = () => {
    if (!audio.duration) { seeking = false; return; }
    const newTime = (progress.value / 1000) * audio.duration;
    const oldTime = audio.currentTime;
    if (Math.abs(newTime - oldTime) > 0.5) {
      let target = newTime;
      if (audio.seekable.length > 0) {
        target = Math.max(audio.seekable.start(0), Math.min(newTime, audio.seekable.end(0)));
      }
      try { audio.currentTime = target; } catch (_) {}
      const song = getSong(state.currentSongId);
      if (song) {
        trackEvent('player_seek', {
          song_id: song.id,
          from_time: Math.floor(oldTime),
          to_time: Math.floor(newTime),
          duration: Math.floor(audio.duration)
        });
      }
    }
    seeking = false;
  };

  progress.addEventListener('mousedown', beginSeek);
  progress.addEventListener('touchstart', beginSeek, { passive: true });
  progress.addEventListener('input', () => {
    if (!audio.duration) return;
    const pct = progress.value / 10;
    setRangeFill(progress, pct);
    $('#currentTime').textContent = fmt((progress.value / 1000) * audio.duration);
  });
  progress.addEventListener('change', commitSeek);
  progress.addEventListener('mouseup', commitSeek);
  progress.addEventListener('touchend', commitSeek);

  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnPrev').addEventListener('click', prevSong);
  $('#btnNext').addEventListener('click', () => nextSong());

  $('#btnShuffle').addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    $('#btnShuffle').classList.toggle('active', state.shuffle);
    saveState();
    trackEvent('shuffle_toggle', { enabled: state.shuffle });
  });

  $('#btnRepeat').addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
    updateRepeatBtn();
    saveState();
    trackEvent('repeat_toggle', { mode: state.repeat });
  });

  $('#btnVolume').addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    audio.volume = state.isMuted ? 0 : state.volume / 100;
    updateVolumeIcon();
    updateVolumeFill();
    saveState();
    trackEvent('volume_mute', { muted: state.isMuted });
  });

  let volumeChangeTimeout;
  const onVolume = (v) => {
    state.volume = parseInt(v, 10);
    state.isMuted = false;
    audio.volume = state.volume / 100;
    $('#volumeSlider').value = state.volume;
    $('#settingsVolume').value = state.volume;
    $('#volLabel').textContent = state.volume + '%';
    updateVolumeIcon();
    updateVolumeFill();
    saveState();
  };
  $('#volumeSlider').addEventListener('input', (e) => {
    onVolume(e.target.value);
    clearTimeout(volumeChangeTimeout);
    volumeChangeTimeout = setTimeout(() => trackEvent('volume_change', { volume: state.volume }), 500);
  });
  $('#settingsVolume').addEventListener('input', (e) => onVolume(e.target.value));
}

function restoreState() {
  currentQueue = songs.map(s => s.id);
  if (state.currentSongId) {
    const song = getSong(state.currentSongId);
    if (song && song.available) {
      audio.src = song.file;
      if (state.savedTime && state.savedTime > 0) {
        audio.addEventListener('loadedmetadata', function restoreTime() {
          if (state.savedTime < audio.duration) audio.currentTime = state.savedTime;
          state.savedTime = 0;
        }, { once: true });
      }
    } else {
      state.currentSongId = null;
    }
  }
  updatePlaybackUI();
}

// ==================== FAVORITES ====================

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  const adding = idx === -1;
  if (adding) favorites.push(id); else favorites.splice(idx, 1);
  saveFavorites();

  const song = getSong(id);
  if (song) {
    trackEvent(adding ? 'favorite_add' : 'favorite_remove', {
      song_id: song.id, song_title: song.title, total_favorites: favorites.length
    });
  }

  if (state.activeView === 'favorites') renderFavorites();
  else $$(`.song-action.fav[data-fav="${id}"]`).forEach(b => b.classList.toggle('on', adding));

  if (state.currentSongId === id) $('#fullFav').classList.toggle('on', adding);
}

// ==================== PLAYLISTS CRUD ====================

function createPlaylist(name) {
  const pl = { id: 'pl-' + Date.now(), name: name.trim(), songIds: [], userOrdered: true };
  playlists.push(pl);
  sortPlaylists();
  savePlaylists();
  trackEvent('playlist_create', {
    playlist_id: pl.id, playlist_name: pl.name,
    total_playlists: playlists.filter(p => !p.seeded).length
  });
  return pl;
}

function renamePlaylist(id, name) {
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  const oldName = pl.name;
  pl.name = name.trim();
  sortPlaylists();
  savePlaylists();
  trackEvent('playlist_rename', { playlist_id: id, old_name: oldName, new_name: pl.name });
  if (state.activeView === 'playlists' && state.playlistDetailId === id) renderPlaylistsPage();
}

function deletePlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  playlists = playlists.filter(p => p.id !== id);
  savePlaylists();
  if (pl) {
    trackEvent('playlist_delete', {
      playlist_id: id, playlist_name: pl.name, song_count: pl.songIds.length,
      total_playlists: playlists.filter(p => !p.seeded).length
    });
  }
  if (state.playlistDetailId === id) {
    state.playlistDetailId = null;
    renderPlaylistsPage();
  } else if (state.activeView === 'playlists') {
    renderPlaylistsPage();
  } else if (state.activeView === 'home') {
    renderHome();
  }
}

function removeSongFromPL(plId, songId) {
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  const song = getSong(songId);
  pl.songIds = pl.songIds.filter(id => id !== songId);
  savePlaylists();
  if (song) {
    trackEvent('playlist_remove_song', {
      playlist_id: plId, playlist_name: pl.name, song_id: songId,
      song_title: song.title, remaining_songs: pl.songIds.length
    });
  }
  if (state.activeView === 'playlists' && state.playlistDetailId === plId) renderPlaylistsPage();
}

// ==================== RECENTLY PLAYED ====================

function addToRecent(songId) {
  recentlyPlayed = recentlyPlayed.filter(r => r.songId !== songId);
  recentlyPlayed.unshift({ songId, playedAt: Date.now() });
  if (recentlyPlayed.length > MAX_RECENT) recentlyPlayed = recentlyPlayed.slice(0, MAX_RECENT);
  saveRecent();
  if (state.activeView === 'home') renderHome();
}

// ==================== DOWNLOAD ====================

function getSongDownloadName(song) {
  try {
    const fromUrl = decodeURIComponent(new URL(song.file, location.href).pathname.split('/').pop() || '');
    if (/\.(mp3|m4a|wav|ogg)$/i.test(fromUrl)) return fromUrl;
  } catch (_) {}
  const safe = (song.title || 'song').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'song';
  return `${safe}.mp3`;
}

async function downloadSong(songId) {
  const song = getSong(songId);
  if (!song?.file) { showError('Song file not found.'); return; }
  if (song.available === false) { showError(`"${song.title}" is not available to download.`); return; }

  const filename = getSongDownloadName(song);
  showError('Preparing download…');

  const triggerDownload = (href, blobUrl) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    showError('');
    trackEvent('download_song', { song_id: songId, song_title: song.title });
  };

  try {
    const res = await fetch(song.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    triggerDownload(blobUrl, blobUrl);
  } catch {
    triggerDownload(song.file);
  }
}

// ==================== CONTEXT MENUS ====================

function showSongCtx(event, songId, isPlView) {
  const menu = $('#contextMenu');
  const activePl = playlists.find(p => p.id === state.playlistDetailId);
  let html = `<button class="ctx-item" data-action="download" data-sid="${songId}"><svg><use href="#i-download"/></svg>Download</button>`;
  html += `<button class="ctx-item" data-action="add" data-sid="${songId}"><svg><use href="#i-list"/></svg>Add to Playlist</button>`;
  if (isPlView && state.playlistDetailId && activePl && !activePl.seeded) {
    html += `<button class="ctx-item danger" data-action="remove" data-sid="${songId}"><svg><use href="#i-trash"/></svg>Remove from Playlist</button>`;
  }
  menu.innerHTML = html;
  menu.querySelectorAll('.ctx-item').forEach(b => b.addEventListener('click', () => {
    const { action, sid } = b.dataset;
    if (action === 'download') downloadSong(sid);
    else if (action === 'add') openAddToPL(sid);
    else removeSongFromPL(state.playlistDetailId, sid);
    closeCtx();
  }));
  posCtx(menu, event);
}

function showPLCtx(event, plId) {
  closeCtx();
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
  const menuWidth = 200;
  const menuHeight = Math.min(260, 44 * menu.querySelectorAll('.ctx-item').length + 16);
  let left = e.clientX;
  let top = e.clientY;
  if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
  if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 10;
  left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
  top = Math.max(10, Math.min(top, window.innerHeight - menuHeight - 10));
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}

function closeCtx() { $('#contextMenu').classList.remove('open'); }

// ==================== MODALS ====================

function openModal(id) { closeCtx(); document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function openAddToPL(songId) {
  addToPlaylistSongId = songId;
  const c = $('#playlistCheckboxes');
  const userPlaylists = playlists.filter(pl => !pl.seeded);
  c.innerHTML = userPlaylists.length
    ? userPlaylists.map(pl => `<label class="pl-check"><input type="checkbox" value="${pl.id}" ${pl.songIds.includes(songId) ? 'checked' : ''}>${esc(pl.name)}</label>`).join('')
    : '<p class="muted-text">No playlists yet.</p>';
  openModal('addToPlaylistModal');
}

function saveAddToPL() {
  if (!addToPlaylistSongId) return;
  const song = getSong(addToPlaylistSongId);
  const addedTo = [];
  $$('#playlistCheckboxes input[type="checkbox"]').forEach(cb => {
    const pl = playlists.find(p => p.id === cb.value);
    if (!pl) return;
    if (cb.checked && !pl.songIds.includes(addToPlaylistSongId)) {
      pl.songIds.push(addToPlaylistSongId);
      addedTo.push(pl.name);
    } else if (!cb.checked && pl.songIds.includes(addToPlaylistSongId)) {
      pl.songIds = pl.songIds.filter(id => id !== addToPlaylistSongId);
    }
  });
  savePlaylists();
  if (song && addedTo.length > 0) {
    trackEvent('playlist_add_song', {
      song_id: song.id, song_title: song.title,
      playlists_added: addedTo.join(', '), count: addedTo.length
    });
  }
  closeModal('addToPlaylistModal');
  addToPlaylistSongId = null;
  if (state.activeView === 'playlists') renderPlaylistsPage();
}

function openNewPL(fromModal) {
  editingPlaylistId = null;
  $('#playlistNameTitle').textContent = 'New Playlist';
  const userPlaylists = playlists.filter(p => !p.seeded && /^\d{4}\s/.test(p.name));
  let maxNumber = 0;
  userPlaylists.forEach(p => {
    const match = p.name.match(/^(\d{4})\s/);
    if (match) { const num = parseInt(match[1]); if (num > maxNumber) maxNumber = num; }
  });
  $('#playlistNameInput').value = String(maxNumber + 1).padStart(4, '0') + ' ';
  if (fromModal) closeModal('addToPlaylistModal');
  openModal('playlistNameModal');
  setTimeout(() => {
    const input = $('#playlistNameInput');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, 100);
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
  if (editingPlaylistId) {
    renamePlaylist(editingPlaylistId, name);
    editingPlaylistId = null;
  } else {
    const pl = createPlaylist(name);
    if (addToPlaylistSongId) {
      pl.songIds.push(addToPlaylistSongId);
      savePlaylists();
      closeModal('playlistNameModal');
      openAddToPL(addToPlaylistSongId);
      return;
    }
  }
  closeModal('playlistNameModal');
  if (state.activeView === 'playlists') renderPlaylistsPage();
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
  document.documentElement.setAttribute('data-theme', theme.scheme);
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.scheme === theme.scheme));
  updateVolumeFill();
}

function setTheme(scheme) {
  const old = theme.scheme;
  theme.scheme = scheme;
  applyTheme();
  saveTheme();
  if (scheme !== old) trackEvent('theme_change', { old_theme: old, new_theme: scheme });
}

function renderThemeCards() {
  const c = $('#themeOptions');
  if (!c) return;
  c.innerHTML = THEMES.map(t => `<button class="theme-card${t.id === theme.scheme ? ' active' : ''}" data-scheme="${t.id}" title="${t.name}">
    <span class="theme-swatch"><span style="background:${t.dot}"></span><span style="background:${t.swatch2}"></span></span>
    <span class="theme-name">${t.name}</span>
    <span class="theme-check"><svg><use href="#i-check"/></svg></span>
  </button>`).join('');
  c.querySelectorAll('.theme-card').forEach(el => el.addEventListener('click', () => setTheme(el.dataset.scheme)));
}

// ==================== STORAGE ====================

function saveState() {
  localStorage.setItem(STORAGE.STATE, JSON.stringify({
    currentSongId: state.currentSongId,
    currentTime: audio.currentTime || 0,
    volume: state.volume,
    isMuted: state.isMuted,
    shuffle: state.shuffle,
    repeat: state.repeat,
    autoNext: state.autoNext
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
      state.savedTime = s.currentTime || 0;
      state.volume = s.volume ?? 80;
      state.isMuted = s.isMuted || false;
      state.shuffle = s.shuffle || false;
      state.repeat = s.repeat || 'off';
      state.autoNext = s.autoNext !== false;
    }
  } catch {}
  try { favorites = JSON.parse(localStorage.getItem(STORAGE.FAVORITES)) || []; } catch { favorites = []; }
  try { playlists = JSON.parse(localStorage.getItem(STORAGE.PLAYLISTS)) || []; } catch { playlists = []; }
  try { recentlyPlayed = JSON.parse(localStorage.getItem(STORAGE.RECENT)) || []; } catch { recentlyPlayed = []; }
  try { const t = JSON.parse(localStorage.getItem(STORAGE.THEME)); if (t && t.scheme) theme = t; } catch {}
}

function clearAllData() {
  const confirmed = confirm(
    '⚠️ WARNING: This will delete ALL user data:\n\n' +
    '• User-created playlists (0001, 0002, etc.)\n' +
    '• Favorites\n' +
    '• Recently played history\n' +
    '• Theme preferences\n\n' +
    'Seeded playlists from folders (0000, 0101, etc.) will NOT be deleted.\n\n' +
    'This action CANNOT be undone!\n\n' +
    'Do you want to continue?'
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE.STATE);
  localStorage.removeItem(STORAGE.FAVORITES);
  localStorage.removeItem(STORAGE.PLAYLISTS);
  localStorage.removeItem(STORAGE.RECENT);
  localStorage.removeItem(STORAGE.THEME);

  trackEvent('data_clear', {
    favorites_count: favorites.length,
    playlists_count: playlists.filter(p => !p.seeded).length,
    recent_count: recentlyPlayed.length
  });

  alert('All user data has been cleared. The page will now reload.');
  window.location.reload();
}

// ==================== EVENTS ====================

function toggleClearButton(input, btn) {
  if (input && btn) btn.hidden = !input.value;
}

function setupEvents() {
  $$('[data-nav]').forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(el.dataset.nav);
  }));

  $('#btnBackToPlaylists').addEventListener('click', () => {
    state.playlistDetailId = null;
    renderPlaylistsPage();
  });

  // Search (page)
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    renderSearch();
    toggleClearButton(searchInput, searchClear);
    const q = e.target.value.trim();
    if (q.length >= 2) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => trackEvent('search', { query: q, view: 'search', query_length: q.length }), 1000);
    }
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    renderSearch();
    toggleClearButton(searchInput, searchClear);
  });
  $('#pageSearchForm').addEventListener('submit', (e) => e.preventDefault());

  // Full player home
  const btnFullHome = $('#btnFullHome');
  if (btnFullHome) btnFullHome.addEventListener('click', () => { closeFullPlayer(); navigate('home'); });

  // Mini player
  $('#miniOpen').addEventListener('click', (e) => {
    if (e.target.closest('#miniPlay')) { e.stopPropagation(); togglePlay(); return; }
    if (e.target.closest('#miniNext')) { e.stopPropagation(); nextSong(); return; }
    openFullPlayer();
  });

  // Full player
  $('#btnCloseFull').addEventListener('click', closeFullPlayer);
  $('#btnExitPlayer').addEventListener('click', exitPlayer);
  $('#fullFav').addEventListener('click', () => { if (state.currentSongId) toggleFavorite(state.currentSongId); });
  $('#fpQueue').addEventListener('click', (e) => {
    const item = e.target.closest('.fp-queue-item');
    if (item) playFromList(currentQueue, item.dataset.id);
  });

  // Settings
  $('#btnNewPlaylist').addEventListener('click', () => openNewPL(false));
  $('#btnClearData').addEventListener('click', clearAllData);
  $('#btnHelp').addEventListener('click', () => openModal('helpModal'));
  $('#autoNextToggle').addEventListener('click', () => {
    state.autoNext = !state.autoNext;
    $('#autoNextToggle').classList.toggle('on', state.autoNext);
    $('#autoNextToggle').setAttribute('aria-checked', String(state.autoNext));
    saveState();
    trackEvent('autonext_toggle', { enabled: state.autoNext });
  });

  // Modals
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); }));

  $('#btnDoneAddToPlaylist').addEventListener('click', saveAddToPL);
  $('#btnCreateFromModal').addEventListener('click', () => openNewPL(true));
  $('#btnSavePlaylistName').addEventListener('click', savePLName);
  $('#playlistNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') savePLName(); });
  $('#btnConfirmDelete').addEventListener('click', confirmDelete);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('[data-menu]') && !e.target.closest('[data-plmenu]')) closeCtx();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($('#fullPlayer').hidden === false) { closeFullPlayer(); return; }
    closeCtx();
    $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  });

  window.addEventListener('beforeunload', saveState);
}

// ==================== VERSION INFO ====================

function displayLastUpdated(dateString) {
  const el = $('#statUpdated');
  if (!el) return;
  if (!dateString) { el.textContent = 'Unknown'; return; }
  try {
    const date = new Date(dateString);
    el.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    el.textContent = String(dateString);
  }
}

// ==================== AUTO UPDATE CHECKER ====================

function startDataUpdateChecker() {
  setInterval(checkForDataUpdates, 30000);
}

async function checkForDataUpdates() {
  try {
    const response = await fetch(`data/config.json?t=${Date.now()}`);
    if (!response.ok) return;
    const data = await response.json();
    const latestVersion = data.lastUpdated;
    if (!currentDataVersion) { currentDataVersion = latestVersion; return; }
    if (latestVersion && latestVersion !== currentDataVersion) showUpdateNotification();
  } catch (e) {
    console.error('Error checking for updates:', e);
  }
}

function showUpdateNotification() {
  let notification = document.getElementById('updateNotification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'updateNotification';
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🔄</span>
        <span class="update-text">New songs available!</span>
        <button class="update-btn" onclick="reloadPage()">Refresh</button>
        <button class="update-close" onclick="closeUpdateNotification()">×</button>
      </div>`;
    document.body.appendChild(notification);
  }
  setTimeout(() => notification.classList.add('show'), 100);
  trackEvent('update_notification_shown', { old_version: currentDataVersion, new_version: 'detected' });
}

function closeUpdateNotification() {
  const notification = document.getElementById('updateNotification');
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
}

function reloadPage() {
  trackEvent('manual_reload', { source: 'update_notification' });
  window.location.reload(true);
}
