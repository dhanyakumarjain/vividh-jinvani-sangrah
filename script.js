// ── Song list ──────────────────────────────────────────────────────────────
// Add or remove filenames here. All files must live inside the /media folder.
const songs = [
  "✽0105.00 सामायिक पाठ भाषा (काल अनंत..) Jain Sangrah 9.40.mp3",
  "✽0105.01 सामायिक पाठ भाषा (काल अनंत..) (M) Sup smallsize.mp3",
  "✽0105.04 सामायिक पाठ भाषा (काल अनंत..) New Nocmt 16.56.mp3",
  "✽104.01 Samaik Path सामायीक प्रतिज्ञा चारो दिशा में Namostu corus.mp3",
  "✽106.03 Alochna Path Duel New आलोचना पाठ Nomu ParasTV MF sup.mp3",
  "❀106.01 Alochna Path Duel New आलोचना पाठ Duel M NEW 1.mp3"
];

// ── DOM refs ───────────────────────────────────────────────────────────────
const audio         = document.getElementById("audio");
const songNameEl    = document.getElementById("song-name");
const playlistEl    = document.getElementById("playlist");
const btnPlay       = document.getElementById("btn-play");
const btnPrev       = document.getElementById("btn-prev");
const btnNext       = document.getElementById("btn-next");
const progressBar   = document.getElementById("progress-bar");
const progressCont  = document.getElementById("progress-container");
const currentTimeEl = document.getElementById("current-time");
const durationEl    = document.getElementById("duration");
const errorMsg      = document.getElementById("error-msg");

// ── State ──────────────────────────────────────────────────────────────────
let currentIndex = -1;   // nothing selected yet
let isPlaying    = false;

// ── Build playlist UI ──────────────────────────────────────────────────────
songs.forEach((filename, i) => {
  const li = document.createElement("li");

  // Strip the file extension for a cleaner display name
  const displayName = filename.replace(/\.mp3$/i, "");

  li.innerHTML = `<span class="index">${i + 1}</span>${displayName}`;
  li.dataset.index = i;

  li.addEventListener("click", () => {
    loadSong(i);
    playSong();
  });

  playlistEl.appendChild(li);
});

// ── Core helpers ───────────────────────────────────────────────────────────

/** Load a song by index (does NOT auto-play). */
function loadSong(index) {
  clearError();

  // Clamp index with wrap-around
  currentIndex = (index + songs.length) % songs.length;

  const filename = songs[currentIndex];
  // encodeURIComponent handles spaces and Unicode in filenames
  audio.src = "media/" + encodeURIComponent(filename);

  // Update "Now Playing" label
  songNameEl.textContent = filename.replace(/\.mp3$/i, "");

  // Highlight active item in playlist
  document.querySelectorAll(".playlist li").forEach((li, i) => {
    li.classList.toggle("active", i === currentIndex);
  });

  // Scroll active item into view
  const activeLi = playlistEl.querySelector("li.active");
  if (activeLi) activeLi.scrollIntoView({ block: "nearest" });

  // Reset progress
  progressBar.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  durationEl.textContent    = "0:00";
}

/** Start playback. */
function playSong() {
  // If nothing is loaded yet, load the first song
  if (currentIndex === -1) loadSong(0);

  audio.play().catch(err => {
    showError("Could not play: " + err.message);
  });
}

/** Pause playback. */
function pauseSong() {
  audio.pause();
}

/** Toggle play / pause. */
function togglePlay() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

// ── Button events ──────────────────────────────────────────────────────────
btnPlay.addEventListener("click", togglePlay);

btnPrev.addEventListener("click", () => {
  // If more than 3 s into the song, restart it; otherwise go to previous
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadSong(currentIndex - 1);
    if (isPlaying) playSong();
  }
});

btnNext.addEventListener("click", () => {
  loadSong(currentIndex + 1);
  if (isPlaying) playSong();
});

// ── Audio events ───────────────────────────────────────────────────────────

audio.addEventListener("play", () => {
  isPlaying = true;
  btnPlay.innerHTML = "&#9646;&#9646;"; // pause icon
});

audio.addEventListener("pause", () => {
  isPlaying = false;
  btnPlay.innerHTML = "&#9654;"; // play icon
});

// Auto-advance to next song when current one ends
audio.addEventListener("ended", () => {
  loadSong(currentIndex + 1);
  playSong();
});

// Update progress bar and time display
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = pct + "%";
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

// Show total duration once metadata is loaded
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

// Handle missing / unplayable file
audio.addEventListener("error", () => {
  showError("⚠ Could not load file. Check that it exists in /media.");
  isPlaying = false;
  btnPlay.innerHTML = "&#9654;";
});

// ── Seek on progress bar click ─────────────────────────────────────────────
progressCont.addEventListener("click", (e) => {
  if (!audio.duration) return;
  const rect = progressCont.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const ratio  = clickX / rect.width;
  audio.currentTime = ratio * audio.duration;
});

// ── Utility ────────────────────────────────────────────────────────────────

/** Format seconds → "m:ss" */
function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function showError(msg) { errorMsg.textContent = msg; }
function clearError()   { errorMsg.textContent = ""; }
