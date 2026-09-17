/**
 * =====================================================
 *  EDIT DATA DI SINI
 * =====================================================
 */

const icecast = {
  streamUrl: "https://s1.free-shoutcast.com/stream/18194",
  defaultSong: "Vadanya Radio — Live"
};

const newsList = [
  { title: "Vadanya Radio resmi on air", excerpt: "Mulai sekarang kamu bisa dengerin siaran live dan request lagu lewat Instagram.", date: "13 Sep 2026", image: "logo.png", url: "#" },
  { title: "Playlist galau & cinta lagi update", excerpt: "Koleksi lagu galau dan cinta-cintaan ditambah track baru minggu ini.", date: "12 Sep 2026", image: "logo.png", url: "#featured" },
  { title: "Cara request lagu di Vadanya", excerpt: "Klik Open Request, langsung ke Instagram, kirim judul lagunya.", date: "11 Sep 2026", image: "logo.png", url: "#request" }
];

const trendingSongs = [
  { title: "Teh Hijau", artist: "Tulus", platform: "both", spotifySearch: "Teh Hijau Tulus" },
  { title: "Sedia Aku Sebelum Hujan", artist: "Idgitaf", platform: "tt", spotifySearch: "Sedia Aku Sebelum Hujan" },
  { title: "Ada titik-titik di ujung doa", artist: "Sal Priadi", platform: "both", spotifySearch: "Ada titik-titik di ujung doa" },
  { title: "Foto kita blur", artist: "Sal Priadi", platform: "both", spotifySearch: "Foto kita blur" },
  { title: "Bandung", artist: "Yura Yunita", platform: "both", spotifySearch: "Bandung Yura Yunita" },
  { title: "Beauty and a Beat", artist: "Justin Bieber", platform: "both", spotifySearch: "Beauty and a Beat" }
];

const playlists = [
  { id: "3ALfwRrBuAuDGfYVTm12t0", title: "YANG GALAU COCOK NIH", desc: "Cocok buat yang lagi galau.", type: "featured", badge: "FEATURED" },
  { id: "5NcKcfEs2C6L77UtgEnVwr", title: "YG LAGI CINTA CINTAAN BET NIH", desc: "yg buat cinta cintaan cocok nih", type: "featured", badge: "FEATURED" },
  { id: "5RWmWLYZduxcpeuoR9LeqJ", title: "Enak dengerin malem malem", desc: "Lagu cocok buat kamu saat malem malem di kendaraan.", type: "new", badge: "NEW" },
  { id: "4S4uJ8Z6ZzZ9TEJ2KwQqRR", title: "LAGU POP YANG ENAK DIDENGERIN EN & IND", desc: "Lagu cocok buat kamu saat berkendara.", type: "hits", badge: "HITS" }
];

/* ===== THEME DARK / LIGHT ===== */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("vadanya-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
})();

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const root = document.documentElement;
    const isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("vadanya-theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("vadanya-theme", "dark");
    }
  });
}

/* ===== RADIO / MINI PLAYER ===== */
const audio = document.getElementById("radioAudio");
const btn = document.getElementById("radioPlay");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const volume = document.getElementById("radioVolume");

function setNow(title, sub) {
  if (miniTitle) miniTitle.textContent = title || "Vadanya Radio";
  if (miniArtist) miniArtist.textContent = sub || "Siap diputar";
}

function setUI(playing) {
  if (btn) btn.classList.toggle("playing", playing);
  if (!playing) setNow("Vadanya Radio", "Siap diputar");
}

function startRadio() {
  if (!audio) return;
  const sep = icecast.streamUrl.includes("?") ? "&" : "?";
  audio.src = icecast.streamUrl + sep + "t=" + Date.now();
  audio.volume = volume ? parseFloat(volume.value) : 0.85;
  audio.play()
    .then(() => {
      setUI(true);
      setNow(icecast.defaultSong, "Live");
      pollNow();
    })
    .catch(() => {
      setUI(false);
      setNow("Vadanya Radio", "Gagal connect");
    });
}

function stopRadio() {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  setUI(false);
  if (pollT) clearInterval(pollT);
}

let pollT = null;
function pollNow() {
  if (pollT) clearInterval(pollT);
  pollT = setInterval(async () => {
    try {
      const r = await fetch("/nowplaying?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      const t = data.nowplaying;
      if (t) setNow(t, "Live · Vadanya");
    } catch (_) {}
  }, 5000);
}

if (btn) {
  btn.addEventListener("click", () => {
    if (audio && !audio.paused) stopRadio();
    else startRadio();
  });
}

if (volume && audio) {
  volume.addEventListener("input", () => {
    audio.volume = parseFloat(volume.value);
  });
}

if (audio) {
  audio.addEventListener("error", () => {
    setUI(false);
    setNow("Vadanya Radio", "Stream error");
  });
}

/* ===== RENDER ===== */
function renderNews() {
  const el = document.getElementById("newsGrid");
  if (!el) return;
  el.innerHTML = newsList.map((n) => `
    <a class="news-card" href="${n.url}" ${n.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
      <img class="news-thumb" src="${n.image}" alt="" loading="lazy" />
      <div class="news-body">
        <span class="news-date">${n.date}</span>
        <h3 class="news-title">${n.title}</h3>
        <p class="news-excerpt">${n.excerpt}</p>
        <span class="news-more">Baca selengkapnya →</span>
      </div>
    </a>
  `).join("");
}

function renderTrending() {
  const el = document.getElementById("trendingGrid");
  if (!el) return;
  el.innerHTML = trendingSongs.map((song, i) => {
    const platforms = [];
    if (song.platform === "ig" || song.platform === "both") platforms.push('<span class="platform-tag ig">IG</span>');
    if (song.platform === "tt" || song.platform === "both") platforms.push('<span class="platform-tag tt">TikTok</span>');
    const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(song.spotifySearch)}`;
    return `
      <div class="trend-card">
        <div class="trend-top">
          <span class="trend-rank">${String(i + 1).padStart(2, "0")}</span>
          <div class="trend-info">
            <div class="trend-title">${song.title}</div>
            <div class="trend-artist">${song.artist}</div>
          </div>
          <div class="trend-platform">${platforms.join("")}</div>
        </div>
        <a class="trend-btn spotify" href="${searchUrl}" target="_blank" rel="noopener">Cari di Spotify</a>
      </div>`;
  }).join("");
}

function createEmbedCard(p) {
  const badgeClass = p.type === "featured" ? "featured" : p.type === "hits" ? "hits" : "new";
  return `
    <div class="embed-card" tabindex="0">
      <div class="embed-header">
        <h3 class="embed-title">${p.title}</h3>
        <span class="embed-badge ${badgeClass}">${p.badge}</span>
      </div>
      <p class="embed-desc">${p.desc}</p>
      <div class="embed-iframe-wrap">
        <iframe src="https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0"
          allowfullscreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"></iframe>
      </div>
    </div>`;
}

function renderSection(containerId, filterType) {
  const list = filterType === "all" ? playlists : playlists.filter((p) => p.type === filterType);
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = list.map(createEmbedCard).join("");
}

renderNews();
renderTrending();
renderSection("featuredGrid", "featured");
renderSection("hitsGrid", "hits");
renderSection("newGrid", "new");
renderSection("allGrid", "all");

/* ============================================================
   CUSTOM NOW PLAYING EMBED
   Auto-update dari /nowplaying (Cloudflare Pages Function)
   ============================================================ */
(function customNowPlaying() {
  const embedEl  = document.getElementById("nowplayingEmbed");
  const coverEl  = document.getElementById("npCover");
  const titleEl  = document.getElementById("npTitle");
  const artistEl = document.getElementById("npArtist");
  const miniArt  = document.querySelector(".mini-art");
  if (!embedEl || !coverEl || !titleEl || !artistEl) return;

  const DEFAULT_COVER = "logo.png";
  const ITUNES_API = "https://itunes.apple.com/search";
  const coverCache = new Map();
  let lastTrackKey = "";

  function parseNowPlaying(raw) {
    const text = (raw || "").trim();
    if (!text) return null;
    const idx = text.indexOf(" - ");
    if (idx > -1) {
      const artist = text.slice(0, idx).trim();
      const title  = text.slice(idx + 3).trim();
      if (artist && title) return { artist, title };
    }
    return { artist: "Vadanya Radio", title: text };
  }

  function setTrackUI(title, artist) {
    titleEl.textContent  = title  || "Vadanya Radio";
    artistEl.textContent = artist || "Live Streaming";
  }

  function setCover(url) {
    if (!url) url = DEFAULT_COVER;
    coverEl.style.opacity = "0";
    const img = new Image();
    img.onload = () => {
      coverEl.src = url;
      coverEl.style.opacity = "1";
      if (miniArt) miniArt.src = url;
    };
    img.onerror = () => {
      coverEl.src = DEFAULT_COVER;
      coverEl.style.opacity = "1";
      if (miniArt) miniArt.src = DEFAULT_COVER;
    };
    img.src = url;
  }

  async function fetchCover(title, artist) {
    const query = `${artist} ${title}`.trim();
    if (!query) return null;
    if (coverCache.has(query)) return coverCache.get(query);
    try {
      const url = `${ITUNES_API}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`;
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const data = await res.json();
      const item = data.results && data.results[0];
      if (!item) return null;
      const artwork = (item.artworkUrl100 || item.artworkUrl60 || "")
        .replace(/\/\d+x\d+bb\./, "/300x300bb.");
      coverCache.set(query, artwork);
      return artwork;
    } catch (_) {
      return null;
    }
  }

  async function updateNowPlaying(raw) {
    const parsed = parseNowPlaying(raw);
    if (!parsed) return;
    const { title, artist } = parsed;
    const trackKey = `${artist}::${title}`;
    if (trackKey === lastTrackKey) return;
    lastTrackKey = trackKey;

    setTrackUI(title, artist);
    setCover(DEFAULT_COVER);

    const cover = await fetchCover(title, artist);
    if (cover) setCover(cover);
  }

  function showEmbed(show) {
    embedEl.classList.toggle("visible", show);
    embedEl.classList.toggle("paused", !show);
  }

  async function poll() {
    try {
      const res = await fetch("/nowplaying?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.nowplaying) updateNowPlaying(data.nowplaying);
    } catch (_) {}
  }

  const mainAudio = document.getElementById("radioAudio");
  const playBtn   = document.getElementById("radioPlay");

  if (mainAudio) {
    mainAudio.addEventListener("play",  () => showEmbed(true));
    mainAudio.addEventListener("pause", () => showEmbed(false));
  }
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (mainAudio && !mainAudio.paused) showEmbed(true);
        else showEmbed(false);
      }, 50);
    });
  }

  poll();
  setInterval(poll, 5000);
})();