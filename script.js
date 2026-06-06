const STORAGE = {
  STATE: 'mp2_state',
  FAVORITES: 'mp2_favorites',
  PLAYLISTS: 'mp2_playlists',
  RECENT: 'mp2_recentlyPlayed',
  THEME: 'mp2_theme'
};
const MAX_RECENT = 10;

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
let theme = { scheme: 'lotus', mode: 'light' };
let addToPlaylistSongId = null;
let editingPlaylistId = null;
let deletingPlaylistId = null;
let currentDataVersion = null; // Track current data version

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ==================== SORT UTILITY ====================
// Sorts song titles: numeric prefixes (0101.01, 104.01 ...) in ascending
// numeric order, then non-numeric titles alphabetically after all numbers.
// A "numeric prefix" is the leading digit block before any space/letter, e.g.
//   "0101.01 सामायिक..."  → key 101.01
//   "104.01 ..."          → key 104.01
//   "धीमी आवाज़..."        → no key → pushed to end
function parseSongSortKey(title) {
  const m = (title || '').match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function compareSongTitles(a, b) {
  const ka = parseSongSortKey(a.title);
  const kb = parseSongSortKey(b.title);
  if (ka !== null && kb !== null) {
    if (ka !== kb) return ka - kb;
    // Same numeric prefix → fall back to full title string compare
    return (a.title || '').localeCompare(b.title || '');
  }
  // One has a number, the other doesn't → numbered comes first
  if (ka !== null) return -1;
  if (kb !== null) return 1;
  // Both non-numeric → alphabetical
  return (a.title || '').localeCompare(b.title || '');
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
  loadFromStorage();
  // #8 — First-time visitors get Lavender light as default
  if (!localStorage.getItem(STORAGE.THEME)) {
    theme = { scheme: 'lavender', mode: 'light' };
  }
  applyTheme();
  await loadSongs();
  
  // Default to Super Songs playlist on every page load
  const superPl = playlists.find(p => p.name === '0000 Super Songs');
  if (superPl) {
    state.activeView = 'playlist';
    state.activePlaylistId = superPl.id;
  } else {
    state.activeView = 'library';
    state.activePlaylistId = null;
  }
  
  renderView();
  setupControls();
  setupSwipeGestures(); // #6
  setupEvents();
  restoreState();
  fetchLastUpdated();
  
  // Start checking for data updates every 30 seconds
  startDataUpdateChecker();
});

// ==================== SONGS ====================

async function loadSongs() {
  try {
    // Add cache-busting parameter to force reload when data changes
    // First, fetch config to get lastUpdated timestamp
    const configResponse = await fetch(`data/config.json?t=${Date.now()}`);
    const config = await configResponse.json();
    
    // Use lastUpdated as cache buster for other files
    const cacheBuster = config.lastUpdated || Date.now();
    
    const [songData, playlistData] = await Promise.all([
      fetch(`data/songs.json?v=${cacheBuster}`).then(r => r.json()),
      fetch(`data/playlists.json?v=${cacheBuster}`).then(r => r.json()),
    ]);

    songs = songData.songs || [];

    // Remove duplicate songs based on full file path
    // (using filename-only dedup would wrongly drop songs in new folders
    //  that share a filename with a song in another folder)
    const uniqueSongs = [];
    const seenPaths = new Set();
    
    for (const song of songs) {
      if (!seenPaths.has(song.file)) {
        seenPaths.add(song.file);
        uniqueSongs.push(song);
      }
    }
    
    songs = uniqueSongs;

    // Sort songs: numeric prefixes in numeric order, non-numeric titles after
    songs.sort(compareSongTitles);

    if (config.title) {
      $('#playerTitle').textContent = config.title;
      document.title = config.title;
    }

    if (config.title2) {
      const title2 = $('#playerTitle2');
      title2.textContent = config.title2;
      title2.classList.add('visible');
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
      
      // Sort playlists: user playlists with 4-digit prefix first (sorted numerically), then seeded, then other user playlists
      playlists.sort((a, b) => {
        const aHasDigits = /^\d{4}\s/.test(a.name || '');
        const bHasDigits = /^\d{4}\s/.test(b.name || '');
        
        // Both have 4-digit prefix - sort numerically by the number
        if (aHasDigits && bHasDigits) {
          const aNum = parseInt((a.name || '').substring(0, 4)) || 0;
          const bNum = parseInt((b.name || '').substring(0, 4)) || 0;
          if (aNum !== bNum) return aNum - bNum;
          // If same number, sort alphabetically by rest of name
          return (a.name || '').localeCompare(b.name || '');
        }
        
        // One has 4-digit prefix, one doesn't - digit prefix comes first
        if (aHasDigits) return -1;
        if (bHasDigits) return 1;
        
        // Neither has 4-digit prefix - seeded before other user playlists
        if (a.seeded && !b.seeded) return -1;
        if (!a.seeded && b.seeded) return 1;
        
        // Both same type - sort alphabetically
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }

    // Mark all songs as available by default (check on play instead)
    songs.forEach(s => s.available = true);

    // #5 — lazy-load durations in background (batched, non-blocking)
    loadDurationsLazily();
  } catch { songs = []; }
}

function getSong(id) { return songs.find(s => s.id === id); }

// #5 — Load song durations lazily in small batches to avoid blocking
function loadDurationsLazily() {
  const pending = songs.filter(s => !s.duration || s.duration === 0);
  if (!pending.length) return;
  let i = 0;
  function loadNext() {
    if (i >= pending.length) return;
    const batch = pending.slice(i, i + 3); // 3 at a time
    i += 3;
    let done = 0;
    batch.forEach(song => {
      const a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => {
        song.duration = a.duration;
        // Update any visible duration span for this song
        const span = document.querySelector(`.song-item[data-id="${song.id}"] .song-dur`);
        if (span) span.textContent = fmt(a.duration);
        else if (!span) {
          // If no span yet, add it if the item exists
          const li = document.querySelector(`.song-item[data-id="${song.id}"]`);
          if (li) {
            const nameEl = li.querySelector('.name');
            if (nameEl && !li.querySelector('.song-dur')) {
              const d = document.createElement('span');
              d.className = 'song-dur';
              d.textContent = fmt(a.duration);
              nameEl.insertAdjacentElement('afterend', d);
            }
          }
        }
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
  // Start after a short delay so it doesn't compete with initial render
  setTimeout(loadNext, 1500);
}

// #6 — Swipe left/right on song list to skip next/prev
function setupSwipeGestures() {
  const el = $('#songList');
  let startX = 0, startY = 0, startTime = 0;
  el.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    // Must be fast (<400ms), mostly horizontal (dx > dy), and long enough (>60px)
    if (dt < 400 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) nextSong();   // swipe left → next
      else prevSong();           // swipe right → prev
    }
  }, { passive: true });
}

// ==================== PLAYBACK ====================

// Helper function for Google Analytics event tracking
function trackEvent(eventName, eventParams = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, eventParams);
  }
}

function playSong(id) {
  console.log('🎵 [PLAY] playSong called with id:', id, 'current id:', state.currentSongId);
  const song = getSong(id);
  if (!song) {
    console.log('❌ [PLAY] Song not found');
    return;
  }

  if (state.currentSongId !== id) {
    console.log('🔄 [PLAY] Changing song - setting new src:', song.file);
    audio.src = song.file;
    state.currentSongId = id;
    addToRecent(id);
  } else {
    console.log('▶️ [PLAY] Same song - just playing');
  }

  audio.play()
    .then(() => {
      console.log('✅ [PLAY] Play started successfully');
      state.isPlaying = true;
      song.available = true;
      updateNowPlaying();
      updateList();
      saveState();
      
      // Track song play event
      trackEvent('song_play', {
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist || 'Unknown',
        song_album: song.album || 'Unknown',
        playlist: state.activePlaylistId || 'library',
        view: state.activeView,
        shuffle_enabled: state.shuffle,
        repeat_mode: state.repeat
      });
    })
    .catch((error) => {
      song.available = false;
      showError(`Could not play "${song.title}". File may be missing or unavailable.`);
      state.isPlaying = false;
      updateNowPlaying();
      updateList();
      
      // Track play error
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
  updateNowPlaying();
  updateList();
  saveState();
  
  // Track song pause event
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
    const first = currentQueue.find(id => {
      const song = getSong(id);
      return song && song.available !== false;
    });
    if (first) playSong(first);
    return;
  }
  state.isPlaying ? pauseSong() : playSong(state.currentSongId);
}

function nextSong() {
  const avail = currentQueue.filter(id => {
    const song = getSong(id);
    return song && song.available !== false;
  });
  if (!avail.length) return;

  // Track next button click
  trackEvent('player_next', {
    from_song_id: state.currentSongId,
    shuffle_enabled: state.shuffle,
    repeat_mode: state.repeat
  });

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
  if (audio.currentTime > 3) { 
    // Track restart current song
    trackEvent('player_restart', {
      song_id: state.currentSongId,
      current_time: Math.floor(audio.currentTime)
    });
    audio.currentTime = 0; 
    return; 
  }
  
  // Track previous button click
  trackEvent('player_previous', {
    from_song_id: state.currentSongId,
    repeat_mode: state.repeat
  });
  
  const avail = currentQueue.filter(id => {
    const song = getSong(id);
    return song && song.available !== false;
  });
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
    if (!audio.duration) {
      console.log('⏱️ [TIMEUPDATE] No duration yet');
      return;
    }
    if (seeking) {
      console.log('⏱️ [TIMEUPDATE] Skipping update - user is seeking');
      return;
    }
    const pct = (audio.currentTime / audio.duration) * 100;
    $('#progressBar').style.width = pct + '%';
    $('#progressInput').value = (audio.currentTime / audio.duration) * 1000;
    $('#currentTime').textContent = fmt(audio.currentTime);
    console.log('⏱️ [TIMEUPDATE] Updated progress - currentTime:', audio.currentTime.toFixed(2), 'progress value:', $('#progressInput').value);
    
    // Save state periodically (every 5 seconds) to remember playback position
    if (!audio.paused && Math.floor(audio.currentTime) % 5 === 0) {
      saveState();
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    console.log('📀 [AUDIO] Metadata loaded - duration:', audio.duration);
    $('#duration').textContent = fmt(audio.duration);
  });
  
  // Add seeking event listeners to track audio element state
  audio.addEventListener('seeking', () => {
    console.log('🔍 [AUDIO] Audio element is seeking to:', audio.currentTime);
  });
  
  audio.addEventListener('seeked', () => {
    console.log('✅ [AUDIO] Audio element seeked complete at:', audio.currentTime);
  });

  audio.addEventListener('ended', () => {
    // Track song completion
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
    
    if (state.repeat === 'all') { 
      nextSong();
    } else {
      // When repeat is off, stop at the end of queue
      const avail = currentQueue.filter(id => {
        const song = getSong(id);
        return song && song.available !== false;
      });
      const idx = avail.indexOf(state.currentSongId);
      if (idx < avail.length - 1) {
        nextSong();
      } else {
        pauseSong();
        audio.currentTime = 0;
      }
    }
  });

  audio.addEventListener('error', () => {
    const song = getSong(state.currentSongId);
    if (song) {
      song.available = false;
      showError(`Error loading "${song.title}". File may be missing or corrupted.`);
      
      // Track playback error
      trackEvent('playback_error', {
        song_id: song.id,
        song_title: song.title,
        error_type: 'file_load_error'
      });
    } else {
      showError('Could not load file. Check that it exists in /media.');
      
      // Track unknown error
      trackEvent('playback_error', {
        error_type: 'unknown_file'
      });
    }
    state.isPlaying = false;
    updateNowPlaying();
    updateList();
  });

  let seeking = false;
  let seekTimeout = null;

  // Handle seeking start
  const startSeeking = () => {
    console.log('🎯 [SEEK] Start seeking');
    seeking = true;
    // Clear any pending seek
    if (seekTimeout) {
      clearTimeout(seekTimeout);
      seekTimeout = null;
    }
  };
  
  // Handle seeking end and apply the new time
  const endSeeking = () => {
    console.log('🎯 [SEEK] End seeking called, seeking flag:', seeking);
    
    // Clear any existing timeout
    if (seekTimeout) {
      clearTimeout(seekTimeout);
    }
    
    // Debounce the actual seek operation
    seekTimeout = setTimeout(() => {
      console.log('🎯 [SEEK] Executing debounced seek');
      console.log('🎯 [SEEK] Audio readyState:', audio.readyState, '(0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA)');
      console.log('🎯 [SEEK] Audio paused:', audio.paused);
      console.log('🎯 [SEEK] Audio ended:', audio.ended);
      console.log('🎯 [SEEK] Audio seeking:', audio.seeking);
      
      if (audio.duration) {
        const newTime = ($('#progressInput').value / 1000) * audio.duration;
        const oldTime = audio.currentTime;
        
        console.log('🎯 [SEEK] Audio duration:', audio.duration);
        console.log('🎯 [SEEK] Progress input value:', $('#progressInput').value);
        console.log('🎯 [SEEK] Old time:', oldTime);
        console.log('🎯 [SEEK] New time:', newTime);
        console.log('🎯 [SEEK] Time difference:', Math.abs(newTime - oldTime));
        
        // Check buffered ranges
        if (audio.buffered.length > 0) {
          console.log('📊 [SEEK] Buffered ranges:');
          for (let i = 0; i < audio.buffered.length; i++) {
            console.log(`   Range ${i}: ${audio.buffered.start(i).toFixed(2)}s - ${audio.buffered.end(i).toFixed(2)}s`);
          }
          
          // Check if target time is in any buffered range
          let isBuffered = false;
          for (let i = 0; i < audio.buffered.length; i++) {
            if (newTime >= audio.buffered.start(i) && newTime <= audio.buffered.end(i)) {
              isBuffered = true;
              console.log(`✅ [SEEK] Target time ${newTime.toFixed(2)}s IS buffered in range ${i}`);
              break;
            }
          }
          
          if (!isBuffered) {
            console.log(`⚠️ [SEEK] Target time ${newTime.toFixed(2)}s is NOT buffered yet`);
            console.log(`💡 [SEEK] Seeking anyway - browser will buffer on demand`);
          }
        }
        
        // Only update if the time actually changed
        if (Math.abs(newTime - oldTime) > 0.5) {
          console.log('✅ [SEEK] Applying seek to:', newTime);
          
          // CRITICAL FIX: Use seekable instead of just setting currentTime
          // Check if the position is seekable
          if (audio.seekable.length > 0) {
            const seekableStart = audio.seekable.start(0);
            const seekableEnd = audio.seekable.end(0);
            console.log(`📍 [SEEK] Seekable range: ${seekableStart.toFixed(2)}s - ${seekableEnd.toFixed(2)}s`);
            
            // Clamp the seek position to the seekable range
            const clampedTime = Math.max(seekableStart, Math.min(newTime, seekableEnd));
            
            if (clampedTime !== newTime) {
              console.log(`⚠️ [SEEK] Clamping seek from ${newTime.toFixed(2)}s to ${clampedTime.toFixed(2)}s`);
            }
            
            audio.currentTime = clampedTime;
            console.log('🔍 [SEEK] After setting - audio.currentTime is now:', audio.currentTime);
          } else {
            console.log('❌ [SEEK] No seekable ranges available!');
            // Try anyway
            audio.currentTime = newTime;
            console.log('🔍 [SEEK] After setting (no seekable check) - audio.currentTime is now:', audio.currentTime);
          }
          
          // Track seek event
          const song = getSong(state.currentSongId);
          if (song) {
            trackEvent('player_seek', {
              song_id: song.id,
              from_time: Math.floor(oldTime),
              to_time: Math.floor(newTime),
              duration: Math.floor(audio.duration)
            });
          }
        } else {
          console.log('⏭️ [SEEK] Skipping seek - time difference too small');
        }
      } else {
        console.log('❌ [SEEK] No audio duration');
      }
      
      seeking = false;
      seekTimeout = null;
      console.log('🎯 [SEEK] Seeking flag reset to false');
    }, 50); // 50ms debounce
  };

  console.log('🎵 [INIT] Setting up progress bar event listeners');

  $('#progressInput').addEventListener('mousedown', (e) => {
    console.log('🖱️ [EVENT] mousedown on progress bar');
    startSeeking();
  });
  
  $('#progressInput').addEventListener('touchstart', (e) => {
    console.log('👆 [EVENT] touchstart on progress bar');
    startSeeking();
  }, { passive: true });

  $('#progressInput').addEventListener('input', (e) => {
    console.log('📊 [EVENT] input - value:', e.target.value, 'seeking:', seeking);
    if (!audio.duration) {
      console.log('⚠️ [EVENT] No audio duration yet');
      return;
    }
    const val = $('#progressInput').value;
    const pct = val / 10;
    $('#progressBar').style.width = pct + '%';
    $('#currentTime').textContent = fmt((val / 1000) * audio.duration);
  });

  $('#progressInput').addEventListener('change', (e) => {
    console.log('🔄 [EVENT] change event - value:', e.target.value);
    endSeeking();
  });
  
  $('#progressInput').addEventListener('mouseup', (e) => {
    console.log('🖱️ [EVENT] mouseup on progress bar');
    endSeeking();
  });
  
  $('#progressInput').addEventListener('touchend', (e) => {
    console.log('👆 [EVENT] touchend on progress bar');
    endSeeking();
  });

  $('#btnPlay').addEventListener('click', togglePlay);
  $('#btnPrev').addEventListener('click', prevSong);
  $('#btnNext').addEventListener('click', nextSong);

  $('#btnShuffle').addEventListener('click', () => {
    state.shuffle = !state.shuffle;
    $('#btnShuffle').classList.toggle('active', state.shuffle);
    saveState();
    
    // Track shuffle toggle
    trackEvent('shuffle_toggle', {
      enabled: state.shuffle
    });
  });
  $('#btnShuffle').classList.toggle('active', state.shuffle);

  $('#btnRepeat').addEventListener('click', () => {
    state.repeat = state.repeat === 'off' ? 'all' : 'off';
    updateRepeatBtn();
    saveState();
    
    // Track repeat toggle
    trackEvent('repeat_toggle', {
      mode: state.repeat
    });
  });
  updateRepeatBtn();

  $('#btnVolume').addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    audio.volume = state.isMuted ? 0 : state.volume / 100;
    updateVolumeIcon();
    saveState();
    
    // Track mute toggle
    trackEvent('volume_mute', {
      muted: state.isMuted
    });
  });

  let volumeChangeTimeout;
  $('#volumeSlider').addEventListener('input', () => {
    state.volume = parseInt($('#volumeSlider').value);
    state.isMuted = false;
    audio.volume = state.volume / 100;
    updateVolumeIcon();
    updateVolumeSliderFill();
    saveState();
    
    // Track volume change (debounced to avoid too many events)
    clearTimeout(volumeChangeTimeout);
    volumeChangeTimeout = setTimeout(() => {
      trackEvent('volume_change', {
        volume: state.volume
      });
    }, 500);
  });
}

function updateNowPlaying() {
  const song = getSong(state.currentSongId);
  const songNameEl = $('#songName');
  
  if (song) {
    const songText = song.title + (song.artist ? ' · ' + song.artist : '');
    songNameEl.innerHTML = `<span class="song-name-inner" data-text="${songText.replace(/"/g, '&quot;')}">${songText}</span>`;
  } else {
    songNameEl.innerHTML = '&mdash;';
  }
  $('#btnPlay').innerHTML = state.isPlaying ? '&#9646;&#9646;' : '&#9654;';
  // #9 — toggle pulse glow
  $('#btnPlay').classList.toggle('playing', state.isPlaying);
  
  // Update play button label
  const playLabel = $('#btnPlay').parentElement.querySelector('.ctrl-label');
  if (playLabel) {
    playLabel.textContent = state.isPlaying ? 'Pause' : 'Play';
  }
}

function updateRepeatBtn() {
  const btn = $('#btnRepeat');
  const label = btn.parentElement.querySelector('.ctrl-label');
  
  btn.classList.toggle('active', state.repeat === 'all');
  
  if (state.repeat === 'off') {
    btn.innerHTML = '&#8635;';
    btn.title = 'Repeat: Off';
    btn.style.opacity = '0.5';
    if (label) label.textContent = 'Repeat';
  } else {
    btn.innerHTML = '&#8635;';
    btn.title = 'Repeat: All';
    btn.style.opacity = '1';
    if (label) label.textContent = 'Rep All';
  }
}

function updateVolumeIcon() {
  const v = state.isMuted ? 0 : state.volume;
  $('#btnVolume').innerHTML = v === 0 ? '&#128263;' : v < 50 ? '&#128265;' : '&#128266;';
}

function updateVolumeSliderFill() {
  const pct = state.volume;
  const slider = $('#volumeSlider');
  // Create a gradient that shows the filled portion
  slider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, rgba(0, 0, 0, 0.5) ${pct}%, rgba(0, 0, 0, 0.5) 100%)`;
  slider.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  slider.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.6)';
}

function restoreState() {
  if (state.currentSongId) {
    const song = getSong(state.currentSongId);
    if (song && song.available) {
      audio.src = song.file;
      
      // Restore playback position when metadata is loaded
      if (state.savedTime && state.savedTime > 0) {
        audio.addEventListener('loadedmetadata', function restoreTime() {
          // Only restore if the saved time is valid for this song
          if (state.savedTime < audio.duration) {
            audio.currentTime = state.savedTime;
            console.log(`Restored playback position: ${state.savedTime.toFixed(1)}s`);
          }
          // Remove this listener after restoring once
          audio.removeEventListener('loadedmetadata', restoreTime);
          state.savedTime = 0; // Clear saved time
        }, { once: true });
      }
      
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
    // Resolve song IDs → song objects, deduplicate by ID and title, then sort.
    // Title dedup handles copies of the same file placed in multiple folders
    // (e.g. a song in 0098 प्रातः that is also in its original folder — both
    // end with ✽ so both land in Super Songs, but they sound identical).
    // For user-ordered playlists (userOrdered:true), preserve the manual order.
    const seenIds = new Set();
    const seenTitles = new Set();
    const plSongs = pl.songIds
      .map(id => getSong(id))
      .filter(s => {
        if (!s || seenIds.has(s.id)) return false;
        const titleKey = (s.title || '').trim().toLowerCase();
        if (seenTitles.has(titleKey)) return false;
        seenIds.add(s.id);
        seenTitles.add(titleKey);
        return true;
      });
    if (!pl.userOrdered) plSongs.sort(compareSongTitles);
    renderSongItems(filterQ(plSongs, q), 'Empty playlist.', true);
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
    const songText = `${s.title}${s.artist ? ' · ' + s.artist : ''}`;
    const durStr = s.duration && s.duration > 0 ? fmt(s.duration) : '';
    return `<li class="song-item${active ? ' active' : ''}${na ? ' unavailable' : ''}" data-id="${s.id}">
      <span class="idx">${active && state.isPlaying ? '&#9654;' : i + 1}</span>
      <span class="name"><span class="name-inner" data-text="${songText.replace(/"/g, '&quot;')}">${songText}</span></span>
      ${durStr ? `<span class="song-dur">${durStr}</span>` : ''}
      ${na ? '<span class="badge-na">N/A</span>' : ''}
      <button class="icon-btn fav-btn${fav ? ' on' : ''}" data-fav="${s.id}">${fav ? '&#9829;' : '&#9825;'}</button>
      <button class="icon-btn menu-btn" data-menu="${s.id}" data-plv="${!!isPlView}">&#8943;</button>
    </li>`;
  }).join('');

  attachListEvents();

  // #3 — scroll active song into view after render
  const activeEl = ul.querySelector('.song-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
    const songText = `${s.title} · ${s.artist}`;
    return `<li class="song-item${active ? ' active' : ''}${na ? ' unavailable' : ''}" data-id="${s.id}">
      <span class="idx">${active && state.isPlaying ? '&#9654;' : i + 1}</span>
      <span class="name"><span class="name-inner" data-text="${songText.replace(/"/g, '&quot;')}">${songText}</span></span>
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
      const song = getSong(li.dataset.id);
      if (song) playSong(song.id);
    });
    
    // Prevent touch event propagation on buttons for better mobile UX
    const menuBtn = li.querySelector('.menu-btn');
    const favBtn = li.querySelector('.fav-btn');
    
    if (menuBtn) {
      menuBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }
    
    if (favBtn) {
      favBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }
  });
  $$('.fav-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(b.dataset.fav); }));
  $$('.menu-btn').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); showSongCtx(e, b.dataset.menu, b.dataset.plv === 'true'); }));
}

function updateList() {
  $$('.song-item').forEach((li, i) => {
    const active = li.dataset.id === state.currentSongId;
    li.classList.toggle('active', active);
    li.querySelector('.idx').innerHTML = active && state.isPlaying ? '&#9654;' : (i + 1);
    // #3 — scroll active song into view smoothly
    if (active) {
      li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function buildQueue() {
  if (state.activeView === 'library') currentQueue = songs.map(s => s.id);
  else if (state.activeView === 'favorites') currentQueue = [...songs.filter(s => favorites.includes(s.id))].sort(compareSongTitles).map(s => s.id);
  else if (state.activeView === 'recent') currentQueue = recentlyPlayed.map(r => r.songId);
  else if (state.activeView === 'playlist') {
    const pl = playlists.find(p => p.id === state.activePlaylistId);
    if (pl) {
      // Use same dedup + sort as renderView for consistent queue order
      const seenIds = new Set();
      const seenTitles = new Set();
      const plSongs = pl.songIds
        .map(id => getSong(id))
        .filter(s => {
          if (!s || seenIds.has(s.id)) return false;
          const titleKey = (s.title || '').trim().toLowerCase();
          if (seenTitles.has(titleKey)) return false;
          seenIds.add(s.id);
          seenTitles.add(titleKey);
          return true;
        });
      if (!pl.userOrdered) plSongs.sort(compareSongTitles);
      currentQueue = plSongs.map(s => s.id);
    } else {
      currentQueue = [];
    }
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
  
  // Track view change
  trackEvent('view_change', {
    view: view,
    playlist_id: plId || null
  });
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
  const isAdding = idx === -1;
  if (isAdding) favorites.push(id); else favorites.splice(idx, 1);
  saveFavorites();
  
  // Track favorite toggle
  const song = getSong(id);
  if (song) {
    trackEvent(isAdding ? 'favorite_add' : 'favorite_remove', {
      song_id: song.id,
      song_title: song.title,
      total_favorites: favorites.length
    });
  }
  
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
  const pl = { id: 'pl-' + Date.now(), name: name.trim(), songIds: [], userOrdered: true };
  playlists.push(pl);
  
  // Re-sort playlists: user playlists with 4-digit prefix first (sorted numerically), then seeded, then other user playlists
  playlists.sort((a, b) => {
    const aHasDigits = /^\d{4}\s/.test(a.name || '');
    const bHasDigits = /^\d{4}\s/.test(b.name || '');
    
    // Both have 4-digit prefix - sort numerically by the number
    if (aHasDigits && bHasDigits) {
      const aNum = parseInt((a.name || '').substring(0, 4)) || 0;
      const bNum = parseInt((b.name || '').substring(0, 4)) || 0;
      if (aNum !== bNum) return aNum - bNum;
      // If same number, sort alphabetically by rest of name
      return (a.name || '').localeCompare(b.name || '');
    }
    
    // One has 4-digit prefix, one doesn't - digit prefix comes first
    if (aHasDigits) return -1;
    if (bHasDigits) return 1;
    
    // Neither has 4-digit prefix - seeded before other user playlists
    if (a.seeded && !b.seeded) return -1;
    if (!a.seeded && b.seeded) return 1;
    
    // Both same type - sort alphabetically
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  savePlaylists();
  
  // Track playlist creation
  trackEvent('playlist_create', {
    playlist_id: pl.id,
    playlist_name: pl.name,
    total_playlists: playlists.filter(p => !p.seeded).length
  });
  
  return pl;
}

function renamePlaylist(id, name) {
  const pl = playlists.find(p => p.id === id);
  if (pl) { 
    const oldName = pl.name;
    pl.name = name.trim();
    
    // Re-sort playlists: user playlists with 4-digit prefix first (sorted numerically), then seeded, then other user playlists
    playlists.sort((a, b) => {
      const aHasDigits = /^\d{4}\s/.test(a.name || '');
      const bHasDigits = /^\d{4}\s/.test(b.name || '');
      
      // Both have 4-digit prefix - sort numerically by the number
      if (aHasDigits && bHasDigits) {
        const aNum = parseInt((a.name || '').substring(0, 4)) || 0;
        const bNum = parseInt((b.name || '').substring(0, 4)) || 0;
        if (aNum !== bNum) return aNum - bNum;
        // If same number, sort alphabetically by rest of name
        return (a.name || '').localeCompare(b.name || '');
      }
      
      // One has 4-digit prefix, one doesn't - digit prefix comes first
      if (aHasDigits) return -1;
      if (bHasDigits) return 1;
      
      // Neither has 4-digit prefix - seeded before other user playlists
      if (a.seeded && !b.seeded) return -1;
      if (!a.seeded && b.seeded) return 1;
      
      // Both same type - sort alphabetically
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    savePlaylists(); 
    
    // Track playlist rename
    trackEvent('playlist_rename', {
      playlist_id: id,
      old_name: oldName,
      new_name: pl.name
    });
    
    if (state.activeView === 'playlist' && state.activePlaylistId === id) renderView(); 
  }
}

function deletePlaylist(id) {
  const pl = playlists.find(p => p.id === id);
  playlists = playlists.filter(p => p.id !== id);
  savePlaylists();
  
  // Track playlist deletion
  if (pl) {
    trackEvent('playlist_delete', {
      playlist_id: id,
      playlist_name: pl.name,
      song_count: pl.songIds.length,
      total_playlists: playlists.filter(p => !p.seeded).length
    });
  }
  
  if (state.activeView === 'playlist' && state.activePlaylistId === id) switchView('library');
}

function removeSongFromPL(plId, songId) {
  const pl = playlists.find(p => p.id === plId);
  if (!pl) return;
  const song = getSong(songId);
  pl.songIds = pl.songIds.filter(id => id !== songId);
  savePlaylists();
  
  // Track song removal from playlist
  if (song) {
    trackEvent('playlist_remove_song', {
      playlist_id: plId,
      playlist_name: pl.name,
      song_id: songId,
      song_title: song.title,
      remaining_songs: pl.songIds.length
    });
  }
  
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

// ==================== DOWNLOAD ====================

function getSongDownloadName(song) {
  try {
    const fromUrl = decodeURIComponent(new URL(song.file).pathname.split('/').pop() || '');
    if (/\.(mp3|m4a|wav|ogg)$/i.test(fromUrl)) return fromUrl;
  } catch (_) {}
  const safe = (song.title || 'song').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'song';
  return `${safe}.mp3`;
}

async function downloadSong(songId) {
  const song = getSong(songId);
  if (!song?.file) {
    showError('Song file not found.');
    return;
  }
  if (song.available === false) {
    showError(`"${song.title}" is not available to download.`);
    return;
  }

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
  let html = `<button class="ctx-item" data-action="download" data-sid="${songId}">&#11015; Download</button>`;
  html += `<button class="ctx-item" data-action="add" data-sid="${songId}">+ Add to Playlist</button>`;
  const activePl = playlists.find(p => p.id === state.activePlaylistId);
  if (isPlView && state.activePlaylistId && activePl && !activePl.seeded)
    html += `<button class="ctx-item danger" data-action="remove" data-sid="${songId}">Remove from Playlist</button>`;
  menu.innerHTML = html;
  menu.querySelectorAll('.ctx-item').forEach(b => b.addEventListener('click', () => {
    const { action, sid } = b.dataset;
    if (action === 'download') downloadSong(sid);
    else if (action === 'add') openAddToPL(sid);
    else removeSongFromPL(state.activePlaylistId, sid);
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
  
  // Get menu dimensions
  const menuWidth = 180; // Approximate width
  const menuHeight = Math.min(220, 44 * menu.querySelectorAll('.ctx-item').length + 16);
  
  // Calculate position
  let left = e.clientX;
  let top = e.clientY;
  
  // Adjust if menu would go off-screen horizontally
  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 10;
  }
  
  // Adjust if menu would go off-screen vertically
  if (top + menuHeight > window.innerHeight) {
    top = window.innerHeight - menuHeight - 10;
  }
  
  // On mobile, center the menu better
  if (window.innerWidth <= 768) {
    // Position menu near the touch point but ensure it's fully visible
    left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - menuHeight - 10));
  }
  
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
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
  const song = getSong(addToPlaylistSongId);
  let addedTo = [];
  let removedFrom = [];
  
  $$('#playlistCheckboxes input[type="checkbox"]').forEach(cb => {
    const pl = playlists.find(p => p.id === cb.value);
    if (!pl) return;
    if (cb.checked && !pl.songIds.includes(addToPlaylistSongId)) {
      pl.songIds.push(addToPlaylistSongId);
      addedTo.push(pl.name);
    }
    else if (!cb.checked && pl.songIds.includes(addToPlaylistSongId)) {
      pl.songIds = pl.songIds.filter(id => id !== addToPlaylistSongId);
      removedFrom.push(pl.name);
    }
  });
  savePlaylists();
  
  // Track song added to playlists
  if (song && addedTo.length > 0) {
    trackEvent('playlist_add_song', {
      song_id: song.id,
      song_title: song.title,
      playlists_added: addedTo.join(', '),
      count: addedTo.length
    });
  }
  
  closeModal('addToPlaylistModal');
  addToPlaylistSongId = null;
  if (state.activeView === 'playlist') renderView();
}

function openNewPL(fromModal) {
  editingPlaylistId = null;
  $('#playlistNameTitle').textContent = 'New Playlist';
  
  // Count all existing user playlists that start with 4 digits (0000, 0001, 0002, etc.)
  const userPlaylists = playlists.filter(p => !p.seeded && /^\d{4}\s/.test(p.name));
  
  // Find the highest number used
  let maxNumber = 0;
  userPlaylists.forEach(p => {
    const match = p.name.match(/^(\d{4})\s/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNumber) maxNumber = num;
    }
  });
  
  // Next number is maxNumber + 1
  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(4, '0');
  
  // Pre-fill with "0001 " format (or next available number)
  $('#playlistNameInput').value = `${paddedNumber} `;
  
  if (fromModal) closeModal('addToPlaylistModal');
  openModal('playlistNameModal');
  setTimeout(() => {
    const input = $('#playlistNameInput');
    input.focus();
    // Place cursor at the end (after "0001 ")
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
  const oldScheme = theme.scheme;
  const oldMode = theme.mode;
  
  if (scheme) theme.scheme = scheme;
  if (mode) theme.mode = mode;
  applyTheme();
  saveTheme();
  updateVolumeSliderFill();
  
  // Track theme change
  if (scheme && scheme !== oldScheme) {
    trackEvent('theme_change', {
      old_theme: oldScheme,
      new_theme: scheme,
      mode: theme.mode
    });
  }
  
  // Track mode change
  if (mode && mode !== oldMode) {
    trackEvent('theme_mode_change', {
      theme: theme.scheme,
      old_mode: oldMode,
      new_mode: mode
    });
  }
}

function renderThemeCards() {
  const container = $('#themeOptions');
  container.innerHTML = themeDefs.map(t =>
    `<button class="theme-card${t.id === theme.scheme ? ' active' : ''}" data-scheme="${t.id}">
      <span class="theme-dot" style="background:${t.dot};${t.dot.includes('gradient') ? 'border:none;' : ''}"></span> ${t.name}
    </button>`
  ).join('');
  container.querySelectorAll('.theme-card').forEach(c => {
    c.addEventListener('click', () => setTheme(c.dataset.scheme, null));
  });
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
    activeView: state.activeView, 
    activePlaylistId: state.activePlaylistId
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
      state.savedTime = s.currentTime || 0;  // Store saved time for later restoration
      state.volume = s.volume ?? 80;
      state.isMuted = s.isMuted || false;
      state.shuffle = s.shuffle || false;
      state.repeat = s.repeat || 'off';
      // View is set after loadSongs() to default to Super Songs
      state.activeView = 'library';
      state.activePlaylistId = null;
    }
  } catch {}
  try { favorites = JSON.parse(localStorage.getItem(STORAGE.FAVORITES)) || []; } catch { favorites = []; }
  try { playlists = JSON.parse(localStorage.getItem(STORAGE.PLAYLISTS)) || []; } catch { playlists = []; }
  try { recentlyPlayed = JSON.parse(localStorage.getItem(STORAGE.RECENT)) || []; } catch { recentlyPlayed = []; }
  try { const t = JSON.parse(localStorage.getItem(STORAGE.THEME)); if (t) theme = t; } catch {}
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
  
  // Clear all localStorage data
  localStorage.removeItem(STORAGE.STATE);
  localStorage.removeItem(STORAGE.FAVORITES);
  localStorage.removeItem(STORAGE.PLAYLISTS);
  localStorage.removeItem(STORAGE.RECENT);
  localStorage.removeItem(STORAGE.THEME);
  
  // Track data clear
  trackEvent('data_clear', {
    favorites_count: favorites.length,
    playlists_count: playlists.filter(p => !p.seeded).length,
    recent_count: recentlyPlayed.length
  });
  
  // Reload the page to reset everything
  alert('All user data has been cleared. The page will now reload.');
  window.location.reload();
}

// ==================== EVENTS ====================

function setupEvents() {
  $$('.tab[data-view]').forEach(t => t.addEventListener('click', () => {
    t.id === 'tabPlaylists' ? togglePLDropdown() : switchView(t.dataset.view);
  }));

  $('#btnSettings').addEventListener('click', () => {
    const countEl = $('#totalSongCount');
    if (countEl) countEl.textContent = songs.length;
    openModal('settingsModal');
  });
  $('#btnNewPlaylist').addEventListener('click', (e) => { e.stopPropagation(); closePLDropdown(); openNewPL(false); });

  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); }));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.menu-btn') && !e.target.closest('[data-plmenu]')) closeCtx();
    if (!e.target.closest('.tab-dd-wrap')) closePLDropdown();
  });

  $$('.mode-btn').forEach(b => b.addEventListener('click', () => setTheme(null, b.dataset.mode)));

  $('#btnSongCount').addEventListener('click', () => {
    const countEl = $('#totalSongCount');
    if (countEl) countEl.textContent = songs.length;
  });
  $('#btnCreatePlaylist').addEventListener('click', () => { closeModal('settingsModal'); openNewPL(false); });
  $('#btnClearData').addEventListener('click', clearAllData);

  $('#btnDoneAddToPlaylist').addEventListener('click', saveAddToPL);
  $('#btnCreateFromModal').addEventListener('click', () => openNewPL(true));
  $('#btnSavePlaylistName').addEventListener('click', savePLName);
  $('#playlistNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') savePLName(); });
  $('#btnConfirmDelete').addEventListener('click', confirmDelete);

  let searchTimeout;
  $('#searchInput').addEventListener('input', (e) => {
    renderView();
    
    // Track search (debounced to avoid too many events)
    const query = e.target.value.trim();
    if (query.length >= 2) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        trackEvent('search', {
          query: query,
          view: state.activeView,
          query_length: query.length
        });
      }, 1000);
    }
  });
  
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

// ==================== VERSION INFO ====================

async function fetchLastUpdated() {
  try {
    // Fetch from config.json which is already loaded
    const response = await fetch('data/config.json');
    if (response.ok) {
      const data = await response.json();
      if (data.lastUpdated) {
        displayLastUpdated(data.lastUpdated);
        return;
      }
    }
  } catch (e) {
    console.error('Could not fetch last updated date:', e);
  }
  
  // Fallback if no lastUpdated field
  displayLastUpdated(null);
}

function displayLastUpdated(dateString) {
  const versionDateEl = $('#versionDate');
  
  if (!dateString) {
    if (versionDateEl) versionDateEl.innerHTML = '<strong>Unknown</strong>';
    return;
  }
  
  try {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    if (versionDateEl) versionDateEl.innerHTML = `<strong>${formattedDate}</strong>`;
  } catch (e) {
    if (versionDateEl) versionDateEl.innerHTML = `<strong>${dateString}</strong>`;
  }
}

// ==================== AUTO UPDATE CHECKER ====================

function startDataUpdateChecker() {
  // Check for updates every 30 seconds
  setInterval(checkForDataUpdates, 30000);
}

async function checkForDataUpdates() {
  try {
    // Fetch config with cache buster to get latest version
    const response = await fetch(`data/config.json?t=${Date.now()}`);
    if (!response.ok) return;
    
    const data = await response.json();
    const latestVersion = data.lastUpdated;
    
    // If this is first check, just store the version
    if (!currentDataVersion) {
      currentDataVersion = latestVersion;
      return;
    }
    
    // If version changed, show update notification
    if (latestVersion && latestVersion !== currentDataVersion) {
      showUpdateNotification();
    }
  } catch (e) {
    console.error('Error checking for updates:', e);
  }
}

function showUpdateNotification() {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('updateNotification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'updateNotification';
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🔄</span>
        <span class="update-text">New songs available!</span>
        <button class="update-btn" onclick="reloadPage()">Refresh Now</button>
        <button class="update-close" onclick="closeUpdateNotification()">×</button>
      </div>
    `;
    document.body.appendChild(notification);
  }
  
  // Show notification with animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Track update notification shown
  trackEvent('update_notification_shown', {
    old_version: currentDataVersion,
    new_version: 'detected'
  });
}

function closeUpdateNotification() {
  const notification = document.getElementById('updateNotification');
  if (notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
}

function reloadPage() {
  // Track reload action
  trackEvent('manual_reload', {
    source: 'update_notification'
  });
  
  // Reload page to get new data
  window.location.reload(true);
}

