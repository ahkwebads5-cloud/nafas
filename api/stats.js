// إحصائيات سريعة (محمية بمفتاح ADMIN_KEY) — الاستخدام: /api/stats?key=YOUR_KEY
module.exports = async (req, res) => {
  const ADMIN = (process.env.ADMIN_KEY || '').trim();
  const key = (req.query.key || '').toString();
  if (!ADMIN || key !== ADMIN) { res.status(401).json({ error: 'unauthorized' }); return; }

  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  async function count(path) {
    const r = await fetch(SB + '/rest/v1/' + path, {
      headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Prefer': 'count=exact', 'Range': '0-0' }
    });
    const cr = r.headers.get('content-range') || '';
    const total = cr.split('/')[1];
    return total ? parseInt(total, 10) : 0;
  }

  try {
    const leads = await count('leads?select=id');
    const paid = await count('unlocks?select=id&status=eq.paid');
    let free = 0;
    try { free = await count('free_usage?select=id'); } catch (e) {}
    res.status(200).json({
      leads_registered: leads,
      paid_unlocks: paid,
      free_plans_used: free
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
