export async function onRequest() {
  const url = "https://itunes.apple.com/id/rss/topsongs/limit=12/json";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VadanyaRadio/1.0" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const entries = data?.feed?.entry || [];
    const songs = entries.map((item, i) => {
      const title = item["im:name"]?.label || "Unknown";
      const artist = item["im:artist"]?.label || "Unknown";
      return {
        title,
        artist,
        spotifySearch: `${title} ${artist}`,
        rank: i + 1
      };
    });
    return new Response(JSON.stringify({ ok: true, songs }), {
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