// فحص تشخيصي لـMyFatoorah: يجرّب InitiatePayment بعملتين لعزل السبب
async function probe(base, token, cur) {
  try {
    const r = await fetch(base + '/v2/InitiatePayment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ InvoiceAmount: 5, CurrencyIso: cur })
    });
    return { status: r.status, body: (await r.text()).slice(0, 250) };
  } catch (e) { return { err: e.message }; }
}
module.exports = async (req, res) => {
  const BASE = (process.env.MYFATOORAH_BASE || '').trim();
  const TOKEN = (process.env.MYFATOORAH_TOKEN || '').trim();
  res.status(200).json({
    base: BASE,
    egp: await probe(BASE, TOKEN, 'EGP'),
    kwd: await probe(BASE, TOKEN, 'KWD')
  });
};
