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
  if (!res.ok) throw new Error("Token Spotify gagal: HTTP " + res.status);
  const data = await res.json();
  return data.access_token;
}

export async function onRequest(context) {
  try {
    const token = await getSpotifyToken(context.env);
    const res = await fetch(
      "https://api.spotify.com/v1/browse/featured-playlists?country=ID&limit=8&locale=id_ID",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error("Spotify API " + res.status + ": " + t.slice(0, 180));
    }
    const data = await res.json();
    const items = data?.playlists?.items || [];
    const playlists = items.filter(Boolean).map((item, i) => ({
      id: item.id,
      title: item.name || "Playlist",
      desc: item.description
        ? item.description.replace(/<[^>]+>/g, "").slice(0, 100)
        : `${item.tracks?.total ?? "?"} tracks`,
      cover: item.images?.[0]?.url || null,
      link: item.external_urls?.spotify || `https://open.spotify.com/playlist/${item.id}`,
      rank: i + 1
    }));
    if (!playlists.length) throw new Error("Playlist kosong");
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