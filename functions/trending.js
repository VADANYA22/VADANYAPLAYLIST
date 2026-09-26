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

export async function onRequest(context) {
  const PLAYLIST_ID = "37i9dQZEVXbObFQW5LGdi"; // Top 50 Indonesia

  try {
    const token = await getSpotifyToken(context.env);
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?market=ID&limit=12`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const t = await res.text();
      throw new Error("Spotify " + res.status + ": " + t.slice(0, 150));
    }

    const data = await res.json();
    const songs = (data.items || [])
      .map((row, i) => {
        const track = row?.track;
        if (!track?.name) return null;
        const artist = (track.artists || []).map((a) => a.name).join(", ") || "Unknown";
        return {
          title: track.name,
          artist,
          spotifySearch: `${track.name} ${artist}`,
          rank: i + 1,
          cover: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null
        };
      })
      .filter(Boolean);

    if (!songs.length) throw new Error("Track kosong");

    return new Response(JSON.stringify({ ok: true, songs, source: "spotify" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, songs: [], error: String(e) }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }
}