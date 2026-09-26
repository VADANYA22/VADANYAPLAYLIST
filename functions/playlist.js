async function getSpotifyToken(env) {
  const id = env.SPOTIFY_CLIENT_ID;
  const secret = env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("SPOTIFY_CLIENT_ID/SECRET belum di-set");

  const basic = btoa(`${id}:${secret}`);
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!res.ok) throw new Error("Token gagal HTTP " + res.status);
  return (await res.json()).access_token;
}

// Beberapa playlist resmi Spotify (bisa diganti)
const PLAYLIST_IDS = [
  "37i9dQZEVXbObFQW5LGdi", // Top 50 - Indonesia
  "37i9dQZEVXbK4NyLHKXdx3", // Viral 50 - Indonesia
  "37i9dQZEVXbMDoHDwVN2tF", // Top 50 - Global
  "37i9dQZF1DXcBWIGoYBM5M", // Today's Top Hits
  "37i9dQZF1DX0XUsuxWHRQd", // RapCaviar
  "37i9dQZF1DX4Wsb4d7NKfP", // Pop Rising
  "37i9dQZF1DXcF6B6QPhFMv", // Rock Classics
  "37i9dQZF1DX1lVhpfFs4f0"  // Soft Pop Hits
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

    if (!playlists.length) throw new Error("Semua playlist gagal di-load. Cek Client ID/Secret.");

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