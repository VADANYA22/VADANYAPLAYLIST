export async function onRequest() {
  try {
    const res = await fetch("https://api.deezer.com/chart/0/tracks?limit=12", {
      headers: { "User-Agent": "VadanyaRadio/1.0", Accept: "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const songs = (data?.data || []).map((item, i) => ({
      title: item.title_short || item.title || "Unknown",
      artist: item.artist?.name || "Unknown",
      spotifySearch: `${item.title_short || item.title} ${item.artist?.name || ""}`,
      rank: i + 1
    }));
    if (!songs.length) throw new Error("Data kosong");
    return new Response(JSON.stringify({ ok: true, songs, source: "deezer" }), {
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