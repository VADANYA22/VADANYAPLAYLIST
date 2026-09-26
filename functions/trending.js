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
          rank: i + 1
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