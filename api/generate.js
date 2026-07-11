// محرّك توليد ملفات نَفَس برو عبر Claude API (مع بحث ويب) — مقفول لغير الدافعين
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

var COMMON = '\n\n=== قواعد الجودة (إلزامية) ===\n' +
  '1) العمق: اكتب مستنداً احترافياً مفصّلاً وطويلاً كافياً ليُقدَّم لمستثمر أو بنك. ممنوع الاختصار المخل أو النقاط السطحية. اشرح كل قسم بعمق.\n' +
  '2) بيانات السوق: قدّم تحليلاً كمياً للسوق بأرقام واقعية قدر الإمكان، مع وضع كل رقم بين قوسين ووصفه بأنه (تقديري — يُنصح بمراجعته من مصدر رسمي مثل جهاز الإحصاء أو تقارير القطاع). لا تقدّم أرقاماً دقيقة كأنها حقائق مؤكدة موثّقة.\n' +
  '3) جداول: قدّم كل الأرقام في جداول HTML منسّقة (توقعات مالية 3 سنوات، اقتصاديات الوحدة، مقارنة المنافسين، شرائح السوق) باستخدام <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">.\n' +
  '4) رسم بياني: أدرج رسماً بيانياً واحداً على الأقل كـ<svg> إنلاين بسيط (أعمدة أو خطوط) يوضّح رقماً مهماً مثل توقعات الإيراد أو نمو السوق (استخدم عرض 100% وارتفاع ~220، ألوان أخضر #0e9f6e).\n' +
  '5) اعتمد بالكامل على التفاصيل التي قدّمها صاحب المشروع ووسّعها بعمق؛ لا تتجاهلها. إن نقصت معلومة، ضع افتراضاً واقعياً واذكر [افتراض] صراحة.\n' +
  '6) الشكل: أخرج HTML fragment نظيف فقط (بدون <html> أو <head> أو <body> أو <script> أو ```). استخدم <h2> للعنوان الرئيسي و<h3> للأقسام و<p> و<ul> و<table> و<svg>. اكتب بالعربية الفصحى الاحترافية.';

var TASKS = {
  readiness: 'أنشئ «ملف جاهزية للتمويل» احترافياً ومفصّلاً يشمل: ملخص تنفيذي، تقييم مالي معمّق بالأرقام مع جدول، درجة جاهزية من 100 مع تبرير مفصّل لكل معيار، جدول checklist شامل للمستندات المطلوبة لجولة تمويل (المتوفر/الناقص)، تحليل نقاط القوة والفجوات، وخطة عملية مرحلية لرفع الجاهزية.',
  feasibility: 'أنشئ «دراسة جدوى احترافية كاملة» بعمق حقيقي تشمل: (1) ملخص تنفيذي، (2) وصف تفصيلي للفكرة والمنتج، (3) تحليل السوق بأرقام حقيقية من البحث (حجم السوق TAM/SAM/SOM، معدل النمو، اتجاهات المستهلك) مع ذكر المصادر، (4) تحليل المنافسين في جدول، (5) الخطة التسويقية والتشغيلية، (6) الدراسة المالية: اقتصاديات الوحدة + جدول توقعات مالية 3 سنوات + نقطة التعادل + رسم بياني للإيراد، (7) تحليل المخاطر وسبل تخفيفها، (8) الخلاصة والتوصية. يجب أن تكون دراسة كاملة لا تُختصر في صفحتين.',
  deck: 'أنشئ محتوى «عرض تقديمي للمستثمرين (Pitch Deck)» قوياً ومقنعاً من 12 شريحة، كل شريحة بعنوان <h3> ومحتوى غني (فقرة + نقاط قوية، وليست نقطة سطحية): 1) الغلاف والرؤية 2) المشكلة (بأرقام حقيقية من البحث) 3) الحل بتفصيل مقنع 4) المنتج وأهم مميزاته 5) حجم السوق (TAM/SAM/SOM بأرقام حقيقية ومصادر + رسم بياني) 6) نموذج الربح بالأرقام واقتصاديات الوحدة 7) الجذب والأرقام الحالية 8) المنافسة والميزة (جدول) 9) خطة النمو بأرقام وأهداف 10) الفريق [placeholder] 11) التوقعات المالية (جدول) 12) طلب التمويل وأوجه استخدامه. أبرِز كل شريحة بقوة.',
  emails: 'أنشئ حزمة تواصل استثمارية احترافية تشمل: (1) قائمة مفصّلة بأنواع وأمثلة المستثمرين والجهات المناسبة لقطاع ومرحلة المشروع في بلده (ابحث عن أسماء حقيقية إن أمكن)، (2) إيميل تواصل بارد قوي ومخصّص، (3) إيميل متابعة، (4) رسالة تعريف قصيرة، (5) نصائح للتعامل مع المستثمرين. اجعلها مخصّصة ومقنعة مع placeholders واضحة.',
  captable: 'أنشئ «هيكل ملكية (Cap Table) وتحليل تمويل» احترافياً يشمل: جدول الملكية قبل الجولة، تقدير تقييم واقعي للمرحلة (مع ذكر منطق التقييم ومقارنات من السوق إن أمكن عبر البحث)، جدول ما بعد الجولة يوضّح الحصص والتخفيف (dilution)، سيناريوهات مختلفة للنسبة والتقييم في جدول، وشرح وتحذير أن الأرقام للتفاوض. أضف رسماً بيانياً لتوزيع الملكية.'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const docType = (body.docType || '').toString().trim();
  const data = body.data || {};
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }
  if (!TASKS[docType]) { res.status(400).json({ error: 'bad_doctype' }); return; }

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

  const answers = body.answers || {};
  const aKeys = Object.keys(answers).filter(function(k){ return answers[k] && String(answers[k]).trim(); });
  let answersText = '';
  if (aKeys.length) {
    answersText = '\n\nتفاصيل قدّمها صاحب المشروع (اعتمد عليها كأساس ووسّعها ولا تخالفها):\n' +
      aKeys.map(function(k){ return '- ' + k + ': ' + answers[k]; }).join('\n');
  }

  const prompt = ctx(data) + answersText + '\n\nالمطلوب: ' + TASKS[docType] + COMMON;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const d = await r.json();
    const blocks = d && Array.isArray(d.content) ? d.content : [];
    let html = blocks.filter(function(b){ return b.type === 'text' && b.text; }).map(function(b){ return b.text; }).join('\n');
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/,'').trim();
    if (html) {
      res.status(200).json({ html: html });
    } else {
      res.status(400).json({ error: 'anthropic_error', detail: (d && d.error) || d });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
