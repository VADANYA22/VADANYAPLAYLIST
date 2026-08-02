/**
 * =====================================================
 *  CARA GANTI PLAYLIST:
 *  1. Buka Spotify → Share → Copy link to playlist
 *  2. Ambil ID (setelah /playlist/)
 *  3. Ganti "id", "title", "desc" di bawah
 * =====================================================
 */

const playlists = [
  {
    id: "3ALfwRrBuAuDGfYVTm12t0",
    title: "YANG GALAU COCOK NIH",
    desc: "Cocok buat yang lagi galau.",
    type: "featured",
    badge: "FEATURED"
  },
  {
    id: "5NcKcfEs2C6L77UtgEnVwr",
    title: "YG LAGI CINTA CINTAAN BET NIH",
    desc: "yg buat cinta cintaan cocok nih",
    type: "featured",
    badge: "FEATURED"
  },
  {
    id: "5RWmWLYZduxcpeuoR9LeqJ",
    title: "Enak dengerin malem malem",
    desc: "Lagu cocok buat kamu saat malem malem di kendaraan.",
    type: "new",
    badge: "NEW"
  },
    {
    id: "4S4uJ8Z6ZzZ9TEJ2KwQqRR",
    title: "LAGU POP YANG ENAK DIDENGERIN EN & IND",
    desc: "Lagu cocok buat kamu saat berkendara.",
    type: "hits",
    badge: "HITS"
  }
];

function createEmbedCard(p) {
  const badgeClass = p.type === "featured" ? "featured" : p.type === "hits" ? "hits" : "new";
  return `
    <div class="embed-card">
      <div class="embed-header">
        <h3 class="embed-title">${p.title}</h3>
        <span class="embed-badge ${badgeClass}">${p.badge}</span>
      </div>
      <p class="embed-desc">${p.desc}</p>
      <div class="embed-iframe-wrap">
        <iframe
          src="https://open.spotify.com/embed/playlist/${p.id}?utm_source=generator&theme=0"
          allowfullscreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy">
        </iframe>
      </div>
    </div>
  `;
}

function renderSection(containerId, filterType) {
  const list = filterType === "all" ? playlists : playlists.filter(p => p.type === filterType);
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = list.map(createEmbedCard).join("");
}

renderSection("featuredGrid", "featured");
renderSection("hitsGrid", "hits");
renderSection("newGrid", "new");
renderSection("allGrid", "all");