// يتأكد إذا كان العميل (بالإيميل/الموبايل) دفع وفتح "برو" قبل كده
module.exports = async (req, res) => {
  const contact = (req.query.contact || '').toString().trim();
  if (!contact) { res.status(400).json({ unlocked: false }); return; }
  try {
    const url = process.env.SUPABASE_URL + '/rest/v1/unlocks?contact=eq.' +
      encodeURIComponent(contact) + '&status=eq.paid&select=product';
    const r = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    const rows = await r.json();
    const arr = Array.isArray(rows) ? rows : [];
    const pro = arr.some(function (x) { return x.product === 'pro' || x.product == null; });
    const idea = arr.length > 0; // أي اشتراك مدفوع (مقياس أو برو) يفتح المقياس
    res.status(200).json({ pro: pro, idea: idea, unlocked: pro });
  } catch (e) {
    res.status(500).json({ pro: false, idea: false, unlocked: false });
  }
};
