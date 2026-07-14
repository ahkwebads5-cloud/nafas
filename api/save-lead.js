// حفظ العميل مع تدقيق الإيميل (شكل + نطاق حقيقي MX) أو رقم الموبايل
const dns = require('dns').promises;

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validPhone(p) { const d = (p || '').replace(/[^\d]/g, ''); return d.length >= 8 && d.length <= 15; }

async function domainReceivesMail(domain) {
  try { const mx = await dns.resolveMx(domain); if (mx && mx.length) return true; } catch (e) {}
  try { const a = await dns.resolve(domain); if (a && a.length) return true; } catch (e) {}
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const lead = (req.body && req.body.lead) || {};
  const contact = (lead.contact || '').toString().trim();
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }

  const isEmail = contact.indexOf('@') > -1;
  if (isEmail) {
    if (!validEmail(contact)) { res.status(400).json({ error: 'invalid_email' }); return; }
    const ok = await domainReceivesMail(contact.split('@')[1].toLowerCase());
    if (!ok) { res.status(400).json({ error: 'email_domain_unreachable' }); return; }
  } else {
    if (!validPhone(contact)) { res.status(400).json({ error: 'invalid_phone' }); return; }
  }

  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  try {
    const r = await fetch(SB + '/rest/v1/leads', {
      method: 'POST',
      headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        name: lead.name || null, contact: contact, sector: lead.sector, stage: lead.stage, country: lead.country,
        cash: lead.cash, expenses: lead.expenses, revenue: lead.revenue, growth: lead.growth,
        target_months: lead.target_months, runway_months: lead.runway_months, amount_needed: lead.amount_needed
      })
    });
    if (r.ok) { res.status(200).json({ ok: true, type: isEmail ? 'email' : 'phone' }); }
    else { res.status(500).json({ error: 'save_failed' }); }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
