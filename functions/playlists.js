export async function onRequest(context) {
  const API_KEY = context.env?.YOUTUBE_API_KEY || "PASTE_YOUTUBE_API_KEY_DISINI";
  const PLAYLISTS = [
    { id: "PLFgquLnL59alCl9oCgcAgGPKa9hha50Ug", title: "Top Hits", desc: "Hits di YouTube Music" },
    { id: "PL4fGSI1pDJn6jXS_Tv_N9B-Zb-H-J3eXD", title: "Trending Music", desc: "Trending musik" },
    { id: "PLrAXtmRdnEQy6nuLMfO0f4jK6cQfQfQfQ", title: "Chill Hits", desc: "Santai & enak" }
  ];
  try {
    const playlists = [];
    for (const p of PLAYLISTS) {
      let cover = null, title = p.title, desc = p.desc;
      if (API_KEY && !API_KEY.includes("PASTE")) {
        try {
          const r = await fetch(
            "https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=" + p.id + "&key=" + API_KEY
          );
          if (r.ok) {
            const d = await r.json();
            const item = d.items?.[0];
            if (item) {
              title = item.snippet?.title || title;
              desc = (item.snippet?.description || desc).slice(0, 90);
              cover = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null;
            }
          }
        } catch (_) {}
      }
      playlists.push({
        id: p.id,
        title,
        desc,
        cover,
        link: "https://music.youtube.com/playlist?list=" + p.id,
        youtubeEmbed: "https://www.youtube.com/embed/videoseries?list=" + p.id
      });
    }
    return new Response(JSON.stringify({ ok: true, playlists, source: "youtube" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=900" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, playlists: [], error: String(e) }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });
  }
}