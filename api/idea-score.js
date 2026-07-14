// تقييم فعالية الفكرة وقابليتها للتمويل — مجاني (موديل أرخص)
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const d = body.data || {};
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }
  if (!(d.idea && String(d.idea).trim())) { res.status(400).json({ error: 'idea_required' }); return; }

  const KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!KEY) { res.status(500).json({ error: 'missing_anthropic_key' }); return; }
  const MODEL = (process.env.ANTHROPIC_FREE_MODEL || 'claude-haiku-4-5-20251001').trim();

  const prompt =
    'فكرة المشروع: ' + d.idea + '\n' +
    'القطاع: ' + (d.sector || 'غير محدد') + ' | البلد/السوق: ' + (d.country || 'غير محدد') + '\n' +
    'العميل المستهدف: ' + (d.customer || 'غير محدد') + '\n' +
    'ما يميّزها (حسب صاحبها): ' + (d.diff || 'غير محدد') + '\n\n' +
    'أنت خبير تقييم أفكار ريادية واستثمار. قيّم هذه الفكرة تحديداً في سياق سوق وبلد «' + (d.country || '') + '» وقطاع «' + (d.sector || '') + '».\n' +
    'أخرج تقييماً عملياً صريحاً (مش مجاملة) يشمل بعناوين <h3>:\n' +
    '1) «التقييم العام»: درجة إجمالية من 100 بارزة + حكم من جملة (فكرة واعدة/متوسطة/تحتاج إعادة نظر).\n' +
    '2) «تفصيل الدرجات» في جدول HTML من 4 أبعاد، كل بُعد بدرجة /100 وسبب مختصر: (الطلب في السوق) و(جودة الفكرة وتميّزها) و(كفاءة/قابلية التنفيذ) و(قابلية التمويل).\n' +
    '3) «نقاط القوة» (قائمة).\n' +
    '4) «نقاط الضعف والمخاطر» (قائمة صريحة).\n' +
    '5) «قابلية التمويل»: هل هي قابلة للتمويل في هذا البلد/المرحلة؟ ومن أنسب ممول لها ولماذا؟\n' +
    '6) «توصيات لتقوية الفكرة» (3-5 خطوات عملية محددة).\n' +
    'راعِ واقع السوق والبلد المذكورين تحديداً. إن افترضت شيئاً اذكره كـ[افتراض]. أخرج HTML fragment نظيف فقط (h3, p, ul, table, strong) بدون ``` وبدون <html>.';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2200, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    const blocks = data && Array.isArray(data.content) ? data.content : [];
    let html = blocks.filter(function (b) { return b.type === 'text' && b.text; }).map(function (b) { return b.text; }).join('\n');
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
    if (html) { res.status(200).json({ html: html }); }
    else { res.status(400).json({ error: 'anthropic_error', detail: (data && data.error) || data }); }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
