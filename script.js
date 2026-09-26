/**
 * =====================================================
 *  KONFIGURASI
 * =====================================================
 */
const STREAM_URL = "https://s1.free-shoutcast.com/stream/18194";

const RSS_FEEDS = [
  "https://www.antaranews.com/rss/hiburan.xml",
  "https://www.cnnindonesia.com/hiburan/rss"
];
const NEWS_LIMIT = 6;
const RSS_PROXY = "/rss?url=";

const playlists = [
  { id: "3ALfwRrBuAuDGfYVTm12t0", title: "YANG GALAU COCOK NIH", desc: "Cocok buat yang lagi galau.", type: "featured", badge: "FEATURED" },
  { id: "5NcKcfEs2C6L77UtgEnVwr", title: "YG LAGI CINTA CINTAAN BET NIH", desc: "yg buat cinta cintaan cocok nih", type: "featured", badge: "FEATURED" },
  { id: "5RWmWLYZduxcpeuoR9LeqJ", title: "Enak dengerin malem malem", desc: "Lagu cocok buat kamu saat malem malem di kendaraan.", type: "new", badge: "NEW" },
  { id: "4S4uJ8Z6ZzZ9TEJ2KwQqRR", title: "LAGU POP YANG ENAK DIDENGERIN EN & IND", desc: "Lagu cocok buat kamu saat berkendara.", type: "hits", badge: "HITS" }
];

const DEFAULT_COVER = "logo.png";

/* ===== THEME ===== */
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

/* ===== PLAYER ===== */
const audio = document.getElementById("cpAudio");
const btn = document.getElementById("cpPlay");
const vol = document.getElementById("cpVol");
const cpTitle = document.getElementById("cpTitle");
const cpArtist = document.getElementById("cpArtist");
const cpArt = document.getElementById("cpArt");
const lyricsText = document.getElementById("lyricsText");
const coverCache = new Map();
let lastKey = "";

function setPlaying(on) {
  if (btn) btn.classList.toggle("playing", on);
}

function setTrack(title, artist) {
  if (cpTitle) cpTitle.textContent = title || "Vadanya Radio";
  if (cpArtist) cpArtist.textContent = artist || "Live";
}

function setCover(url) {
  const src = url || DEFAULT_COVER;
  if (!cpArt) return;
  const img = new Image();
  img.onload = () => { cpArt.src = src; };
  img.onerror = () => { cpArt.src = DEFAULT_COVER; };
  img.src = src;
}

function parseNow(raw) {
  const t = (raw || "").trim();
  if (!t) return null;
  const i = t.indexOf(" - ");
  if (i > -1) return { artist: t.slice(0, i).trim(), title: t.slice(i + 3).trim() };
  return { artist: "Vadanya Radio", title: t };
}

async function fetchCover(title, artist) {
  const q = `${artist} ${title}`.trim();
  if (!q) return null;
  if (coverCache.has(q)) return coverCache.get(q);
  try {
    const url =
      "https://itunes.apple.com/search?term=" +
      encodeURIComponent(q) +
      "&media=music&entity=song&limit=1";
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.results && data.results[0];
    if (!item || !item.artworkUrl100) return null;
    const art = item.artworkUrl100.replace(/\/\d+x\d+bb\./, "/300x300bb.");
    coverCache.set(q, art);
    return art;
  } catch (_) {
    return null;
  }
}

async function fetchLyrics(title, artist) {
  if (!lyricsText) return;
  lyricsText.textContent = "Mencari lirik…";
  try {
    let res = await fetch(
      "https://lrclib.net/api/get?artist_name=" +
        encodeURIComponent(artist) +
        "&track_name=" +
        encodeURIComponent(title)
    );
    if (res.ok) {
      const data = await res.json();
      const plain = (data.plainLyrics || data.syncedLyrics || "").trim();
      if (plain) {
        lyricsText.textContent = plain.replace(/^\[.*?\]\s*/gm, "").trim() || "Lirik tidak ditemukan.";
        return;
      }
    }
    res = await fetch(
      "https://api.lyrics.ovh/v1/" +
        encodeURIComponent(artist) +
        "/" +
        encodeURIComponent(title)
    );
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) {
        lyricsText.textContent = data.lyrics.trim();
        return;
      }
    }
    lyricsText.textContent = "Lirik tidak ditemukan untuk lagu ini.";
  } catch (_) {
    lyricsText.textContent = "Gagal memuat lirik.";
  }
}

async function updateNowPlaying(raw) {
  const parsed = parseNow(raw);
  if (!parsed) return;
  const { title, artist } = parsed;
  const key = artist + "::" + title;
  if (key === lastKey) return;
  lastKey = key;
  setTrack(title, artist);
  setCover(DEFAULT_COVER);
  const cover = await fetchCover(title, artist);
  if (cover) setCover(cover);
  await fetchLyrics(title, artist);
}

async function pollNow() {
  try {
    const r = await fetch("/nowplaying?t=" + Date.now(), { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (data.nowplaying) {
        await updateNowPlaying(data.nowplaying);
        return;
      }
    }
  } catch (_) {}
  try {
    const r2 = await fetch("nowplaying.txt?t=" + Date.now(), { cache: "no-store" });
    if (r2.ok) {
      const text = (await r2.text()).trim();
      if (text) await updateNowPlaying(text);
    }
  } catch (_) {}
}

function start() {
  if (!audio) return;
  const sep = STREAM_URL.includes("?") ? "&" : "?";
  audio.src = STREAM_URL + sep + "t=" + Date.now();
  audio.volume = vol ? +vol.value : 0.85;
  audio.play()
    .then(() => {
      setPlaying(true);
      pollNow();
    })
    .catch(() => {
      setPlaying(false);
      setTrack("Vadanya Radio", "Gagal connect");
    });
}

function stop() {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  setPlaying(false);
}

if (btn) {
  btn.addEventListener("click", () => {
    if (audio && !audio.paused) stop();
    else start();
  });
}
if (vol && audio) {
  vol.addEventListener("input", () => {
    audio.volume = +vol.value;
  });
}
if (audio) {
  audio.addEventListener("error", () => {
    setPlaying(false);
    setTrack("Vadanya Radio", "Stream error");
  });
}

pollNow();
setInterval(pollNow, 5000);

/* ===== LISTENERS ===== */
const listenersCount = document.getElementById("listenersCount");
async function pollListeners() {
  try {
    const r = await fetch("/listeners?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    if (listenersCount && data.ok) {
      listenersCount.textContent = String(data.listeners ?? 0);
    }
  } catch (_) {}
}
pollListeners();
setInterval(pollListeners, 15000);

/* ===== TRENDING AUTO (iTunes) ===== */
async function loadTrending() {
  const el = document.getElementById("trendingGrid");
  if (!el) return;
  el.innerHTML = `<div class="news-loading">Memuat chart…</div>`;
  try {
    const r = await fetch("/trending?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!data.ok || !data.songs?.length) throw new Error("Data kosong");

    el.innerHTML = data.songs.map((song, i) => {
      const searchUrl =
        "https://open.spotify.com/search/" +
        encodeURIComponent(song.spotifySearch || `${song.title} ${song.artist}`);
      return `
        <div class="trend-card">
          <div class="trend-top">
            <span class="trend-rank">${String(i + 1).padStart(2, "0")}</span>
            <div class="trend-info">
              <div class="trend-title">${song.title}</div>
              <div class="trend-artist">${song.artist}</div>
            </div>
          </div>
          <a class="trend-btn spotify" href="${searchUrl}" target="_blank" rel="noopener">Cari di Spotify</a>
        </div>`;
    }).join("");
  } catch (err) {
    el.innerHTML = `<div class="news-error">Gagal memuat chart.<br /><small>${err.message}</small></div>`;
  }
}

/* ===== NEWS ===== */
async function fetchNews() {
  const el = document.getElementById("newsGrid");
  if (!el) return;
  let lastError = null;
  for (const feedUrl of RSS_FEEDS) {
    try {
      const res = await fetch(RSS_PROXY + encodeURIComponent(feedUrl));
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const items = xml.querySelectorAll("item");
      if (!items.length) throw new Error("Feed kosong");
      const news = [];
      for (let i = 0; i < Math.min(items.length, NEWS_LIMIT); i++) {
        const it = items[i];
        news.push({
          title: it.querySelector("title")?.textContent?.trim() || "Tanpa judul",
          link: it.querySelector("link")?.textContent?.trim() || "#",
          pubDate: it.querySelector("pubDate")?.textContent?.trim() || "",
          desc: it.querySelector("description")?.textContent?.trim() || "",
          image: extractImage(it, it.querySelector("description")?.textContent || "")
        });
      }
      renderNews(news);
      return;
    } catch (err) {
      lastError = err;
    }
  }
  el.innerHTML = `<div class="news-error">Gagal memuat berita.<br /><small>${lastError ? lastError.message : ""}</small></div>`;
}

function extractImage(item, desc) {
  let el = item.querySelector("content[url]");
  if (el) return el.getAttribute("url");
  el = item.querySelector("thumbnail[url]");
  if (el) return el.getAttribute("url");
  el = item.querySelector("enclosure[url]");
  if (el) return el.getAttribute("url");
  const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : "logo.png";
}

function formatDate(pubDate) {
  if (!pubDate) return "";
  try {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) return "";
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (_) {
    return "";
  }
}

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return tmp.textContent || tmp.innerText || "";
}

function renderNews(news) {
  const el = document.getElementById("newsGrid");
  if (!el) return;
  el.innerHTML = news.map((n) => {
    const excerpt = stripHtml(n.desc).slice(0, 120);
    const date = formatDate(n.pubDate);
    return `
      <a class="news-card" href="${n.link}" target="_blank" rel="noopener">
        <img class="news-thumb" src="${n.image}" alt="" loading="lazy" onerror="this.src='logo.png'" />
        <div class="news-body">
          ${date ? `<span class="news-date">${date}</span>` : ""}
          <h3 class="news-title">${n.title}</h3>
          <p class="news-excerpt">${excerpt}…</p>
          <span class="news-more">Baca selengkapnya →</span>
        </div>
      </a>`;
  }).join("");
}

/* ===== PLAYLIST ===== */
async function loadPlaylists() {
  const el = document.getElementById("autoPlaylistGrid");
  if (!el) return;

  el.innerHTML = `<div class="news-loading">Memuat playlist…</div>`;

  try {
    const r = await fetch("/playlists?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!data.ok || !data.playlists?.length) throw new Error("Data kosong");

    el.innerHTML = data.playlists
      .map((p) => {
        const spotifySearch = encodeURIComponent(p.title);
        const cover = p.cover || "logo.png";
        return `
        <div class="playlist-card" data-id="${p.id}">
          <img class="playlist-cover" src="${cover}" alt="" loading="lazy"
            onerror="this.src='logo.png'" />
          <div class="playlist-body">
            <div class="playlist-title">${p.title}</div>
            <div class="playlist-desc">${p.desc || ""}</div>
            <div class="playlist-actions">
              <button type="button" class="playlist-btn deezer" data-play="${p.id}">
                Play
              </button>
              <a class="playlist-btn spotify"
                href="https://open.spotify.com/search/${spotifySearch}"
                target="_blank" rel="noopener">Spotify</a>
            </div>
          </div>
          <div class="playlist-embed-wrap">
            <iframe
              title="${p.title}"
              src="https://widget.deezer.com/widget/dark/playlist/${p.id}"
              allow="encrypted-media; clipboard-write"
              loading="lazy"></iframe>
          </div>
        </div>`;
      })
      .join("");

    // Toggle embed saat klik Play
    el.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".playlist-card");
        if (!card) return;
        const open = card.classList.contains("open");
        el.querySelectorAll(".playlist-card.open").forEach((c) =>
          c.classList.remove("open")
        );
        if (!open) card.classList.add("open");
      });
    });
  } catch (err) {
    el.innerHTML = `<div class="news-error">Gagal memuat playlist.<br /><small>${err.message}</small></div>`;
  }
}

// INIT
loadPlaylists();