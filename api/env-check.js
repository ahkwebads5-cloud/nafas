// فحص وجود المفاتيح فقط (بيرجّع true/false — مش بيكشف القيم)
module.exports = async (req, res) => {
  res.status(200).json({
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    MYFATOORAH_TOKEN: !!process.env.MYFATOORAH_TOKEN,
    MYFATOORAH_BASE: process.env.MYFATOORAH_BASE || null,
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL || null
  });
};
