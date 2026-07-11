// فحص تشخيصي لاتصال Claude API (بدون بوابة الدفع)
module.exports = async (req, res) => {
  const KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
  const MODEL = (process.env.ANTHROPIC_MODEL || 'claude-sonnet-5').trim();
  if (!KEY) { res.status(200).json({ key_present: false }); return; }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 50, messages: [{ role: 'user', content: 'قل مرحبا في جملة واحدة.' }] })
    });
    const txt = await r.text();
    res.status(200).json({ key_present: true, model: MODEL, anthropic_status: r.status, body: txt.slice(0, 600) });
  } catch (e) {
    res.status(200).json({ key_present: true, error: e.message });
  }
};
