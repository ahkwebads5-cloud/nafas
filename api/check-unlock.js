// يتأكد إذا كان العميل (بالإيميل/الموبايل) دفع وفتح "برو" قبل كده
module.exports = async (req, res) => {
  const contact = (req.query.contact || '').toString().trim();
  if (!contact) { res.status(400).json({ unlocked: false }); return; }
  try {
    const url = process.env.SUPABASE_URL + '/rest/v1/unlocks?contact=eq.' +
      encodeURIComponent(contact) + '&status=eq.paid&select=id&limit=1';
    const r = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    const rows = await r.json();
    res.status(200).json({ unlocked: Array.isArray(rows) && rows.length > 0 });
  } catch (e) {
    res.status(500).json({ unlocked: false });
  }
};
