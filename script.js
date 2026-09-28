const STREAM_URL = "https://s1.free-shoutcast.com/stream/18194";
const RSS_FEEDS = [
  "https://www.antaranews.com/rss/hiburan.xml",
  "https://www.cnnindonesia.com/hiburan/rss"
];
const NEWS_LIMIT = 6;
const RSS_PROXY = "/rss?url=";
const DEFAULT_COVER = "logo.png";

(function () {
  document.body.classList.add("is-loading");
  function hideLoader() {
    const el = document.getElementById("pageLoader");
    if (el) {
      el.classList.add("is-done");
      setTimeout(() => el.remove(), 520);
    }
    document.body.classList.remove("is-loading");
  }
  const minTime = new Promise((r) => setTimeout(r, 800));
  const pageReady = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });
  Promise.all([minTime, pageReady]).then(hideLoader);
  setTimeout(hideLoader, 5000);
})();

(function () {
  const saved = localStorage.getItem("vadanya-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if ((saved || (prefersDark ? "dark" : "light")) === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
document.getElementById("themeToggle")?.addEventListener("click", () => {
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

/* Mobile menu */
(function () {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

const audio = document.getElementById("cpAudio");
const btn = document.getElementById("cpPlay");
const vol = document.getElementById("cpVol");
const cpTitle = document.getElementById("cpTitle");
const cpArtist = document.getElementById("cpArtist");
const cpArt = document.getElementById("cpArt");
const lyricsText = document.getElementById("lyricsText");
const miniPlay = document.getElementById("miniPlay");
const miniVol = document.getElementById("miniVol");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniArt = document.getElementById("miniArt");
const coverCache = new Map();
let lastKey = "";

function setPlaying(on) {
  btn?.classList.toggle("playing", on);
  miniPlay?.classList.toggle("playing", on);
}
function setTrack(title, artist) {
  const t = title || "Vadanya Radio";
  const a = artist || "Live";
  if (cpTitle) cpTitle.textContent = t;
  if (cpArtist) cpArtist.textContent = a;
  if (miniTitle) miniTitle.textContent = t;
  if (miniArtist) miniArtist.textContent = a;
}
function setCover(url) {
  const src = url || DEFAULT_COVER;
  const apply = (el) => {
    if (!el) return;
    const img = new Image();
    img.onload = () => { el.src = src; };
    img.onerror = () => { el.src = DEFAULT_COVER; };
    img.src = src;
  };
  apply(cpArt);
  apply(miniArt);
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
    const res = await fetch(
      "https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=music&entity=song&limit=1"
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.results?.[0];
    if (!item?.artworkUrl100) return null;
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
        lyricsText.textContent = plain.replace(/^\[.*?\]\s*/gm, "").trim();
        return;
      }
    }
    res = await fetch(
      "https://api.lyrics.ovh/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(title)
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
      if (data.nowplaying) await updateNowPlaying(data.nowplaying);
    }
  } catch (_) {}
}
function start() {
  if (!audio) return;
  const sep = STREAM_URL.includes("?") ? "&" : "?";
  audio.src = STREAM_URL + sep + "t=" + Date.now();
  audio.volume = vol ? +vol.value : miniVol ? +miniVol.value : 0.85;
  audio
    .play()
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
function syncVolume(fromMini) {
  if (!audio) return;
  if (fromMini && miniVol) {
    audio.volume = +miniVol.value;
    if (vol) vol.value = miniVol.value;
  } else if (vol) {
    audio.volume = +vol.value;
    if (miniVol) miniVol.value = vol.value;
  }
}
btn?.addEventListener("click", () => {
  if (audio && !audio.paused) stop();
  else start();
});
miniPlay?.addEventListener("click", () => {
  if (audio && !audio.paused) stop();
  else start();
});
vol?.addEventListener("input", () => syncVolume(false));
miniVol?.addEventListener("input", () => syncVolume(true));
pollNow();
setInterval(pollNow, 5000);

const listenersCount = document.getElementById("listenersCount");
async function pollListeners() {
  try {
    const r = await fetch("/listeners?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    if (listenersCount && data.ok) listenersCount.textContent = String(data.listeners ?? 0);
  } catch (_) {}
}
pollListeners();
setInterval(pollListeners, 15000);

async function loadTrending() {
  const el = document.getElementById("trendingGrid");
  if (!el) return;
  el.innerHTML = `<div class="news-loading">Memuat chart…</div>`;
  try {
    const r = await fetch("/trending?t=" + Date.now(), { cache: "no-store" });
    const text = await r.text();
    if (text.trim().startsWith("<")) throw new Error("Function /trending belum deploy");
    const data = JSON.parse(text);
    if (!data.ok || !data.songs?.length) throw new Error(data.error || "Data kosong");
    el.innerHTML = data.songs
      .map((song, i) => {
        const q = encodeURIComponent(song.spotifySearch || `${song.title} ${song.artist}`);
        return `<div class="trend-card"><div class="trend-top"><span class="trend-rank">${String(i + 1).padStart(2, "0")}</span><div class="trend-info"><div class="trend-title">${song.title}</div><div class="trend-artist">${song.artist}</div></div></div><a class="trend-btn spotify" href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener">Cari di Spotify</a></div>`;
      })
      .join("");
  } catch (err) {
    el.innerHTML = `<div class="news-error">Gagal memuat chart.<br /><small>${err.message}</small></div>`;
  }
}

async function loadPlaylists() {
  const el = document.getElementById("autoPlaylistGrid");
  if (!el) return;
  el.innerHTML = `<div class="news-loading">Memuat playlist…</div>`;
  try {
    const r = await fetch("/playlists?t=" + Date.now(), { cache: "no-store" });
    const text = await r.text();
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (text.trim().startsWith("<")) throw new Error("Function /playlists belum aktif");
    const data = JSON.parse(text);
    if (!data.ok || !Array.isArray(data.playlists) || !data.playlists.length) {
      throw new Error(data.error || "Data playlist kosong");
    }
    el.innerHTML = data.playlists
      .map((p) => {
        const id = String(p.id || "");
        const title = p.title || "Playlist";
        const desc = p.desc || "";
        const cover = p.cover || "logo.png";
        const q = encodeURIComponent(title);
        return `
        <div class="playlist-card" data-id="${id}">
          <img class="playlist-cover" src="${cover}" alt="" loading="lazy" onerror="this.onerror=null;this.src='logo.png'" />
          <div class="playlist-body">
            <div class="playlist-title">${title}</div>
            <div class="playlist-desc">${desc}</div>
            <div class="playlist-actions">
              <button type="button" class="playlist-btn play" data-play="${id}">Play</button>
              <a class="playlist-btn open" href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener">Spotify</a>
            </div>
          </div>
          <div class="playlist-embed-wrap">
            <iframe title="${title}" src="https://widget.deezer.com/widget/dark/playlist/${id}"
              allow="encrypted-media; clipboard-write" loading="lazy"></iframe>
          </div>
        </div>`;
      })
      .join("");
    el.querySelectorAll("[data-play]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = b.closest(".playlist-card");
        if (!card) return;
        const open = card.classList.contains("open");
        el.querySelectorAll(".playlist-card.open").forEach((c) => c.classList.remove("open"));
        if (!open) card.classList.add("open");
      });
    });
  } catch (err) {
    el.innerHTML = `<div class="news-error">Gagal memuat playlist.<br /><small>${err.message}</small></div>`;
  }
}

async function fetchNews() {
  const el = document.getElementById("newsGrid");
  if (!el) return;
  let lastError = null;
  for (const feedUrl of RSS_FEEDS) {
    try {
      const res = await fetch(RSS_PROXY + encodeURIComponent(feedUrl));
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      const items = xml.querySelectorAll("item");
      if (!items.length) throw new Error("Feed kosong");
      const news = [];
      for (let i = 0; i < Math.min(items.length, NEWS_LIMIT); i++) {
        const it = items[i];
        const desc = it.querySelector("description")?.textContent || "";
        let imgEl = it.querySelector("content[url], thumbnail[url], enclosure[url]");
        const image = imgEl
          ? imgEl.getAttribute("url")
          : (desc.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || "logo.png";
        news.push({
          title: it.querySelector("title")?.textContent?.trim() || "Tanpa judul",
          link: it.querySelector("link")?.textContent?.trim() || "#",
          pubDate: it.querySelector("pubDate")?.textContent?.trim() || "",
          desc,
          image
        });
      }
      el.innerHTML = news
        .map((n) => {
          const tmp = document.createElement("div");
          tmp.innerHTML = n.desc;
          const excerpt = (tmp.textContent || "").slice(0, 120);
          let date = "";
          try {
            const d = new Date(n.pubDate);
            if (!isNaN(d.getTime())) {
              const m = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
              date = `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
            }
          } catch (_) {}
          return `<a class="news-card" href="${n.link}" target="_blank" rel="noopener"><img class="news-thumb" src="${n.image}" alt="" loading="lazy" onerror="this.src='logo.png'" /><div class="news-body">${date ? `<span class="news-date">${date}</span>` : ""}<h3 class="news-title">${n.title}</h3><p class="news-excerpt">${excerpt}…</p><span class="news-more">Baca selengkapnya →</span></div></a>`;
        })
        .join("");
      return;
    } catch (err) {
      lastError = err;
    }
  }
  el.innerHTML = `<div class="news-error">Gagal memuat berita.<br /><small>${lastError?.message || ""}</small></div>`;
}

if (document.getElementById("newsGrid")) fetchNews();
if (document.getElementById("trendingGrid")) loadTrending();
if (document.getElementById("autoPlaylistGrid")) loadPlaylists();