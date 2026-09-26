export async function onRequest() {
  const url = "https://api.deezer.com/chart/0/playlists?limit=8";

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

    const playlists = list.map((item, i) => ({
      id: String(item.id),
      title: item.title || "Playlist",
      desc: item.user?.name
        ? `Oleh ${item.user.name} · ${item.nb_tracks || "?"} tracks`
        : `${item.nb_tracks || "?"} tracks`,
      cover: item.picture_medium || item.picture || null,
      link: item.link || `https://www.deezer.com/playlist/${item.id}`,
      rank: i + 1
    }));

    if (!playlists.length) throw new Error("Data kosong");

    return new Response(JSON.stringify({ ok: true, playlists }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=1800"
      }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, playlists: [], error: String(e) }),
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