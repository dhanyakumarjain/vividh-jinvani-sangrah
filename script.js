/* ══════════════════════════════════════════════════════════════
   जिनवाणी संग्रह — Music Player
   Vanilla JS · No frameworks · GitHub Pages ready
══════════════════════════════════════════════════════════════ */

// ── DOM refs ────────────────────────────────────────────────
const audio          = document.getElementById('audio');
const songListEl     = document.getElementById('song-list');
const searchEl       = document.getElementById('search');
const playerTitleEl  = document.getElementById('player-title');
const progressFill   = document.getElementById('progress-fill');
const progressThumb  = document.getElementById('progress-thumb');
const progressTrack  = document.getElementById('progress-track');
const curTimeEl      = document.getElementById('cur-time');
const durTimeEl      = document.getElementById('dur-time');
const btnPlayPause   = document.getElementById('btn-play-pause');
const btnPrev        = document.getElementById('btn-prev');
const btnNext        = document.getElementById('btn-next');
const btnFav         = document.getElementById('btn-fav');
const btnMode        = document.getElementById('btn-mode');
const volumeEl       = document.getElementById('volume');
const albumArt       = document.getElementById('album-art');
const errorMsgEl     = document.getElementById('error-msg');
const emptyStateEl   = document.getElementById('empty-state');
const waveCanvas     = document.getElementById('waveform');
const waveCtx        = waveCanvas.getContext('2d');
const btnTheme       = document.getElementById('btn-theme');
const btnExport      = document.getElementById('btn-export');
const btnImportTrig  = document.getElementById('btn-import-trigger');
const btnImport      = document.getElementById('btn-import');
const tabs           = document.querySelectorAll('.tab');
const playlistPanel  = document.getElementById('playlist-panel');
const newPlaylistName= document.getElementById('new-playlist-name');
const btnCreatePL    = document.getElementById('btn-create-playlist');
const playlistListEl = document.getElementById('playlist-list');
const playlistSelect = document.getElementById('playlist-select');
const btnAddToPL     = document.getElementById('btn-add-to-playlist');
const plSongsView    = document.getElementById('playlist-songs-view');
const plSongsTitle   = document.getElementById('playlist-songs-title');
const plSongsList    = document.getElementById('playlist-songs-list');
const btnBackPL      = document.getElementById('btn-back-playlists');
const btnPlayPL      = document.getElementById('btn-play-playlist');
const btnShufflePL   = document.getElementById('btn-shuffle-playlist');
const miniPlayer     = document.getElementById('mini-player');
const miniTitle      = document.getElementById('mini-title');
const miniPlay       = document.getElementById('mini-play');
const miniPrev       = document.getElementById('mini-prev');
const miniNext       = document.getElementById('mini-next');
const miniProgressFill = document.getElementById('mini-progress-fill');
const miniExpand     = document.getElementById('mini-expand');

// ── State ────────────────────────────────────────────────────
let unavailable  = new Set();   // song ids whose file is missing
let library      = [];          // all songs from media.json
let filtered     = [];          // currently displayed list
let currentIndex = -1;          // index in `queue`
let queue        = [];          // active playback queue (song ids)
let isPlaying    = false;
let activeTab    = 'all';
let activePLId   = null;        // currently viewed playlist id

// Playback modes: sequential | shuffle | repeat-all | repeat-one
const MODES = ['sequential','shuffle','repeat-all','repeat-one'];
const MODE_ICONS = { sequential:'🔁', shuffle:'🔀', 'repeat-all':'🔁', 'repeat-one':'🔂' };
let modeIndex = 0;

// ── LocalStorage helpers ─────────────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

let favorites      = LS.get('favorites', []);
let playlists      = LS.get('playlists', []);
let recentlyPlayed = LS.get('recentlyPlayed', []);
let theme          = LS.get('theme', null);
let savedVolume    = LS.get('volumeLevel', 1);
let savedMode      = LS.get('playMode', 0);
let lastSongId     = LS.get('lastPlayedSong', null);
let lastTime       = LS.get('lastPlaybackTime', 0);

// ── Init ─────────────────────────────────────────────────────
async function init() {
  applyTheme(theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  audio.volume = savedVolume;
  volumeEl.value = savedVolume;
  modeIndex = savedMode;
  updateModeBtn();

  try {
    const res = await fetch('media.json');
    if (!res.ok) throw new Error('media.json not found');
    library = await res.json();
    if (!Array.isArray(library) || library.length === 0) throw new Error('media.json is empty or invalid');
  } catch (e) {
    showError('⚠ ' + e.message);
    return;
  }

  queue = library.map(s => s.id);
  filtered = [...library];

  // Check which files actually exist (HEAD request per song)
  await checkAvailability();

  renderSongList(filtered);
  renderPlaylistSelect();
  renderPlaylistList();

  // Restore last played song
  if (lastSongId) {
    const idx = queue.indexOf(lastSongId);
    if (idx !== -1) {
      currentIndex = idx;
      loadSong(currentIndex, false);
      audio.currentTime = lastTime || 0;
    }
  }

  // Show mini player if a song is loaded
  if (currentIndex !== -1) showMiniPlayer();
}

// ── Availability check ────────────────────────────────────────
// Fires a HEAD request for every song; marks missing ones in `unavailable`
async function checkAvailability() {
  await Promise.all(library.map(async (song) => {
    try {
      const res = await fetch(encodeFilePath(song.filePath), { method: 'HEAD' });
      if (!res.ok) unavailable.add(song.id);
    } catch {
      unavailable.add(song.id);
    }
  }));
}

// ── Theme ────────────────────────────────────────────────────
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  btnTheme.textContent = t === 'dark' ? '☀' : '🌙';
  LS.set('theme', t);
}
btnTheme.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));

// ── Render song list ─────────────────────────────────────────
function renderSongList(songs, query = '') {
  songListEl.innerHTML = '';
  const show = songs.length > 0;
  emptyStateEl.hidden = show;
  songListEl.hidden = !show;

  songs.forEach((song, i) => {
    const li = document.createElement('li');
    const isUnavailable = unavailable.has(song.id);
    li.className = 'song-item' + (isUnavailable ? ' unavailable' : '');
    li.dataset.id = song.id;
    if (song.id === currentSongId()) li.classList.add('active', 'playing');

    const isFav = favorites.includes(song.id);
    const name  = query ? highlight(song.displayName, query) : escHtml(song.displayName);
    const tag   = isUnavailable ? '<span class="tag-unavailable">NOT AVAILABLE</span>' : '';

    li.innerHTML = `
      <span class="song-item-num">${i + 1}</span>
      <span class="song-item-name">${name}${tag}</span>
      <button class="song-item-fav ${isFav ? 'active' : ''}" data-id="${song.id}" title="Favorite"
        ${isUnavailable ? 'disabled' : ''}>
        ${isFav ? '❤' : '🤍'}
      </button>`;

    li.addEventListener('click', (e) => {
      if (e.target.closest('.song-item-fav')) return;
      if (isUnavailable) return;           // block click on unavailable
      const globalIdx = queue.indexOf(song.id);
      if (globalIdx !== -1) {
        currentIndex = globalIdx;
        loadSong(currentIndex, true);
      }
    });

    li.querySelector('.song-item-fav').addEventListener('click', () => toggleFav(song.id));
    songListEl.appendChild(li);
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function highlight(text, query) {
  const safe = escHtml(text);
  const re = new RegExp(`(${escHtml(query).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return safe.replace(re, '<mark>$1</mark>');
}

// ── Search ───────────────────────────────────────────────────
searchEl.addEventListener('input', () => {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) {
    filtered = getTabSongs();
    renderSongList(filtered);
    return;
  }
  filtered = getTabSongs().filter(s =>
    s.displayName.toLowerCase().includes(q) ||
    (s.alternateNames || []).some(a => a.toLowerCase().includes(q))
  );
  renderSongList(filtered, q);
});

// ── Tabs ─────────────────────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    searchEl.value = '';
    playlistPanel.hidden = activeTab !== 'playlists';
    songListEl.hidden = activeTab === 'playlists';
    emptyStateEl.hidden = true;

    if (activeTab !== 'playlists') {
      filtered = getTabSongs();
      renderSongList(filtered);
    } else {
      plSongsView.hidden = true;
      renderPlaylistList();
    }
  });
});

function getTabSongs() {
  if (activeTab === 'favorites') return library.filter(s => favorites.includes(s.id));
  if (activeTab === 'recent')    return recentlyPlayed.map(id => library.find(s => s.id === id)).filter(Boolean);
  return library;
}

// ── Load & Play ───────────────────────────────────────────────
function loadSong(queueIdx, autoPlay = false) {
  clearError();
  currentIndex = queueIdx;
  const song = getSongByQueueIdx(queueIdx);
  if (!song) return;

  // If song file is missing, show error and skip
  if (unavailable.has(song.id)) {
    showError('⚠ File not available: ' + song.displayName);
    if (autoPlay) playNext();   // auto-skip to next available
    return;
  }

  audio.src = encodeFilePath(song.filePath);
  playerTitleEl.textContent = song.displayName;
  miniTitle.textContent = song.displayName;

  updateFavBtn(song.id);
  highlightActive(song.id);
  showMiniPlayer();

  // Persist
  LS.set('lastPlayedSong', song.id);
  LS.set('lastPlaybackTime', 0);
  addToRecent(song.id);

  if (autoPlay) {
    audio.play().catch(e => showError('⚠ ' + e.message));
  }
}

function encodeFilePath(path) {
  // Encode only the filename part, keep the folder prefix intact
  const slash = path.lastIndexOf('/');
  const folder = path.substring(0, slash + 1);
  const file   = path.substring(slash + 1);
  return folder + encodeURIComponent(file);
}

function getSongByQueueIdx(idx) {
  const id = queue[idx];
  return library.find(s => s.id === id) || null;
}
function currentSongId() {
  return queue[currentIndex] || null;
}

function highlightActive(id) {
  document.querySelectorAll('.song-item').forEach(li => {
    const active = li.dataset.id === id;
    li.classList.toggle('active', active);
    li.classList.toggle('playing', active);
  });
}

// ── Play / Pause ─────────────────────────────────────────────
function togglePlayPause() {
  if (currentIndex === -1) { loadSong(0, true); return; }
  if (isPlaying) audio.pause(); else audio.play().catch(e => showError('⚠ ' + e.message));
}
btnPlayPause.addEventListener('click', togglePlayPause);
miniPlay.addEventListener('click', togglePlayPause);

audio.addEventListener('play',  () => { isPlaying = true;  setPlayIcon(true);  albumArt.classList.add('spinning'); });
audio.addEventListener('pause', () => { isPlaying = false; setPlayIcon(false); albumArt.classList.remove('spinning'); });

function setPlayIcon(playing) {
  const icon = playing ? '⏸' : '▶';
  btnPlayPause.textContent = icon;
  miniPlay.textContent = icon;
}

// ── Next / Prev ───────────────────────────────────────────────
function playNext() {
  if (queue.length === 0) return;
  const mode = MODES[modeIndex];
  if (mode === 'repeat-one' && !unavailable.has(currentSongId())) {
    audio.currentTime = 0; audio.play(); return;
  }

  // Find next available song (guard against all-unavailable infinite loop)
  let tries = 0;
  do {
    if (mode === 'shuffle') currentIndex = Math.floor(Math.random() * queue.length);
    else                    currentIndex = (currentIndex + 1) % queue.length;
    tries++;
  } while (unavailable.has(queue[currentIndex]) && tries < queue.length);

  if (tries >= queue.length && unavailable.has(queue[currentIndex])) {
    showError('⚠ No available songs to play.'); return;
  }
  loadSong(currentIndex, true);
}

function playPrev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }

  let tries = 0;
  do {
    currentIndex = (currentIndex - 1 + queue.length) % queue.length;
    tries++;
  } while (unavailable.has(queue[currentIndex]) && tries < queue.length);

  loadSong(currentIndex, isPlaying);
}
btnNext.addEventListener('click', playNext);
btnPrev.addEventListener('click', playPrev);
miniNext.addEventListener('click', playNext);
miniPrev.addEventListener('click', playPrev);

audio.addEventListener('ended', () => {
  const mode = MODES[modeIndex];
  if (mode === 'repeat-one') { audio.play(); return; }
  playNext();
});

// ── Playback mode ─────────────────────────────────────────────
function updateModeBtn() {
  const mode = MODES[modeIndex];
  btnMode.textContent = MODE_ICONS[mode];
  btnMode.title = mode;
}
btnMode.addEventListener('click', () => {
  modeIndex = (modeIndex + 1) % MODES.length;
  updateModeBtn();
  LS.set('playMode', modeIndex);
});

// ── Progress ──────────────────────────────────────────────────
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  miniProgressFill.style.width = pct + '%';
  curTimeEl.textContent = fmt(audio.currentTime);
  LS.set('lastPlaybackTime', audio.currentTime);
  drawWaveform(pct / 100);
});
audio.addEventListener('loadedmetadata', () => {
  durTimeEl.textContent = fmt(audio.duration);
});

// Seek
progressTrack.addEventListener('click', seek);
progressTrack.addEventListener('mousedown', (e) => {
  const move = (ev) => seek(ev);
  const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});
function seek(e) {
  if (!audio.duration) return;
  const rect = progressTrack.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
}

function fmt(s) {
  if (isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

// ── Volume ────────────────────────────────────────────────────
volumeEl.addEventListener('input', () => {
  audio.volume = volumeEl.value;
  LS.set('volumeLevel', audio.volume);
});

// ── Waveform (animated bars synced to progress) ───────────────
// Generates a deterministic fake waveform per song, animates fill
let waveformBars = [];
function generateWaveform(seed) {
  // Pseudo-random bars based on song index as seed
  waveformBars = Array.from({ length: 60 }, (_, i) => {
    const x = Math.sin(i * 0.4 + seed) * 0.5 + 0.5;
    return 0.15 + x * 0.85;
  });
}
function drawWaveform(progress) {
  const W = waveCanvas.width  = waveCanvas.offsetWidth;
  const H = waveCanvas.height = 48;
  waveCtx.clearRect(0, 0, W, H);
  const n    = waveformBars.length;
  const bw   = W / n;
  const gap  = 1;
  waveformBars.forEach((h, i) => {
    const x    = i * bw;
    const barH = h * H;
    const y    = (H - barH) / 2;
    const done = i / n <= progress;
    waveCtx.fillStyle = done
      ? getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--surface2').trim();
    waveCtx.beginPath();
    waveCtx.roundRect(x + gap/2, y, bw - gap, barH, 2);
    waveCtx.fill();
  });
}

// ── Favorites ─────────────────────────────────────────────────
function toggleFav(id) {
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id); else favorites.splice(idx, 1);
  LS.set('favorites', favorites);
  updateFavBtn(id);
  // Refresh fav icons in list
  document.querySelectorAll(`.song-item-fav[data-id="${id}"]`).forEach(btn => {
    const on = favorites.includes(id);
    btn.classList.toggle('active', on);
    btn.textContent = on ? '❤' : '🤍';
  });
  if (activeTab === 'favorites') { filtered = getTabSongs(); renderSongList(filtered); }
}
function updateFavBtn(id) {
  const on = favorites.includes(id);
  btnFav.classList.toggle('active', on);
  btnFav.textContent = on ? '❤' : '🤍';
}
btnFav.addEventListener('click', () => { if (currentSongId()) toggleFav(currentSongId()); });

// ── Recently Played ───────────────────────────────────────────
function addToRecent(id) {
  recentlyPlayed = [id, ...recentlyPlayed.filter(x => x !== id)].slice(0, 20);
  LS.set('recentlyPlayed', recentlyPlayed);
}

// ── Playlists ─────────────────────────────────────────────────
function renderPlaylistList() {
  playlistListEl.innerHTML = '';
  plSongsView.hidden = true;
  if (playlists.length === 0) {
    playlistListEl.innerHTML = '<li style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem">No playlists yet.</li>';
    return;
  }
  playlists.forEach(pl => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="playlist-item-name">📋 ${escHtml(pl.name)} <small style="color:var(--text-muted)">(${pl.songs.length})</small></span>
      <button class="btn-delete-playlist" data-id="${pl.id}" title="Delete">🗑</button>`;
    li.querySelector('.playlist-item-name').addEventListener('click', () => openPlaylist(pl.id));
    li.querySelector('.btn-delete-playlist').addEventListener('click', (e) => {
      e.stopPropagation();
      playlists = playlists.filter(p => p.id !== pl.id);
      LS.set('playlists', playlists);
      renderPlaylistList();
      renderPlaylistSelect();
    });
    playlistListEl.appendChild(li);
  });
}

function openPlaylist(id) {
  activePLId = id;
  const pl = playlists.find(p => p.id === id);
  if (!pl) return;
  plSongsView.hidden = false;
  plSongsTitle.textContent = pl.name;
  plSongsList.innerHTML = '';
  pl.songs.forEach(sid => {
    const song = library.find(s => s.id === sid);
    if (!song) return;
    const li = document.createElement('li');
    li.innerHTML = `<span>${escHtml(song.displayName)}</span>
      <button class="btn-remove-from-playlist" data-sid="${sid}" title="Remove">✕</button>`;
    li.querySelector('span').addEventListener('click', () => {
      queue = pl.songs;
      currentIndex = pl.songs.indexOf(sid);
      loadSong(currentIndex, true);
    });
    li.querySelector('.btn-remove-from-playlist').addEventListener('click', () => {
      pl.songs = pl.songs.filter(x => x !== sid);
      LS.set('playlists', playlists);
      openPlaylist(id);
    });
    plSongsList.appendChild(li);
  });
}

btnBackPL.addEventListener('click', () => { plSongsView.hidden = true; activePLId = null; });

btnPlayPL.addEventListener('click', () => {
  const pl = playlists.find(p => p.id === activePLId);
  if (!pl || pl.songs.length === 0) return;
  queue = [...pl.songs];
  currentIndex = 0;
  loadSong(0, true);
});

btnShufflePL.addEventListener('click', () => {
  const pl = playlists.find(p => p.id === activePLId);
  if (!pl || pl.songs.length === 0) return;
  queue = shuffle([...pl.songs]);
  currentIndex = 0;
  loadSong(0, true);
});

btnCreatePL.addEventListener('click', () => {
  const name = newPlaylistName.value.trim();
  if (!name) return;
  playlists.push({ id: 'pl_' + Date.now(), name, songs: [] });
  LS.set('playlists', playlists);
  newPlaylistName.value = '';
  renderPlaylistList();
  renderPlaylistSelect();
});

function renderPlaylistSelect() {
  playlistSelect.innerHTML = '<option value="">+ Add to playlist…</option>';
  playlists.forEach(pl => {
    const opt = document.createElement('option');
    opt.value = pl.id;
    opt.textContent = pl.name;
    playlistSelect.appendChild(opt);
  });
}

btnAddToPL.addEventListener('click', () => {
  const plId = playlistSelect.value;
  const sid  = currentSongId();
  if (!plId || !sid) return;
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  if (!pl.songs.includes(sid)) { pl.songs.push(sid); LS.set('playlists', playlists); }
  playlistSelect.value = '';
});

// ── Mini Player ───────────────────────────────────────────────
function showMiniPlayer() { miniPlayer.hidden = false; }
miniExpand.addEventListener('click', () => {
  document.getElementById('full-player').scrollIntoView({ behavior: 'smooth' });
});

// ── Error handling ────────────────────────────────────────────
audio.addEventListener('error', () => {
  showError('⚠ Could not load file. Check /media folder.');
  setPlayIcon(false);
  albumArt.classList.remove('spinning');
});
function showError(msg) { errorMsgEl.textContent = msg; }
function clearError()   { errorMsgEl.textContent = ''; }

// ── Export / Import ───────────────────────────────────────────
btnExport.addEventListener('click', () => {
  const data = { favorites, playlists, recentlyPlayed, theme, volumeLevel: audio.volume, playMode: modeIndex };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jinvani-player-data.json';
  a.click();
});

btnImportTrig.addEventListener('click', () => btnImport.click());
btnImport.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data !== 'object') throw new Error('Invalid format');
      if (Array.isArray(data.favorites))      { favorites = data.favorites; LS.set('favorites', favorites); }
      if (Array.isArray(data.playlists))      { playlists = data.playlists; LS.set('playlists', playlists); renderPlaylistList(); renderPlaylistSelect(); }
      if (Array.isArray(data.recentlyPlayed)) { recentlyPlayed = data.recentlyPlayed; LS.set('recentlyPlayed', recentlyPlayed); }
      if (data.theme)       applyTheme(data.theme);
      if (data.volumeLevel) { audio.volume = data.volumeLevel; volumeEl.value = data.volumeLevel; LS.set('volumeLevel', data.volumeLevel); }
      if (typeof data.playMode === 'number') { modeIndex = data.playMode; updateModeBtn(); LS.set('playMode', modeIndex); }
      filtered = getTabSongs();
      renderSongList(filtered);
      alert('✅ Data imported successfully!');
    } catch (err) {
      alert('⚠ Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// ── Utilities ─────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Regenerate waveform when a new song loads
audio.addEventListener('loadedmetadata', () => {
  generateWaveform(currentIndex);
  drawWaveform(0);
});

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Don't intercept when typing in inputs
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'Space')       { e.preventDefault(); togglePlayPause(); }
  if (e.code === 'ArrowRight')  { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); }
  if (e.code === 'ArrowLeft')   { audio.currentTime = Math.max(0, audio.currentTime - 5); }
  if (e.code === 'ArrowUp')     { audio.volume = Math.min(1, audio.volume + 0.05); volumeEl.value = audio.volume; }
  if (e.code === 'ArrowDown')   { audio.volume = Math.max(0, audio.volume - 0.05); volumeEl.value = audio.volume; }
});

// ── Start ─────────────────────────────────────────────────────
init();
