// فحص تشخيصي مؤقت: يعرض آخر صفوف unlocks للتأكد من التطابق
module.exports = async (req, res) => {
  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  try {
    const r = await fetch(SB + '/rest/v1/unlocks?select=contact,status,payment_id,created_at&order=created_at.desc&limit=10',
      { headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK } });
    const rows = await r.json();
    res.status(200).json({ count: Array.isArray(rows) ? rows.length : 0, rows: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
