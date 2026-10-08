// Small in-memory rate limit so a public demo cannot burn through your AI key.
// It resets per server instance, which is fine for a hackathon.
const hits = new Map<string, { n: number; reset: number }>();

export function allow(req: Request, limit = 40, windowMs = 10 * 60 * 1000): boolean {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= limit;
}
