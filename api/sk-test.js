// فحص: هل المفتاح السري بيقدر يكتب في unlocks (يتخطى RLS)؟
module.exports = async (req, res) => {
  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const prefix = SK.slice(0, 7);
  try {
    const r = await fetch(SB + '/rest/v1/unlocks', {
      method: 'POST',
      headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ contact: 'sk-test@nafas.app', status: 'paid', payment_id: 'SKTEST', amount: 5, currency: 'EGP' })
    });
    const txt = await r.text();
    res.status(200).json({ key_prefix: prefix, insert_status: r.status, body: txt.slice(0, 300) });
  } catch (e) {
    res.status(200).json({ key_prefix: prefix, error: e.message });
  }
};
