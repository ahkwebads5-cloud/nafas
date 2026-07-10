// ينشئ عملية دفع MyFatoorah ويرجّع رابط الدفع
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const name = (body.name || '').toString().trim() || 'عميل نَفَس';
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }

  const BASE = (process.env.MYFATOORAH_BASE || 'https://apitest.myfatoorah.com').trim();
  const TOKEN = (process.env.MYFATOORAH_TOKEN || '').trim();
  const SITE = (process.env.PUBLIC_SITE_URL || ('https://' + req.headers.host)).trim();
  const AMOUNT = Number((process.env.PRO_PRICE || '999').toString().trim()) || 999;
  if (!TOKEN) { res.status(500).json({ error: 'missing_myfatoorah_token' }); return; }

  try {
    const r = await fetch(BASE + '/v2/SendPayment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        InvoiceValue: AMOUNT,
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
      res.status(400).json({
        error: 'myfatoorah_error',
        message: data && data.Message,
        validation: data && data.ValidationErrors,
        raw: data
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
