const STREAM_URL = "https://s1.free-shoutcast.com/stream/18194";
const RSS_FEEDS = [
  "https://www.antaranews.com/rss/hiburan.xml",
  "https://www.cnnindonesia.com/hiburan/rss"
];
const NEWS_LIMIT = 6;
const RSS_PROXY = "/rss?url=";
const DEFAULT_COVER = "logo.png";
const STORAGE_PLAY = "vadanya-playing";
const STORAGE_VOL = "vadanya-volume";

(function () {
  document.body.classList.add("is-loading");
  function hideLoader() {
    const el = document.getElementById("pageLoader");
    if (el) { el.classList.add("is-done"); setTimeout(() => el.remove(), 520); }
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
  if (isDark) { root.removeAttribute("data-theme"); localStorage.setItem("vadanya-theme", "light"); }
  else { root.setAttribute("data-theme", "dark"); localStorage.setItem("vadanya-theme", "dark"); }
});

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
const vinylDisc = document.getElementById("vinylDisc");
const miniPlay = document.getElementById("miniPlay");
const miniVol = document.getElementById("miniVol");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniArt = document.getElementById("miniArt");
const coverCache = new Map();
let lastKey = "";
let currentMeta = { title: "Vadanya Radio", artist: "Live", cover: DEFAULT_COVER };

function setPlaying(on) {
  btn?.classList.toggle("playing", on);
  miniPlay?.classList.toggle("playing", on);
  vinylDisc?.classList.toggle("is-spinning", on);
  try { sessionStorage.setItem(STORAGE_PLAY, on ? "1" : "0"); } catch (_) {}
}
function setTrack(title, artist) {
  const t = title || "Vadanya Radio";
  const a = artist || "Live";
  currentMeta.title = t;
  currentMeta.artist = a;
  if (cpTitle) cpTitle.textContent = t;
  if (cpArtist) cpArtist.textContent = a;
  if (miniTitle) miniTitle.textContent = t;
  if (miniArtist) miniArtist.textContent = a;
  updateMediaSession();
}
function setCover(url) {
  const src = url || DEFAULT_COVER;
  currentMeta.cover = src;
  const apply = (el) => {
    if (!el) return;
    const img = new Image();
    img.onload = () => { el.src = src; };
    img.onerror = () => { el.src = DEFAULT_COVER; };
    img.src = src;
  };
  apply(cpArt);
  apply(miniArt);
  updateMediaSession();
}
function updateMediaSession() {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMeta.title,
      artist: currentMeta.artist,
      album: "Vadanya Radio",
      artwork: [
        { src: currentMeta.cover, sizes: "400x400", type: "image/jpeg" },
        { src: DEFAULT_COVER, sizes: "96x96", type: "image/png" }
      ]
    });
    navigator.mediaSession.playbackState = audio && !audio.paused ? "playing" : "paused";
  } catch (_) {}
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
    const res = await fetch("https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=music&entity=song&limit=1");
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.results?.[0];
    if (!item?.artworkUrl100) return null;
    const art = item.artworkUrl100.replace(/\/\d+x\d+bb\./, "/400x400bb.");
    coverCache.set(q, art);
    return art;
  } catch (_) { return null; }
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
function getSavedVolume() {
  try {
    const v = parseFloat(sessionStorage.getItem(STORAGE_VOL));
    if (!isNaN(v) && v >= 0 && v <= 1) return v;
  } catch (_) {}
  return 0.85;
}
function saveVolume(v) {
  try { sessionStorage.setItem(STORAGE_VOL, String(v)); } catch (_) {}
}
function wasPlaying() {
  try { return sessionStorage.getItem(STORAGE_PLAY) === "1"; } catch (_) { return false; }
}
function start() {
  if (!audio) return;
  const sep = STREAM_URL.includes("?") ? "&" : "?";
  if (audio.paused || !audio.src.includes(STREAM_URL.split("?")[0])) {
    audio.src = STREAM_URL + sep + "t=" + Date.now();
  }
  const v = getSavedVolume();
  audio.volume = v;
  if (vol) vol.value = v;
  if (miniVol) miniVol.value = v;
  audio.play()
    .then(() => { setPlaying(true); updateMediaSession(); pollNow(); })
    .catch(() => { setPlaying(false); setTrack("Vadanya Radio", "Tap play untuk mulai"); });
}
function stop() {
  if (!audio) return;
  audio.pause();
  setPlaying(false);
  updateMediaSession();
}
function syncVolume(fromMini) {
  if (!audio) return;
  let v;
  if (fromMini && miniVol) { v = +miniVol.value; if (vol) vol.value = v; }
  else if (vol) { v = +vol.value; if (miniVol) miniVol.value = v; }
  else return;
  audio.volume = v;
  saveVolume(v);
}
btn?.addEventListener("click", () => { if (audio && !audio.paused) stop(); else start(); });
miniPlay?.addEventListener("click", () => { if (audio && !audio.paused) stop(); else start(); });
vol?.addEventListener("input", () => syncVolume(false));
miniVol?.addEventListener("input", () => syncVolume(true));

if ("mediaSession" in navigator) {
  try {
    navigator.mediaSession.setActionHandler("play", () => start());
    navigator.mediaSession.setActionHandler("pause", () => stop());
    navigator.mediaSession.setActionHandler("stop", () => stop());
  } catch (_) {}
}

(function resumeAcrossPages() {
  const v = getSavedVolume();
  if (vol) vol.value = v;
  if (miniVol) miniVol.value = v;
  if (audio) audio.volume = v;
  if (wasPlaying()) setTimeout(() => start(), 200);
})();

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
        const image = imgEl ? imgEl.getAttribute("url") : (desc.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || "logo.png";
        news.push({
          title: it.querySelector("title")?.textContent?.trim() || "Tanpa judul",
          link: it.querySelector("link")?.textContent?.trim() || "#",
          pubDate: it.querySelector("pubDate")?.textContent?.trim() || "",
          desc, image
        });
      }
      el.innerHTML = news.map((n) => {
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
      }).join("");
      return;
    } catch (err) { lastError = err; }
  }
  el.innerHTML = `<div class="news-error">Gagal memuat berita.<br /><small>${lastError?.message || ""}</small></div>`;
}
if (document.getElementById("newsGrid")) fetchNews();