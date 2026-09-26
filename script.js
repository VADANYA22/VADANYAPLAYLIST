const RSS_FEEDS = [
  "https://www.antaranews.com/rss/hiburan.xml",
  "https://www.antaranews.com/rss/terkini.xml"
];
const NEWS_LIMIT = 6;
const RSS_PROXY = "/rss?url=";

/* ===== TRENDING ===== */
const trendingSongs = [
  { title: "Teh Hijau", artist: "Tulus", platform: "both", spotifySearch: "Teh Hijau Tulus" },
  { title: "Sedia Aku Sebelum Hujan", artist: "Idgitaf", platform: "tt", spotifySearch: "Sedia Aku Sebelum Hujan" },
  { title: "Ada titik-titik di ujung doa", artist: "Sal Priadi", platform: "both", spotifySearch: "Ada titik-titik di ujung doa" },
  { title: "Foto kita blur", artist: "Sal Priadi", platform: "both", spotifySearch: "Foto kita blur" },
  { title: "Bandung", artist: "Yura Yunita", platform: "both", spotifySearch: "Bandung Yura Yunita" },
  { title: "Beauty and a Beat", artist: "Justin Bieber", platform: "both", spotifySearch: "Beauty and a Beat" }
];

/* ===== PLAYLISTS ===== */
const playlists = [
  { id: "3ALfwRrBuAuDGfYVTm12t0", title: "YANG GALAU COCOK NIH", desc: "Cocok buat yang lagi galau.", type: "featured", badge: "FEATURED" },
  { id: "5NcKcfEs2C6L77UtgEnVwr", title: "YG LAGI CINTA CINTAAN BET NIH", desc: "yg buat cinta cintaan cocok nih", type: "featured", badge: "FEATURED" },
  { id: "5RWmWLYZduxcpeuoR9LeqJ", title: "Enak dengerin malem malem", desc: "Lagu cocok buat kamu saat malem malem di kendaraan.", type: "new", badge: "NEW" },
  { id: "4S4uJ8Z6ZzZ9TEJ2KwQqRR", title: "LAGU POP YANG ENAK DIDENGERIN EN & IND", desc: "Lagu cocok buat kamu saat berkendara.", type: "hits", badge: "HITS" }
];

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

/* =====================================================
   BERITA OTOMATIS DARI RSS
   ===================================================== */
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
        const title = it.querySelector("title")?.textContent?.trim() || "Tanpa judul";
        const link = it.querySelector("link")?.textContent?.trim() || "#";
        const pubDate = it.querySelector("pubDate")?.textContent?.trim() || "";
        const desc = it.querySelector("description")?.textContent?.trim() || "";
        const image = extractImage(it, desc);
        news.push({ title, link, pubDate, desc, image });
      }

      renderNews(news);
      return; // sukses, berhenti
    } catch (err) {
      lastError = err;
      console.warn("Feed gagal:", feedUrl, err.message);
    }
  }

  // Semua feed gagal
  console.error("Semua feed gagal:", lastError);
  el.innerHTML = `
    <div class="news-error">
      Gagal memuat berita. Cek koneksi atau coba refresh.<br />
      <small>${lastError ? lastError.message : ""}</small>
    </div>`;
}

function extractImage(item, desc) {
  // 1. media:content
  let el = item.querySelector("content[url]");
  if (el) return el.getAttribute("url");

  // 2. media:thumbnail
  el = item.querySelector("thumbnail[url]");
  if (el) return el.getAttribute("url");

  // 3. enclosure
  el = item.querySelector("enclosure[url]");
  if (el) return el.getAttribute("url");

  // 4. img src di description
  const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return "logo.png"; // fallback
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
        <img class="news-thumb" src="${n.image}" alt="" loading="lazy"
          onerror="this.src='logo.png'" />
        <div class="news-body">
          ${date ? `<span class="news-date">${date}</span>` : ""}
          <h3 class="news-title">${n.title}</h3>
          <p class="news-excerpt">${excerpt}…</p>
          <span class="news-more">Baca selengkapnya →</span>
        </div>
      </a>`;
  }).join("");
}

/* =====================================================
   RENDER TRENDING & PLAYLIST
   ===================================================== */
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

/* ===== INIT ===== */
fetchNews();
renderTrending();
renderSection("featuredGrid", "featured");
renderSection("hitsGrid", "hits");
renderSection("newGrid", "new");
renderSection("allGrid", "all");