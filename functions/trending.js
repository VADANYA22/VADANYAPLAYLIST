export async function onRequest() {
  // Chart global Deezer (stabil dari Workers)
  // Alternatif Indonesia-ish: tetap chart utama, cukup update otomatis
  const url = "https://api.deezer.com/chart/0/tracks?limit=12";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VadanyaRadio/1.0",
        "Accept": "application/json"
      }
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const list = data?.data || [];

    const songs = list.map((item, i) => {
      const title = item.title_short || item.title || "Unknown";
      const artist = item.artist?.name || "Unknown";
      return {
        title,
        artist,
        spotifySearch: `${title} ${artist}`,
        rank: i + 1,
        cover: item.album?.cover_medium || null
      };
    });

    if (!songs.length) throw new Error("Data kosong");

    return new Response(JSON.stringify({ ok: true, songs }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800"
      }
    });
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