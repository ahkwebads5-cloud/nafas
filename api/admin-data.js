// بيانات لوحة التحكم (محمية بـADMIN_KEY) — POST {key}
module.exports = async (req, res) => {
  const ADMIN = (process.env.ADMIN_KEY || '').trim();
  const key = ((req.body && req.body.key) || req.query.key || '').toString();
  if (!ADMIN || key !== ADMIN) { res.status(401).json({ error: 'unauthorized' }); return; }

  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const H = { 'apikey': SK, 'Authorization': 'Bearer ' + SK };

  async function count(path) {
    const r = await fetch(SB + '/rest/v1/' + path, { headers: Object.assign({ 'Prefer': 'count=exact', 'Range': '0-0' }, H) });
    const cr = r.headers.get('content-range') || '';
    const t = cr.split('/')[1];
    return t ? parseInt(t, 10) : 0;
  }

  try {
    const lr = await fetch(SB + '/rest/v1/leads?select=created_at,name,contact,sector,stage,country,cash,expenses,revenue,amount_needed&order=created_at.desc&limit=1000', { headers: H });
    const leads = await lr.json();

    const byCountry = {}, contacts = {}, bySector = {};
    (Array.isArray(leads) ? leads : []).forEach(function (l) {
      if (l.country) byCountry[l.country] = (byCountry[l.country] || 0) + 1;
      if (l.sector) bySector[l.sector] = (bySector[l.sector] || 0) + 1;
      if (l.contact) contacts[l.contact] = 1;
    });
    const sortMap = function (m) { return Object.keys(m).map(function (k) { return { name: k, count: m[k] }; }).sort(function (a, b) { return b.count - a.count; }); };

    const total_leads = await count('leads?select=id');
    const paid = await count('unlocks?select=id&status=eq.paid&payment_id=neq.owner-access');
    let free = 0; try { free = await count('free_usage?select=id'); } catch (e) {}

    res.status(200).json({
      stats: { total_leads: total_leads, unique_contacts: Object.keys(contacts).length, paid_unlocks: paid, free_plans_used: free },
      by_country: sortMap(byCountry),
      by_sector: sortMap(bySector),
      leads: Array.isArray(leads) ? leads : []
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
