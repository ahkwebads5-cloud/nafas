// خطة استمرار مجانية مخصّصة بالذكاء الاصطناعي (موديل أرخص) — بدون بوابة دفع
function num(n){ n = Number(n) || 0; return Math.round(n).toLocaleString('en-US'); }

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const d = body.data || {};
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }

  const KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!KEY) { res.status(500).json({ error: 'missing_anthropic_key' }); return; }
  const MODEL = (process.env.ANTHROPIC_FREE_MODEL || 'claude-haiku-4-5-20251001').trim();

  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  // حد الاستخدام: مرة كل أسبوع لكل عميل
  if (SB && SK) {
    try {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const q = await fetch(SB + '/rest/v1/free_usage?contact=eq.' + encodeURIComponent(contact) + '&created_at=gte.' + encodeURIComponent(since) + '&select=id&limit=1',
        { headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK } });
      if (q.ok) {
        const used = await q.json();
        if (Array.isArray(used) && used.length > 0) { res.status(429).json({ error: 'rate_limited' }); return; }
      }
    } catch (e) { /* لو الجدول لسه مش موجود نكمّل عادي */ }
  }

  const ctx = 'بيانات المشروع:\n' +
    '- الاسم: ' + (d.name || 'غير محدد') + ' | القطاع: ' + (d.sector || '') + ' | المرحلة: ' + (d.stage || '') + ' | البلد: ' + (d.country || '') + '\n' +
    '- الكاش المتاح: ' + num(d.cash) + ' ج.م | المصاريف الشهرية: ' + num(d.expenses) + ' ج.م | الإيراد الشهري: ' + num(d.revenue) + ' ج.م\n' +
    '- نمو الإيراد الشهري: ' + (d.growth || 0) + '% | النفس الحالي: ' + (d.runway >= 999 ? 'مؤمّن' : (d.runway + ' شهر')) + ' | المبلغ الناقص لهدف ' + (d.targetMonths || 18) + ' شهر: ' + num(d.needed) + ' ج.م\n';

  const prompt = ctx +
    '\nاكتب «خطة استمرار مخصّصة» لصاحب هذا المشروع تحديداً ليكمل 18-24 شهراً بدون تمويل خارجي.\n' +
    'شروط إلزامية:\n' +
    '- مبنية على أرقامه وقطاعه ومرحلته بالتحديد (اذكر أرقامه الفعلية داخل النص).\n' +
    '- عملية ومحددة جداً (خطوات ينفّذها بنفسه)، وممنوع منعاً باتاً النصائح العامة المكررة التي يعرفها الجميع.\n' +
    '- مرتّبة حسب خطورة وضعه (هل هو في خطر؟ قريب من التعادل؟ مؤمّن؟).\n' +
    'ضمّن هذه الأقسام بعناوين <h3>: (1) تشخيص سريع لوضعك بالأرقام. (2) أهم 3-4 تحرّكات محددة لتطويل النفس، مع تقدير أثر كل تحرّك بالأرقام. (3) روافع خاصة بقطاع «' + (d.sector || 'مشروعك') + '» تحديداً (بنود تكلفة يمكن خفضها أو مصادر إيراد سريعة مناسبة لهذا القطاع). (4) أهم مؤشر واحد يجب أن تراقبه شهرياً ولماذا.\n' +
    'أخرج HTML fragment نظيف فقط (استخدم <h3> و<p> و<ul><li> و<strong>) بالعربية المبسّطة، بدون ``` وبدون <html>. لا تكتب أي شيء خارج الخطة.';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1800, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    const blocks = data && Array.isArray(data.content) ? data.content : [];
    let html = blocks.filter(function(b){ return b.type === 'text' && b.text; }).map(function(b){ return b.text; }).join('\n');
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/,'').trim();
    if (html) {
      if (SB && SK) {
        try {
          await fetch(SB + '/rest/v1/free_usage', {
            method: 'POST',
            headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ contact: contact })
          });
        } catch (e) {}
      }
      res.status(200).json({ html: html });
    }
    else { res.status(400).json({ error: 'anthropic_error', detail: (data && data.error) || data }); }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
