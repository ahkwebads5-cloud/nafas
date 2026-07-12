// محرّك توليد ملفات نَفَس برو — بالأقسام (كل قسم مكالمة مستقلة، بعضها ببحث ويب)
function num(n){ n = Number(n) || 0; return Math.round(n).toLocaleString('en-US'); }

function ctx(d){
  return 'بيانات المشروع:\n' +
    '- الاسم/المشروع: ' + (d.name || 'غير محدد') + '\n' +
    '- القطاع: ' + (d.sector || '') + '\n' +
    '- المرحلة: ' + (d.stage || '') + '\n' +
    '- البلد: ' + (d.country || '') + '\n' +
    '- الكاش المتاح: ' + num(d.cash) + ' ج.م | المصاريف الشهرية: ' + num(d.expenses) + ' ج.م | الإيراد الشهري: ' + num(d.revenue) + ' ج.م\n' +
    '- نمو الإيراد الشهري: ' + (d.growth || 0) + '% | النفس: ' + (d.runway >= 999 ? 'مؤمّن' : (d.runway + ' شهر')) + ' | هدف الأمان: ' + (d.targetMonths || 18) + ' شهر\n' +
    '- المبلغ المطلوب تجميعه: ' + num(d.needed) + ' ج.م\n';
}

var FMT = ' اكتب هذا القسم فقط بعمق وتفصيل احترافي (بدون مقدمات عامة أو تكرار). أخرج HTML fragment نظيف فقط (بدون ``` أو <html>). استخدم <h3> للعناوين الفرعية، و<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"> لأي أرقام، و<ul> عند اللزوم. اعتمد على تفاصيل صاحب المشروع ووسّعها؛ وإن نقصت معلومة ضع [افتراض] صريحاً.';
var SEARCH_NOTE = ' مهم: استخدم أداة البحث في الويب للحصول على أرقام وإحصائيات حقيقية حديثة، واذكر المصدر (اسم الجهة + السنة) بعد كل رقم مهم. لا تخترع أرقاماً.';
var CHART_NOTE = ' أدرج رسم <svg> إنلاين بسيط (أعمدة أو خطوط، عرض 100%، ارتفاع ~220، لون أخضر #0e9f6e) يوضّح الأرقام الأساسية.';

var DOCLABEL = { readiness:'ملف الجاهزية للتمويل', feasibility:'دراسة الجدوى', deck:'العرض التقديمي للمستثمرين', emails:'حزمة التواصل مع المستثمرين', captable:'هيكل الملكية' };

var SECTIONS = {
  feasibility: [
    { title:'ملخص تنفيذي ووصف المشروع', task:'اكتب ملخصاً تنفيذياً قوياً، ثم وصفاً تفصيلياً للفكرة والمنتج والقيمة المقدَّمة والعميل المستهدف.' },
    { title:'تحليل السوق بأرقام حقيقية', search:true, task:'حلّل السوق المستهدف في بلد المشروع بعمق: حجم السوق (TAM/SAM/SOM)، معدل النمو السنوي، اتجاهات المستهلك، بأرقام حقيقية ومصادرها.' },
    { title:'تحليل المنافسين والميزة', search:true, task:'حدّد أهم المنافسين/البدائل الفعليين (أسماء حقيقية) في جدول يقارن نقاط القوة والضعف والتسعير، ثم حدّد الميزة التنافسية للمشروع.' },
    { title:'الدراسة المالية', chart:true, task:'قدّم اقتصاديات الوحدة، وجدول توقعات مالية تفصيلية لـ3 سنوات (إيراد/مصاريف/صافي ربح) مبني على أرقام المشروع ونموه، ونقطة التعادل، مع رسم بياني للإيراد.' },
    { title:'المخاطر والخلاصة', task:'حلّل أهم 5 مخاطر وسبل تخفيف كل منها في جدول، ثم خلاصة وتوصية واضحة حول جدوى المشروع.' }
  ],
  deck: [
    { title:'الرؤية والمشكلة', search:true, task:'اكتب شريحة الغلاف والرؤية، ثم شريحة المشكلة مدعومة بأرقام حقيقية عن حجم المشكلة في السوق مع مصادرها.' },
    { title:'الحل والمنتج', task:'اكتب شريحة الحل بتفصيل مقنع يبرز قوته، وشريحة المنتج وأهم مميزاته وكيف يعمل.' },
    { title:'السوق ونموذج الربح', search:true, chart:true, task:'شريحة حجم السوق (TAM/SAM/SOM بأرقام حقيقية ومصادر + رسم بياني)، ثم شريحة نموذج الربح واقتصاديات الوحدة بالأرقام.' },
    { title:'المنافسة والجذب', task:'شريحة المنافسة والميزة (جدول مقارنة)، ثم شريحة الجذب والأرقام والإنجازات الحالية.' },
    { title:'النمو والفريق والتمويل', chart:true, task:'شريحة خطة النمو بأهداف وأرقام، شريحة الفريق [placeholder]، شريحة التوقعات المالية (جدول)، وشريحة طلب التمويل وأوجه استخدامه بالتفصيل.' }
  ],
  readiness: [
    { title:'ملخص تنفيذي وتقييم مالي', chart:true, task:'ملخص تنفيذي احترافي، ثم تقييم مالي معمّق بالأرقام في جدول (تغطية الإيراد للمصاريف، معدل الحرق الشهري، النفس بالشهور، الفجوة التمويلية) مع رسم بياني لتطور الكاش خلال فترة النفس.' },
    { title:'درجة الجاهزية للتمويل', task:'درجة جاهزية من 100 مع تبرير مفصّل لكل معيار في جدول تقييمي (الوضع المالي، المستندات، الفريق، الجذب، وضوح النموذج)، مع تحليل نقاط القوة والفجوات.' },
    { title:'المستندات ومعايير المموّلين', search:true, task:'ابحث عن المستندات والمعايير التي تطلبها جهات التمويل في بلد المشروع، وقدّم جدول checklist شاملاً (متوفر/ناقص) بناءً على إجابات صاحب المشروع، مع ترشيح جهات التمويل الأنسب لحالته.' },
    { title:'خطة رفع الجاهزية', task:'تحليل الفجوات بالتفصيل، ثم خطة عملية مرحلية (شهر بشهر لمدة 3 أشهر) لرفع جاهزية المشروع للتمويل، بأولويات واضحة وخطوات قابلة للتنفيذ.' }
  ],
  emails: [
    { title:'المستثمرون المناسبون', search:true, task:'ابحث وأدرج قائمة مفصّلة بأسماء حقيقية للمستثمرين/الجهات المناسبة لقطاع ومرحلة المشروع في بلده، في جدول (الاسم، النوع، ما يهتمون به، مرحلتهم المفضّلة، طريقة التواصل).' },
    { title:'قوالب الرسائل الجاهزة', task:'إيميل تواصل بارد قوي ومخصّص للمشروع + إيميل متابعة + رسالة تعريف قصيرة (لينكدإن/واتساب)، بصياغة احترافية مقنعة وجاهزة للاستخدام مع placeholders واضحة.' },
    { title:'استراتيجية التواصل والمتابعة', task:'خطة تواصل عملية: كيف تبدأ، وتوقيت المتابعة، وكيف تتعامل مع الرفض أو الصمت، وأهم 5 أسئلة سيسألها المستثمر مع إجابات مقترحة جاهزة.' }
  ],
  captable: [
    { title:'الملكية الحالية والتقييم', search:true, task:'جدول الملكية قبل الجولة، وتقدير تقييم واقعي للمرحلة مع منطق التقييم ومقارنات حقيقية من السوق (ابحث عن مضاعفات/جولات مشابهة في المنطقة واذكر مصادرها).' },
    { title:'ما بعد الجولة والسيناريوهات', chart:true, task:'جدول ما بعد الجولة يوضّح الحصص والتخفيف (dilution)، وسيناريوهات مختلفة للنسبة والتقييم في جدول مقارنة، ورسم بياني لتوزيع الملكية.' },
    { title:'شروط الصفقة ونصائح التفاوض', task:'أهم بنود اتفاقية الاستثمار التي يجب الانتباه لها (التقييم، نوع الأسهم، حقوق المستثمر، الـvesting، شروط الخروج)، ونصائح تفاوض عملية، مع تحذير أن الأرقام للاسترشاد وأن مراجعة محامٍ متخصص ضرورية.' }
  ]
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  const body = req.body || {};
  const contact = (body.contact || '').toString().trim();
  const docType = (body.docType || '').toString().trim();
  const data = body.data || {};
  const section = Math.max(0, parseInt(body.section, 10) || 0);
  if (!contact) { res.status(400).json({ error: 'contact_required' }); return; }
  const secList = SECTIONS[docType];
  if (!secList) { res.status(400).json({ error: 'bad_doctype' }); return; }
  const sec = secList[section];
  if (!sec) { res.status(400).json({ error: 'bad_section' }); return; }

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
    answersText = '\nتفاصيل قدّمها صاحب المشروع (اعتمد عليها ووسّعها):\n' +
      aKeys.map(function(k){ return '- ' + k + ': ' + answers[k]; }).join('\n');
  }

  let fmt = FMT;
  if (sec.search) fmt += SEARCH_NOTE;
  if (sec.chart) fmt += CHART_NOTE;
  const prompt = ctx(data) + answersText +
    '\n\nأنت تكتب قسم «' + sec.title + '» من ' + (DOCLABEL[docType] || '') + ' لهذا المشروع.\n' +
    'المطلوب: ' + sec.task + '\n' + fmt;

  const reqBody = { model: MODEL, max_tokens: sec.search ? 4000 : 3800, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: prompt }] };
  if (sec.search) reqBody.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }];

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const d = await r.json();
    const blocks = d && Array.isArray(d.content) ? d.content : [];
    let html = blocks.filter(function(b){ return b.type === 'text' && b.text; }).map(function(b){ return b.text; }).join('\n');
    html = html.replace(/^```html\s*/i, '').replace(/```\s*$/,'').trim();
    if (html) {
      res.status(200).json({ html: html, section: section, total: secList.length, hasMore: section < secList.length - 1, title: sec.title });
    } else {
      res.status(400).json({ error: 'anthropic_error', detail: (d && d.error) || d });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
