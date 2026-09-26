export async function onRequest(context) {
  const API_KEY = context.env.YOUTUBE_API_KEY;
  const REGION = context.env.YOUTUBE_REGION || "ID";
  const LIMIT = context.env.YOUTUBE_TRENDING_LIMIT || "12";

  if (!API_KEY) {
    return json({ ok: false, songs: [], error: "YOUTUBE_API_KEY belum diset" }, "no-store");
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("chart", "mostPopular");
    url.searchParams.set("videoCategoryId", "10"); // 10 = Music
    url.searchParams.set("regionCode", REGION);
    url.searchParams.set("maxResults", LIMIT);
    url.searchParams.set("key", API_KEY);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || `YouTube API HTTP ${res.status}`);
    }

    const songs = (data.items || []).map((item, i) => ({
      title: item.snippet?.title || "Unknown",
      artist: item.snippet?.channelTitle || "Unknown",
      videoId: item.id,
      spotifySearch: `${item.snippet?.title || ""} ${item.snippet?.channelTitle || ""}`.trim(),
      rank: i + 1
    }));

    if (!songs.length) throw new Error("Data trending kosong");

    return json({ ok: true, songs, source: "youtube" });
  } catch (e) {
    return json({ ok: false, songs: [], error: String(e) }, "no-store");
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