// يستقبل رجوع MyFatoorah بعد الدفع، يتأكد من الحالة، ويسجّل الفتح في Supabase
module.exports = async (req, res) => {
  const SITE = (process.env.PUBLIC_SITE_URL || ('https://' + req.headers.host)).trim();
  const paymentId = req.query.paymentId || req.query.PaymentId;
  const BASE = (process.env.MYFATOORAH_BASE || 'https://apitest.myfatoorah.com').trim();
  const TOKEN = (process.env.MYFATOORAH_TOKEN || '').trim();

  const redirect = (path) => { res.writeHead(302, { Location: SITE + path }); res.end(); };

  if (!paymentId || !TOKEN) { redirect('/?pay=fail'); return; }

  try {
    const r = await fetch(BASE + '/v2/GetPaymentStatus', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' })
    });
    const data = await r.json();
    const d = data && data.Data;
    const paid = d && d.InvoiceStatus === 'Paid';
    const ref = (d && d.CustomerReference) || '';
    const contact = ref.split('::')[0];
    const product = ref.split('::')[1] === 'idea' ? 'idea' : 'pro';

    if (paid && contact) {
      try {
        await fetch(process.env.SUPABASE_URL + '/rest/v1/unlocks', {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ contact: contact, payment_id: String(paymentId), amount: d.InvoiceValue, currency: 'EGP', status: 'paid', product: product })
        });
      } catch (e) { /* الدفع تم؛ لو فشل التسجيل نكمّل ونفتح للعميل */ }
      redirect('/?unlocked=' + encodeURIComponent(contact) + '&p=' + product);
      return;
    }
    redirect('/?pay=fail');
  } catch (e) {
    redirect('/?pay=error');
  }
};
