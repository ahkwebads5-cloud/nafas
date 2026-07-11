// محرّك توليد ملفات نَفَس برو عبر Claude API — مقفول لغير الدافعين
function num(n){ n = Number(n) || 0; return Math.round(n).toLocaleString('en-US'); }

function ctx(d){
  return 'بيانات المشروع (استخدمها كأساس واذكر الأرقام حيثما يناسب):\n' +
    '- الاسم/المشروع: ' + (d.name || 'غير محدد') + '\n' +
    '- القطاع: ' + (d.sector || '') + '\n' +
    '- المرحلة: ' + (d.stage || '') + '\n' +
    '- البلد: ' + (d.country || '') + '\n' +
    '- الكاش المتاح: ' + num(d.cash) + ' ج.م\n' +
    '- المصاريف الشهرية: ' + num(d.expenses) + ' ج.م\n' +
    '- الإيراد الشهري: ' + num(d.revenue) + ' ج.م\n' +
    '- نمو الإيراد الشهري: ' + (d.growth || 0) + '%\n' +
    '- النفس الحالي: ' + (d.runway >= 999 ? 'مؤمّن' : (d.runway + ' شهر')) + '\n' +
    '- هدف الأمان: ' + (d.targetMonths || 18) + ' شهر\n' +
    '- المبلغ المطلوب تجميعه: ' + num(d.needed) + ' ج.م\n';
}

var COMMON = '\n\nاكتب المخرجات بالعربية الفصحى المبسّطة الاحترافية على هيئة HTML نظيف (fragment فقط، بدون <html> أو <head> أو <body> أو <script> أو ```). استخدم <h3> للعناوين، و<p> و<ul><li> و<table> عند الحاجة. اجعل المحتوى محدداً وواقعياً ومبنياً على أرقام المشروع، وتجنّب الكلام العام والحشو. لا تكتب أي شيء خارج المستند نفسه.';

var TASKS = {
  readiness: 'جهّز «ملف جاهزية للتمويل» احترافي يشمل: ملخص تنفيذي قصير، تقييم للوضع المالي بالأرقام، درجة جاهزية من 100 مع تبرير مختصر، جدول checklist للمستندات (المتوفر غالباً والناقص المطلوب لجولة تمويل)، وأهم 3 خطوات عملية لرفع الجاهزية.',
  feasibility: 'جهّز «دراسة جدوى مبسطة احترافية» تشمل: نبذة عن الفكرة والقطاع، تحليل السوق المستهدف في بلد المشروع، نموذج الإيراد، جدول توقعات مالية تقديرية لـ3 سنوات مبني على الأرقام الحالية ونسبة النمو، نقطة التعادل، وأهم 3–5 مخاطر وطرق تخفيفها. نبّه أن التوقعات تقديرية.',
  deck: 'جهّز محتوى «عرض تقديمي للمستثمرين (Pitch Deck)» من 10 شرائح. لكل شريحة عنوان <h3> يبدأ برقمها ونقاط مختصرة قوية: 1) المشكلة 2) الحل 3) المنتج 4) حجم السوق 5) نموذج الربح 6) الجذب والأرقام الحالية 7) المنافسة والميزة 8) خطة النمو 9) الفريق (اترك [placeholder] للتعبئة) 10) التمويل المطلوب وأوجه استخدامه (استخدم المبلغ المطلوب). اجعلها جاهزة للنقل إلى شرائح.',
  emails: 'جهّز حزمة تواصل مع المستثمرين تشمل بعناوين واضحة: (أ) قائمة بأنواع وأمثلة المستثمرين والجهات المناسبة لقطاع ومرحلة المشروع في بلده. (ب) إيميل تواصل بارد احترافي قصير. (ج) إيميل متابعة. (د) رسالة تعريف قصيرة (LinkedIn/واتساب). خصّصها للمشروع واستخدم placeholders واضحة مثل [اسم المستثمر] و[اسمك].',
  captable: 'جهّز «هيكل ملكية (Cap Table) تقديري» في جدول يوضح: حصص المؤسسين قبل الجولة، ثم أثر جمع المبلغ المطلوب على الحصص بافتراض تقييم تقديري معقول لمرحلة المشروع (اذكر الافتراض صراحة)، والنسبة المقترح التنازل عنها للمستثمر. أضف شرحاً مبسطاً وتحذيراً أن الأرقام للاسترشاد والتفاوض فقط.'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const docType = (body.docType || '').toString().trim();
  const data = body.data || {};
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }
  if (!TASKS[docType]) { res.status(400).json({ error: 'bad_doctype' }); return; }

  // بوابة: لازم يكون دفع
  const SB = (process.env.SUPABASE_URL || '').trim();
  const SK = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  try {
    const u = await fetch(SB + '/rest/v1/unlocks?contact=eq.' + encodeURIComponent(contact) + '&status=eq.paid&select=id&limit=1',
      { headers: { 'apikey': SK, 'Authorization': 'Bearer ' + SK } });
    const rows = await u.json();
    if (!(Array.isArray(rows) && rows.length > 0)) { res.status(403).json({ error: 'not_unlocked' }); return; }
  } catch (e) { res.status(500).json({ error: 'unlock_check_failed' }); return; }

  const KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!KEY) { res.status(500).json({ error: 'missing_anthropic_key' }); return; }
  const MODEL = (process.env.ANTHROPIC_MODEL || 'claude-sonnet-5').trim();

  const prompt = ctx(data) + '\nالمطلوب: ' + TASKS[docType] + COMMON;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] })
    });
    const d = await r.json();
    if (d && d.content && d.content[0] && d.content[0].text) {
      let html = d.content[0].text.replace(/^```html\s*/i, '').replace(/```$/,'').trim();
      res.status(200).json({ html: html });
    } else {
      res.status(400).json({ error: 'anthropic_error', detail: (d && d.error) || d });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
