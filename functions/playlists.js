export async function onRequest(context) {
  const API_KEY = context.env.YOUTUBE_API_KEY;
  const rawIds = context.env.YOUTUBE_PLAYLIST_IDS || "";
  const ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean);

  if (!API_KEY) {
    return json({ ok: false, playlists: [], error: "YOUTUBE_API_KEY belum diset" }, "no-store");
  }

  if (!ids.length) {
    return json(
      { ok: false, playlists: [], error: "YOUTUBE_PLAYLIST_IDS belum diset" },
      "no-store"
    );
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlists");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", ids.join(","));
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || `YouTube API HTTP ${res.status}`);
    }

    const byId = new Map((data.items || []).map((item) => [item.id, item]));

    const playlists = ids
      .map((id, i) => {
        const item = byId.get(id);
        if (!item) return null;

        const sn = item.snippet || {};
        const cd = item.contentDetails || {};
        const thumb =
          sn.thumbnails?.maxres ||
          sn.thumbnails?.high ||
          sn.thumbnails?.medium ||
          sn.thumbnails?.default;

        return {
          id: item.id,
          title: sn.title || "Playlist",
          desc: sn.channelTitle
            ? `Oleh ${sn.channelTitle} · ${cd.itemCount || "?"} tracks`
            : `${cd.itemCount || "?"} tracks`,
          cover: thumb?.url || null,
          link: `https://music.youtube.com/playlist?list=${item.id}`,
          rank: i + 1
        };
      })
      .filter(Boolean);

    if (!playlists.length) throw new Error("Data playlist kosong");

    return json({ ok: true, playlists, source: "youtube" });
  } catch (e) {
    return json({ ok: false, playlists: [], error: String(e) }, "no-store");
  }
}

function json(obj, cache = "public, max-age=1800") {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": cache
    }
  });
}