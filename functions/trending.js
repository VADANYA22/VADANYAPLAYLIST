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
  // Top 50 - Indonesia (playlist resmi Spotify Charts)
  // Bisa diganti Viral 50 Indonesia, dll.
  const PLAYLIST_ID = "37i9dQZEVXbObFQW5LGdi";

  try {
    const token = await getSpotifyToken(context.env);

    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?market=ID&limit=12`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "VadanyaRadio/1.0"
        }
      }
    );

    if (!res.ok) {
      const t = await res.text();
      throw new Error("Spotify API " + res.status + ": " + t.slice(0, 180));
    }

    const data = await res.json();
    const items = data?.items || [];

    const songs = items
      .map((row, i) => {
        const track = row?.track;
        if (!track || !track.name) return null;
        const artist = (track.artists || []).map((a) => a.name).filter(Boolean).join(", ") || "Unknown";
        const title = track.name;
        return {
          title,
          artist,
          spotifySearch: `${title} ${artist}`,
          rank: i + 1,
          cover: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null,
          url: track.external_urls?.spotify || null
        };
      })
      .filter(Boolean);

    if (!songs.length) throw new Error("Track kosong");

    return new Response(
      JSON.stringify({ ok: true, songs, source: "spotify", playlist: PLAYLIST_ID }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=1800"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, songs: [], error: String(e) }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}