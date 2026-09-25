/**
 * Definisi layout. `id` harus sama persis dengan nilai data-layout yang
 * ditangani di style.css (#a4doc[data-layout="..."]). Menambah layout baru:
 * 1) tambahkan entri di sini, 2) tambahkan blok CSS baru untuk id tersebut.
 * Semua layout memakai field & batas karakter konten yang identik — hanya
 * tata letak visual yang berubah.
 */
window.LAYOUTS = [
  {
    id:"classic",
    name:"Klasik",
    icon:'<rect x="4" y="4" width="32" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="4" y="15" width="32" height="4" rx="1" fill="currentColor" opacity=".6"/><rect x="4" y="21" width="32" height="6" rx="1.5" fill="currentColor" opacity=".9"/><rect x="4" y="29" width="32" height="4" rx="1" fill="currentColor" opacity=".6"/>'
  },
  {
    id:"sidebar",
    name:"Sidebar",
    icon:'<rect x="4" y="4" width="32" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="4" y="15" width="20" height="18" rx="1" fill="currentColor" opacity=".6"/><rect x="26" y="15" width="10" height="18" rx="1" fill="currentColor" opacity=".9"/>'
  },
  {
    id:"magazine",
    name:"Majalah",
    icon:'<rect x="4" y="4" width="32" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="4" y="15" width="9" height="18" rx="1" fill="currentColor" opacity=".6"/><rect x="15" y="15" width="9" height="18" rx="1" fill="currentColor" opacity=".6"/><rect x="26" y="18" width="10" height="12" rx="1" fill="currentColor" opacity=".9"/>'
  },
  {
    id:"gallery",
    name:"Galeri",
    icon:'<rect x="4" y="4" width="32" height="8" rx="1.5" fill="currentColor" opacity=".35"/><rect x="4" y="15" width="9" height="10" rx="1" fill="currentColor" opacity=".9"/><rect x="15" y="15" width="9" height="10" rx="1" fill="currentColor" opacity=".9"/><rect x="26" y="15" width="10" height="10" rx="1" fill="currentColor" opacity=".9"/><rect x="4" y="27" width="32" height="6" rx="1" fill="currentColor" opacity=".5"/>'
  },
  {
    id:"minimal",
    name:"Minimal",
    icon:'<rect x="10" y="4" width="20" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="8" y="14" width="24" height="3" rx="1" fill="currentColor" opacity=".6"/><rect x="8" y="19" width="24" height="3" rx="1" fill="currentColor" opacity=".6"/><rect x="12" y="26" width="16" height="4" rx="1" fill="currentColor" opacity=".9"/>'
  },
  {
    id:"ungu-korporat",
    name:"Korporat Ungu",
    icon:'<rect x="4" y="4" width="18" height="14" rx="1.5" fill="currentColor" opacity=".9"/><rect x="24" y="4" width="12" height="14" rx="1.5" fill="currentColor" opacity=".35"/><rect x="4" y="21" width="9" height="11" rx="1" fill="currentColor" opacity=".6"/><rect x="15" y="21" width="9" height="11" rx="1" fill="currentColor" opacity=".6"/><rect x="26" y="21" width="10" height="11" rx="1" fill="currentColor" opacity=".9"/>'
  },
  {
    id:"surat-kabar",
    name:"Surat Kabar",
    icon:'<rect x="4" y="4" width="32" height="32" rx="1.5" fill="currentColor" opacity=".12"/><rect x="8" y="8" width="24" height="6" rx="1" fill="currentColor" opacity=".9"/><rect x="8" y="17" width="11" height="14" rx="1" fill="currentColor" opacity=".5"/><rect x="21" y="17" width="11" height="6" rx="1" fill="currentColor" opacity=".5"/><rect x="21" y="25" width="11" height="6" rx="1" fill="currentColor" opacity=".8"/>'
  },
  {
    id:"biru-korporat",
    name:"Korporat Biru",
    icon:'<rect x="4" y="4" width="32" height="12" rx="6" fill="currentColor" opacity=".8"/><rect x="4" y="19" width="13" height="13" rx="1" fill="currentColor" opacity=".55"/><rect x="19" y="19" width="13" height="13" rx="1" fill="currentColor" opacity=".55"/><circle cx="32" cy="30" r="4" fill="currentColor" opacity=".95"/>'
  },
  {
    id:"editorial-teks",
    name:"Editorial Teks",
    icon:'<rect x="6" y="4" width="28" height="6" rx="1.5" fill="currentColor" opacity=".4"/><rect x="6" y="13" width="28" height="2.4" rx="1" fill="currentColor" opacity=".8"/><rect x="6" y="17.5" width="28" height="2.4" rx="1" fill="currentColor" opacity=".8"/><rect x="6" y="22" width="28" height="2.4" rx="1" fill="currentColor" opacity=".8"/><rect x="6" y="27" width="17" height="8" rx="1" fill="currentColor" opacity=".55"/>'
  },
  {
    id:"fokus-cerita",
    name:"Fokus Cerita",
    icon:'<rect x="6" y="4" width="28" height="5" rx="1.5" fill="currentColor" opacity=".4"/><rect x="6" y="12" width="13" height="2.2" rx="1" fill="currentColor" opacity=".8"/><rect x="6" y="16" width="13" height="2.2" rx="1" fill="currentColor" opacity=".8"/><rect x="6" y="20" width="13" height="2.2" rx="1" fill="currentColor" opacity=".8"/><rect x="21" y="12" width="13" height="2.2" rx="1" fill="currentColor" opacity=".8"/><rect x="21" y="16" width="13" height="2.2" rx="1" fill="currentColor" opacity=".8"/><rect x="21" y="20" width="8" height="8" rx="1" fill="currentColor" opacity=".55"/>'
  }
];
