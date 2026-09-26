async function getSpotifyToken(env) {
  const id = (env.SPOTIFY_CLIENT_ID || "").trim();
  const secret = (env.SPOTIFY_CLIENT_SECRET || "").trim();
  if (!id || !secret) throw new Error("SPOTIFY_CLIENT_ID/SECRET kosong");

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", id);
  body.set("client_secret", secret);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  const text = await res.text();
  if (!res.ok) throw new Error("Token HTTP " + res.status + ": " + text.slice(0, 200));
  const data = JSON.parse(text);
  if (!data.access_token) throw new Error("access_token tidak ada");
  return data.access_token;
}

const PLAYLIST_IDS = [
  "37i9dQZEVXbObFQW5LGdi",
  "37i9dQZEVXbK4NyLHKXdx3",
  "37i9dQZEVXbMDoHDwVN2tF",
  "37i9dQZF1DXcBWIGoYBM5M",
  "37i9dQZF1DX0XUsuxWHRQd",
  "37i9dQZF1DX4Wsb4d7NKfP",
  "37i9dQZF1DXcF6B6QPhFMv",
  "37i9dQZF1DX1lVhpfFs4f0"
];

export async function onRequest(context) {
  try {
    const token = await getSpotifyToken(context.env);
    const playlists = [];
    for (const id of PLAYLIST_IDS) {
      const res = await fetch(`https://api.spotify.com/v1/playlists/${id}?market=ID`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) continue;
      const item = await res.json();
      if (!item?.id) continue;
      playlists.push({
        id: item.id,
        title: item.name || "Playlist",
        desc: item.description
          ? String(item.description).replace(/<[^>]+>/g, "").slice(0, 100)
          : `${item.tracks?.total ?? "?"} tracks`,
        cover: item.images?.[0]?.url || null,
        link: item.external_urls?.spotify || `https://open.spotify.com/playlist/${item.id}`,
        rank: playlists.length + 1
      });
    }
    if (!playlists.length) throw new Error("Semua playlist gagal. Cek Client ID/Secret.");
    return new Response(JSON.stringify({ ok: true, playlists, source: "spotify" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, playlists: [], error: String(e) }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
}