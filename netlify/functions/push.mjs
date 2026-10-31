import crypto from "node:crypto";
import { json, vapid, getSub, putSub, sendPush, store, isHex, who } from "../lib/common.mjs";

export default async (req) => {
  if (req.method === "GET") { const v = await vapid(); return json({ key: v.publicKey }); }
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b = {}; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  await vapid();
  const cfg = b.cfg && typeof b.cfg === "object" ? { plan: b.cfg.plan || null, week: Array.isArray(b.cfg.week) ? b.cfg.week.slice(0, 7) : null } : null;
  const box = isHex(b.box, 64) ? b.box : null;
  const name = typeof b.name === "string" ? b.name.slice(0, 40) : "";

  if (b.action === "sub") {
    const sub = b.sub;
    if (!sub || typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || !sub.keys) return json({ error: "bad_sub" }, 400);
    const id = crypto.createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 32);
    const old = (await getSub(id)) || {};
    await putSub({ id, sub: { endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh || ""), auth: String(sub.keys.auth || "") } }, who: who(b.who), name, box, cfg, done: old.done || {}, sent: old.sent || {}, ts: Date.now() });
    return json({ id });
  }
  const rec = await getSub(b.id);
  if (!rec) return json({ error: "unknown" }, 404);
  if (b.action === "cfg") { Object.assign(rec, { who: who(b.who), name, box: box || rec.box, cfg }); await putSub(rec); return json({ ok: true }); }
  if (b.action === "done") { if (typeof b.date === "string") rec.done[b.date.slice(0, 10)] = Date.now(); await putSub(rec); return json({ ok: true }); }
  if (b.action === "test") { const ok = await sendPush(rec, { title: "À Deux", body: "Les notifications fonctionnent. À demain 7 h !", url: "/#accueil" }); return json({ ok }, ok ? 200 : 502); }
  if (b.action === "unsub") { await store().delete("sub/" + rec.id); return json({ ok: true }); }
  return json({ error: "action" }, 400);
};

export const config = { path: "/api/push" };
