import { store, listSubs, putSub, sendPush, vapid, parisNow, itemsFor } from "../lib/common.mjs";

// Tourne toutes les heures. À 7 h (Paris) : le rendez-vous du matin. À 17 h : rappel du quiz s'il n'est pas fait.
export default async () => {
  const { date, hour, dow } = parisNow();
  if (hour === 7 || hour === 17) {
    await vapid();
    for (const rec of await listSubs()) {
      const it = itemsFor(rec.cfg, date, dow);
      rec.sent = rec.sent || {}; rec.done = rec.done || {};
      let payload = null, tag = null;
      if (hour === 7 && it.list && it.list.length && !rec.sent[date + "m"]) {
        tag = "m";
        const l = it.list; const txt = l.length > 1 ? l.slice(0, -1).join(", ") + " et " + l[l.length - 1] : l[0];
        payload = { title: `Bonjour${rec.name ? " " + rec.name : ""} !`, body: `Votre matin à deux est arrivé : ${txt}.`, url: it.quiz ? "/#quiz" : "/#accueil" };
      }
      if (hour === 17 && it.quiz && !rec.done[date] && !rec.sent[date + "r"]) {
        tag = "r";
        payload = { title: "Plus qu'une heure", body: "Le quiz du jour se termine à 18 h. Il est encore temps de répondre !", url: "/#quiz" };
      }
      if (payload) {
        const ok = await sendPush(rec, payload);
        if (ok) {
          rec.sent[date + tag] = Date.now();
          const lim = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
          for (const k of Object.keys(rec.sent)) if (k.slice(0, 10) < lim) delete rec.sent[k];
          for (const k of Object.keys(rec.done)) if (k < lim) delete rec.done[k];
          await putSub(rec);
        }
      }
    }
  }
  if (hour === 3) {
    // Ménage : messages non relevés depuis plus de 30 jours.
    const st = store(); const { blobs } = await st.list({ prefix: "box/" }); const lim = Date.now() - 30 * 864e5;
    for (const b of blobs) { const ts = +((b.key.split("/").pop() || "").split("-")[0]); if (ts && ts < lim) await st.delete(b.key); }
  }
  return new Response("ok");
};

export const config = { schedule: "@hourly" };
