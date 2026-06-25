const songs = [
  { id: 0,  title: "Blinding Lights",      artist: "The Weeknd",       img: "card1img.jpeg", duration: 200, section: "recent"  },
  { id: 1,  title: "Shape of You",          artist: "Ed Sheeran",       img: "card2img.jpeg", duration: 234, section: "recent"  },
  { id: 2,  title: "Dance Monkey",          artist: "Tones and I",      img: "card3img.jpeg", duration: 209, section: "recent"  },
  { id: 3,  title: "Levitating",            artist: "Dua Lipa",         img: "card4img.jpeg", duration: 203, section: "recent"  },
  { id: 4,  title: "Stay",                  artist: "The Kid LAROI",    img: "card5img.jpeg", duration: 141, section: "recent"  },
  { id: 5,  title: "As It Was",             artist: "Harry Styles",     img: "card6img.jpeg", duration: 167, section: "trending"},
  { id: 6,  title: "Heat Waves",            artist: "Glass Animals",    img: "card1img.jpeg", duration: 238, section: "trending"},
  { id: 7,  title: "Watermelon Sugar",      artist: "Harry Styles",     img: "card2img.jpeg", duration: 174, section: "trending"},
  { id: 8,  title: "Anti-Hero",             artist: "Taylor Swift",     img: "card3img.jpeg", duration: 200, section: "trending"},
  { id: 9,  title: "Flowers",               artist: "Miley Cyrus",      img: "card4img.jpeg", duration: 200, section: "trending"},
  { id: 10, title: "Top 50 — Global",       artist: "Various Artists",  img: "card1img.jpeg", duration: 195, section: "charts"  },
  { id: 11, title: "Top Songs India",       artist: "Various Artists",  img: "card5img.jpeg", duration: 210, section: "charts"  },
  { id: 12, title: "Viral Hits",            artist: "Various Artists",  img: "card6img.jpeg", duration: 185, section: "charts"  },
  { id: 13, title: "Midnight Rain",         artist: "Taylor Swift",     img: "card5img.jpeg", duration: 174, section: "charts"  },
  { id: 14, title: "Escapism.",             artist: "RAYE",             img: "card2img.jpeg", duration: 218, section: "new"     },
  { id: 15, title: "Calm Down",             artist: "Rema",             img: "card3img.jpeg", duration: 238, section: "new"     },
  { id: 16, title: "Unholy",               artist: "Sam Smith",        img: "card4img.jpeg", duration: 157, section: "new"     },
  { id: 17, title: "Cruel Summer",          artist: "Taylor Swift",     img: "card6img.jpeg", duration: 178, section: "new"     },
  { id: 18, title: "Golden Hour",           artist: "JVKE",             img: "card5img.jpeg", duration: 209, section: "new"     },
];

const sectionMap = {
  "recently-played": songs.filter(s => s.section === "recent"),
  "trending":        songs.filter(s => s.section === "trending"),
  "charts":          songs.filter(s => s.section === "charts"),
  "new-releases":    songs.filter(s => s.section === "new"),
};

// State
let currentSongIdx = null;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let isMuted = false;
let prevVolume = 70;
let progressTimer = null;
let currentProgress = 0;
const likedSongs = new Set();

// DOM refs
const playerArt    = document.getElementById("player-art");
const playerTitle  = document.getElementById("player-title");
const playerArtist = document.getElementById("player-artist");
const playerLike   = document.getElementById("player-like");
const btnPlay      = document.getElementById("btn-play");
const btnPrev      = document.getElementById("btn-prev");
const btnNext      = document.getElementById("btn-next");
const btnShuffle   = document.getElementById("btn-shuffle");
const btnRepeat    = document.getElementById("btn-repeat");
const btnVol       = document.getElementById("btn-vol");
const progressBar  = document.getElementById("progress-bar");
const volumeBar    = document.getElementById("volume-bar");
const currTimeEl   = document.getElementById("curr-time");
const totTimeEl    = document.getElementById("tot-time");
const searchInput  = document.getElementById("search-input");

// ── Render Cards ──────────────────────────────────────────────
function buildCard(song) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = song.id;
  card.innerHTML = `
    <button class="card-like ${likedSongs.has(song.id) ? "liked" : ""}" data-id="${song.id}" title="Like">
      <i class="fa-${likedSongs.has(song.id) ? "solid" : "regular"} fa-heart"></i>
    </button>
    <div class="card-img-wrap">
      <img src="${song.img}" class="card-img" alt="${song.title}" loading="lazy"
           onerror="this.src='card1img.jpeg'">
      <button class="card-play-btn" data-id="${song.id}" title="Play ${song.title}">
        <i class="fa-solid fa-play"></i>
      </button>
    </div>
    <p class="card-title">${song.title}</p>
    <p class="card-info">${song.artist}</p>
  `;
  return card;
}

function renderSection(containerId, list) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  if (!list.length) {
    el.innerHTML = `<p class="no-results">No results found.</p>`;
    return;
  }
  list.forEach(song => el.appendChild(buildCard(song)));
  syncPlayingCards();
}

function renderAll(filter = "") {
  const q = filter.toLowerCase();
  Object.entries(sectionMap).forEach(([id, list]) => {
    const filtered = q ? list.filter(s =>
      s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    ) : list;
    renderSection(id, filtered);
  });
}

// ── Play a Song ───────────────────────────────────────────────
function playSong(idx) {
  const song = songs[idx];
  if (!song) return;
  currentSongIdx = idx;
  currentProgress = 0;

  playerArt.src    = song.img;
  playerTitle.text  = song.title;
  playerTitle.textContent  = song.title;
  playerArtist.textContent = song.artist;
  totTimeEl.textContent    = fmtTime(song.duration);
  progressBar.value        = 0;
  currTimeEl.textContent   = "0:00";

  playerLike.className = `like-btn ${likedSongs.has(idx) ? "liked" : ""}`;
  playerLike.innerHTML = `<i class="fa-${likedSongs.has(idx) ? "solid" : "regular"} fa-heart"></i>`;

  setPlaying(true);
  syncPlayingCards();
  document.title = `${song.title} • Spotify`;
}

function setPlaying(state) {
  isPlaying = state;
  btnPlay.innerHTML = isPlaying
    ? `<i class="fa-solid fa-pause"></i>`
    : `<i class="fa-solid fa-play"></i>`;
  clearInterval(progressTimer);
  if (isPlaying && currentSongIdx !== null) startProgress();
}

function startProgress() {
  const song = songs[currentSongIdx];
  const totalSec = song.duration;
  progressTimer = setInterval(() => {
    currentProgress++;
    if (currentProgress >= totalSec) {
      clearInterval(progressTimer);
      if (isRepeat) { currentProgress = 0; startProgress(); }
      else handleNext();
      return;
    }
    progressBar.value = (currentProgress / totalSec) * 100;
    currTimeEl.textContent = fmtTime(currentProgress);
  }, 1000);
}

// ── Controls ──────────────────────────────────────────────────
function handleNext() {
  if (currentSongIdx === null) return;
  let next;
  if (isShuffle) {
    do { next = Math.floor(Math.random() * songs.length); } while (next === currentSongIdx && songs.length > 1);
  } else {
    next = (currentSongIdx + 1) % songs.length;
  }
  playSong(next);
}

function handlePrev() {
  if (currentSongIdx === null) return;
  if (currentProgress > 3) { currentProgress = 0; progressBar.value = 0; currTimeEl.textContent = "0:00"; clearInterval(progressTimer); if (isPlaying) startProgress(); return; }
  const prev = (currentSongIdx - 1 + songs.length) % songs.length;
  playSong(prev);
}

btnPlay.addEventListener("click", () => {
  if (currentSongIdx === null && songs.length) playSong(0);
  else setPlaying(!isPlaying);
});
btnNext.addEventListener("click", handleNext);
btnPrev.addEventListener("click", handlePrev);

btnShuffle.addEventListener("click", () => {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle("active", isShuffle);
});
btnRepeat.addEventListener("click", () => {
  isRepeat = !isRepeat;
  btnRepeat.classList.toggle("active", isRepeat);
});

progressBar.addEventListener("input", () => {
  if (currentSongIdx === null) return;
  const song = songs[currentSongIdx];
  currentProgress = Math.floor((progressBar.value / 100) * song.duration);
  currTimeEl.textContent = fmtTime(currentProgress);
  clearInterval(progressTimer);
  if (isPlaying) startProgress();
});

volumeBar.addEventListener("input", () => {
  const v = volumeBar.value;
  updateVolIcon(v);
});
btnVol.addEventListener("click", () => {
  if (isMuted) {
    isMuted = false;
    volumeBar.value = prevVolume;
    updateVolIcon(prevVolume);
  } else {
    prevVolume = volumeBar.value;
    isMuted = true;
    volumeBar.value = 0;
    updateVolIcon(0);
  }
});

function updateVolIcon(v) {
  let icon = "fa-volume-high";
  if (v == 0) icon = "fa-volume-xmark";
  else if (v < 40) icon = "fa-volume-low";
  btnVol.innerHTML = `<i class="fa-solid ${icon}"></i>`;
}

// ── Like ──────────────────────────────────────────────────────
function toggleLike(songId) {
  if (likedSongs.has(songId)) likedSongs.delete(songId);
  else likedSongs.add(songId);

  // update player like btn
  if (currentSongIdx === songId) {
    const liked = likedSongs.has(songId);
    playerLike.className = `like-btn ${liked ? "liked" : ""}`;
    playerLike.innerHTML = `<i class="fa-${liked ? "solid" : "regular"} fa-heart"></i>`;
  }

  // update card like btns
  document.querySelectorAll(`.card-like[data-id="${songId}"]`).forEach(btn => {
    const liked = likedSongs.has(songId);
    btn.className = `card-like ${liked ? "liked" : ""}`;
    btn.innerHTML = `<i class="fa-${liked ? "solid" : "regular"} fa-heart"></i>`;
  });
}

playerLike.addEventListener("click", () => {
  if (currentSongIdx !== null) toggleLike(currentSongIdx);
});

// ── Event delegation for cards ────────────────────────────────
document.addEventListener("click", e => {
  const playBtn = e.target.closest(".card-play-btn");
  const likeBtn = e.target.closest(".card-like");
  const card    = e.target.closest(".card");

  if (playBtn) { e.stopPropagation(); playSong(+playBtn.dataset.id); return; }
  if (likeBtn) { e.stopPropagation(); toggleLike(+likeBtn.dataset.id); return; }
  if (card)    { playSong(+card.dataset.id); }
});

// Sidebar playlist items
document.querySelectorAll(".playlist-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".playlist-item").forEach(i => i.classList.remove("active-playlist"));
    item.classList.add("active-playlist");
    playSong(+item.dataset.song);
  });
});

// ── Search ────────────────────────────────────────────────────
searchInput.addEventListener("input", () => renderAll(searchInput.value));

// ── Sync playing highlight ────────────────────────────────────
function syncPlayingCards() {
  document.querySelectorAll(".card").forEach(c => {
    const active = +c.dataset.id === currentSongIdx;
    c.classList.toggle("playing", active);
    const btn = c.querySelector(".card-play-btn i");
    if (btn) btn.className = active && isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
  });
}

// ── Nav active state ──────────────────────────────────────────
document.getElementById("nav-home").addEventListener("click", () => {
  document.querySelectorAll(".nav-option").forEach(n => n.classList.remove("active-nav"));
  document.getElementById("nav-home").classList.add("active-nav");
});
document.getElementById("nav-search").addEventListener("click", () => {
  document.querySelectorAll(".nav-option").forEach(n => n.classList.remove("active-nav"));
  document.getElementById("nav-search").classList.add("active-nav");
  searchInput.focus();
});

// ── Helpers ───────────────────────────────────────────────────
function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Init ──────────────────────────────────────────────────────
renderAll();
