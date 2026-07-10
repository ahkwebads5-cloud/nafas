// ينشئ عملية دفع MyFatoorah ويرجّع رابط الدفع
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const name = (body.name || '').toString().trim() || 'عميل نَفَس';
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }

  const BASE = process.env.MYFATOORAH_BASE || 'https://apitest.myfatoorah.com';
  const TOKEN = process.env.MYFATOORAH_TOKEN;
  const SITE = process.env.PUBLIC_SITE_URL || ('https://' + req.headers.host);
  if (!TOKEN) { res.status(500).json({ error: 'missing_myfatoorah_token' }); return; }

  try {
    const r = await fetch(BASE + '/v2/SendPayment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        InvoiceValue: 999,
        CustomerName: name,
        DisplayCurrencyIso: 'EGP',
        NotificationOption: 'LNK',
        Language: 'AR',
        CustomerReference: contact,
        CallBackUrl: SITE + '/api/payment-callback',
        ErrorUrl: SITE + '/api/payment-callback'
      })
    });
    const data = await r.json();
    if (data && data.IsSuccess && data.Data && data.Data.InvoiceURL) {
      res.status(200).json({ url: data.Data.InvoiceURL, invoiceId: data.Data.InvoiceId });
    } else {
      res.status(400).json({ error: 'myfatoorah_error', detail: (data && data.Message) || data });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
