const KEY = "plays";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function cors(json, status = 200) {
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    }
  });
}

function normKey(artist, title) {
  return (artist + "||" + title).toLowerCase().trim();
}

export async function onRequest(context) {
  const kv = context.env?.HISTORY;
  if (!kv) {
    return cors({
      ok: false,
      songs: [],
      error: "KV HISTORY belum di-bind. Chart minggu ini belum aktif."
    });
  }

  let plays = [];
  try {
    const raw = await kv.get(KEY);
    if (raw) plays = JSON.parse(raw);
    if (!Array.isArray(plays)) plays = [];
  } catch {
    plays = [];
  }

  const now = Date.now();
  const week = plays.filter((p) => p.ts && now - p.ts <= WEEK_MS);

  const map = new Map();
  for (const p of week) {
    const k = normKey(p.artist || "", p.title || "");
    if (!k || k.includes("vadanya radio||vadanya")) continue;
    if (/adzan/i.test(p.title || "")) continue;
    const cur = map.get(k) || {
      title: p.title,
      artist: p.artist,
      raw: p.raw,
      count: 0,
      lastTs: 0
    };
    cur.count += 1;
    cur.lastTs = Math.max(cur.lastTs, p.ts || 0);
    map.set(k, cur);
  }

  const songs = [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs)
    .slice(0, 30)
    .map((s, i) => ({
      rank: i + 1,
      title: s.title,
      artist: s.artist,
      count: s.count,
      lastPlayed: s.lastTs ? new Date(s.lastTs).toISOString() : null
    }));

  return cors({
    ok: true,
    period: "7d",
    totalPlays: week.length,
    uniqueSongs: songs.length,
    songs
  });
}