/**
 * Isi dua nilai di bawah ini dengan kredensial proyek Supabase kamu sendiri.
 * Keduanya diambil dari: Supabase Dashboard -> Project Settings -> API.
 *
 * - url      : "Project URL"          (contoh: https://xxxxxxxxxxxx.supabase.co)
 * - anonKey  : "anon public" API key  (BUKAN service_role key — jangan pernah
 *              menaruh service_role key di file yang di-deploy ke browser)
 *
 * anon key ini memang didesain untuk dipakai di sisi client/browser; keamanan
 * data diatur lewat Row Level Security (RLS) di database, bukan dengan
 * menyembunyikan key ini. Lihat README.md untuk setup lengkap.
 */
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  anonKey: "YOUR-ANON-PUBLIC-KEY"
};
