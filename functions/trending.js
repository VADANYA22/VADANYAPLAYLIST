export async function onRequest(context) {
  const API_KEY = context.env?.YOUTUBE_API_KEY || "PASTE_YOUTUBE_API_KEY_DISINI";
  try {
    if (!API_KEY || API_KEY.includes("PASTE")) throw new Error("Set YOUTUBE_API_KEY");
    const url =
      "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&regionCode=ID&maxResults=12&key=" +
      API_KEY;
    const res = await fetch(url);
    if (!res.ok) throw new Error("YouTube " + res.status);
    const data = await res.json();
    const songs = (data.items || []).map((item, i) => {
      const videoId = item.id;
      return {
        title: item.snippet?.title || "Unknown",
        artist: item.snippet?.channelTitle || "YouTube Music",
        videoId,
        cover: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
        youtubeUrl: "https://music.youtube.com/watch?v=" + videoId,
        youtubeWatch: "https://www.youtube.com/watch?v=" + videoId,
        rank: i + 1
      };
    });
    if (!songs.length) throw new Error("Data kosong");
    return new Response(JSON.stringify({ ok: true, songs, source: "youtube" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=1800" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, songs: [], error: String(e) }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }
    });
  }
}