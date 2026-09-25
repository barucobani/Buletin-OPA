(function(){
  "use strict";

  /* ============ SUPABASE CLIENT ============ */
  const CFG = window.SUPABASE_CONFIG || {};
  const isConfigured = CFG.url && CFG.anonKey &&
    !CFG.url.includes("YOUR-PROJECT-REF") && !CFG.anonKey.includes("YOUR-ANON-PUBLIC-KEY");

  let supabaseClient = null;
  if(isConfigured && window.supabase){
    supabaseClient = window.supabase.createClient(CFG.url, CFG.anonKey);
  }

  const cloudStatusEl = document.getElementById('cloudStatus');
  const btnSaveCloud = document.getElementById('btnSaveCloud');
  const btnLibrary = document.getElementById('btnLibrary');
  if(!supabaseClient){
    cloudStatusEl.textContent = 'Cloud belum dikonfigurasi (lihat README)';
    cloudStatusEl.classList.add('warn');
  } else {
    cloudStatusEl.textContent = 'Terhubung ke Supabase';
    cloudStatusEl.classList.add('ok');
  }

  const TABLE = 'buletins';
  const BUCKET = 'buletin-images';

  /* ============ COLOR HELPERS ============ */
  function hexToRgb(hex){
    hex = hex.replace('#','');
    if(hex.length===3) hex = hex.split('').map(c=>c+c).join('');
    const num = parseInt(hex,16);
    return {r:(num>>16)&255, g:(num>>8)&255, b:num&255};
  }
  function rgbToHex(r,g,b){
    return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  }
  function shade(hex, percent){ // negative = darker
    const {r,g,b} = hexToRgb(hex);
    const t = percent<0 ? 0 : 255;
    const p = Math.abs(percent);
    return rgbToHex(r+(t-r)*p, g+(t-g)*p, b+(t-b)*p);
  }
  function relLuminance(hex){
    const {r,g,b} = hexToRgb(hex);
    const a = [r,g,b].map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
    return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
  }
  function autoOnColor(hex){
    return relLuminance(hex) > 0.42 ? '#241c08' : '#f6ecd8';
  }

  /* ============ THEME ============ */
  const THEMES = window.THEMES;
  let currentThemeId = THEMES[0].id;
  const a4doc = document.getElementById('a4doc');

  function applyThemeColors(t){
    a4doc.style.setProperty('--doc-primary', t.primary);
    a4doc.style.setProperty('--doc-primary-dark', t.primaryDark);
    a4doc.style.setProperty('--doc-accent', t.accent);
    a4doc.style.setProperty('--doc-on-primary', t.onPrimary);
    a4doc.style.setProperty('--doc-paper', t.paper || '#f7f4ee');
  }

  function applyTheme(id){
    currentThemeId = id;
    const t = THEMES.find(x=>x.id===id);
    if(!t) return;
    applyThemeColors(t);
    document.querySelectorAll('.theme-chip').forEach(el=>{
      el.classList.toggle('active', el.dataset.themeId===id);
    });
    // reflect into custom pickers so they stay in sync
    customPrimary.value = t.primary;
    customAccent.value = t.accent;
    customPaper.value = t.paper || '#f7f4ee';
  }

  const themeGrid = document.getElementById('themeGrid');
  THEMES.forEach(t=>{
    const chip = document.createElement('div');
    chip.className = 'theme-chip';
    chip.dataset.themeId = t.id;
    chip.title = t.name;
    chip.innerHTML = `<div class="half l" style="background:${t.primary}"></div><div class="half r" style="background:${t.accent}"></div><div class="chip-label">${t.name}</div>`;
    chip.addEventListener('click', ()=>applyTheme(t.id));
    themeGrid.appendChild(chip);
  });

  const customPrimary = document.getElementById('customPrimary');
  const customAccent = document.getElementById('customAccent');
  const customPaper = document.getElementById('customPaper');

  function applyCustomTheme(){
    currentThemeId = 'custom';
    const primary = customPrimary.value;
    const accent = customAccent.value;
    const paper = customPaper.value;
    const t = {
      primary, accent, paper,
      primaryDark: shade(primary, -0.32),
      onPrimary: autoOnColor(primary)
    };
    applyThemeColors(t);
    document.querySelectorAll('.theme-chip').forEach(el=>el.classList.remove('active'));
  }
  [customPrimary, customAccent, customPaper].forEach(el=>el.addEventListener('input', applyCustomTheme));

  function getThemeSnapshot(){
    if(currentThemeId === 'custom'){
      return {
        mode:'custom',
        primary: customPrimary.value,
        accent: customAccent.value,
        paper: customPaper.value,
        primaryDark: shade(customPrimary.value, -0.32),
        onPrimary: autoOnColor(customPrimary.value)
      };
    }
    const t = THEMES.find(x=>x.id===currentThemeId) || THEMES[0];
    return {mode:'preset', id:t.id, primary:t.primary, primaryDark:t.primaryDark, accent:t.accent, onPrimary:t.onPrimary, paper:t.paper};
  }

  function loadThemeSnapshot(theme){
    if(!theme) { applyTheme(THEMES[0].id); return; }
    if(theme.mode === 'custom'){
      customPrimary.value = theme.primary;
      customAccent.value = theme.accent;
      customPaper.value = theme.paper || '#f7f4ee';
      applyCustomTheme();
    } else {
      applyTheme(theme.id || THEMES[0].id);
    }
  }

  /* ============ MODE (Buletin / Newsletter) + LAYOUT ============ */
  const LAYOUTS = window.LAYOUTS;
  let currentLayout = LAYOUTS[0].id;
  const layoutGrid = document.getElementById('layoutGrid');
  const modebarHint = document.getElementById('modebarHint');

  const MODE_HINTS = {
    buletin: 'Layout gaya laporan formal: Klasik, Sidebar, Majalah, Galeri, Minimal, Editorial Teks, Fokus Cerita.',
    newsletter: 'Layout gaya newsletter grafis ala Canva: Korporat Ungu, Surat Kabar, Korporat Biru.'
  };

  function layoutsForMode(mode){
    return LAYOUTS.filter(l => (l.group || 'buletin') === mode);
  }
  function groupOf(layoutId){
    const l = LAYOUTS.find(x => x.id === layoutId);
    return (l && l.group) || 'buletin';
  }

  let currentMode = 'buletin';

  function renderLayoutGrid(){
    layoutGrid.innerHTML = '';
    layoutsForMode(currentMode).forEach(l=>{
      const chip = document.createElement('div');
      chip.className = 'layout-chip' + (l.id===currentLayout ? ' active' : '');
      chip.dataset.layoutId = l.id;
      chip.innerHTML = `<svg viewBox="0 0 40 36">${l.icon}</svg><div class="lc-name">${l.name}</div>`;
      chip.addEventListener('click', ()=>applyLayout(l.id));
      layoutGrid.appendChild(chip);
    });
  }

  function setMode(mode, opts={}){
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(el=>{
      el.classList.toggle('active', el.dataset.mode===mode);
    });
    modebarHint.textContent = MODE_HINTS[mode] || '';
    renderLayoutGrid();
    if(!opts.silent && groupOf(currentLayout) !== mode){
      const list = layoutsForMode(mode);
      if(list.length) applyLayout(list[0].id);
    }
  }

  document.querySelectorAll('.mode-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>setMode(btn.dataset.mode));
  });

  function applyLayout(id){
    currentLayout = id;
    a4doc.setAttribute('data-layout', id);
    document.querySelectorAll('.layout-chip').forEach(el=>{
      el.classList.toggle('active', el.dataset.layoutId===id);
    });
  }

  /* ============ STATE ============ */
  const state = {
    id: null,
    edisi:"", rubrik:"", tanggal:"", meta:"",
    judul:"", subjudul:"",
    herocap:"", label1:"", narasi1:"", label2:"", narasi2:"", label3:"", narasi3:"",
    kutipan:"", kutipanauthor:"",
    doccap0:"", doccap1:"", doccap2:"",
    org:"", kontak:"", penulis:"",
    heroImg:null, docImg0:null, docImg1:null, docImg2:null,
    bgImg:null, bgOpacity:18
  };

  const FIELD_MAP = {
    f_edisi:'edisi', f_rubrik:'rubrik', f_tanggal:'tanggal', f_meta:'meta',
    f_judul:'judul', f_subjudul:'subjudul', f_herocap:'herocap',
    f_label1:'label1', f_narasi1:'narasi1', f_label2:'label2', f_narasi2:'narasi2',
    f_label3:'label3', f_narasi3:'narasi3',
    f_kutipan:'kutipan', f_kutipanauthor:'kutipanauthor',
    f_doccap0:'doccap0', f_doccap1:'doccap1', f_doccap2:'doccap2',
    f_org:'org', f_kontak:'kontak', f_penulis:'penulis'
  };

  const COUNTED_FIELDS = ['f_judul','f_subjudul','f_narasi1','f_narasi2','f_narasi3','f_kutipan'];

  function escapeHTML(str){
    return (str||"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function renderTitle(raw){
    const parts = raw.split(',');
    if(parts.length <= 1) return escapeHTML(raw);
    const main = parts[0];
    const rest = parts.slice(1).join(',').trim();
    return escapeHTML(main) + (rest ? `<span class="italic-part">${escapeHTML(rest)}</span>` : '');
  }
  function renderParas(raw, dropcap){
    const paras = (raw||"").split(/\n{1,}/).filter(p=>p.trim().length>0);
    if(paras.length === 0) return '<p></p>';
    return paras.map((p,i)=>{
      if(dropcap && i===0 && p.length>0){
        const chars = Array.from(p);
        const first = escapeHTML(chars[0]);
        const rest = escapeHTML(chars.slice(1).join(''));
        return `<p><span class="dropcap-letter">${first}</span>${rest}</p>`;
      }
      return `<p>${escapeHTML(p)}</p>`;
    }).join('');
  }

  function updateCounter(id){
    const el = document.getElementById(id);
    const c = document.getElementById('c'+id.slice(1));
    if(!c) return;
    c.textContent = el.value.length + '/' + el.getAttribute('maxlength');
  }

  /* ============ RENDER ============ */
  function render(){
    document.getElementById('p_edisi').textContent = state.edisi.toUpperCase();
    document.getElementById('p_rubrik').textContent = state.rubrik.toUpperCase();
    document.getElementById('p_tanggal').textContent = state.tanggal.toUpperCase();
    document.getElementById('p_meta').textContent = state.meta;

    document.getElementById('p_judul').innerHTML = renderTitle(state.judul);
    document.getElementById('p_subjudul').textContent = state.subjudul;

    document.getElementById('p_herocap').textContent = state.herocap;
    document.getElementById('p_herocaptag').style.display = state.herocap ? 'inline-flex' : 'none';
    document.getElementById('p_label1').textContent = state.label1;
    document.getElementById('p_narasi1').innerHTML = renderParas(state.narasi1, true);
    document.getElementById('p_label2').textContent = state.label2;
    document.getElementById('p_narasi2').innerHTML = renderParas(state.narasi2);
    document.getElementById('p_label3').textContent = state.label3;
    document.getElementById('p_narasi3').innerHTML = renderParas(state.narasi3);

    document.getElementById('p_kutipan').textContent = state.kutipan;
    document.getElementById('p_kutipanauthor').textContent = state.kutipanauthor ? '— ' + state.kutipanauthor : '';

    document.getElementById('p_doccap0').textContent = state.doccap0;
    document.getElementById('p_doccap1').textContent = state.doccap1;
    document.getElementById('p_doccap2').textContent = state.doccap2;

    document.getElementById('p_org').textContent = state.org;
    document.getElementById('p_kontak').textContent = state.kontak;
    document.getElementById('p_penulis').textContent = state.penulis;

    const headerPhotoEl = document.getElementById('p_headerPhoto');
    const headerOverlayEl = document.getElementById('p_headerOverlay');
    const headerChangeLabel = document.getElementById('p_headerChangeLabel');
    if(state.heroImg){
      headerPhotoEl.style.backgroundImage = `url(${state.heroImg})`;
      headerOverlayEl.classList.remove('no-photo');
      headerChangeLabel.textContent = 'Ganti Foto';
    } else {
      headerPhotoEl.style.backgroundImage = 'none';
      headerOverlayEl.classList.add('no-photo');
      headerChangeLabel.textContent = 'Unggah Foto';
    }

    [0,1,2].forEach(i=>{
      const el = document.getElementById('p_docphoto'+i);
      const img = state['docImg'+i];
      const emptyEl = el.querySelector('.doc-empty');
      if(img){
        el.style.backgroundImage = `url(${img})`;
        if(emptyEl) emptyEl.style.display='none';
      } else {
        el.style.backgroundImage = 'none';
        if(emptyEl) emptyEl.style.display='flex';
      }
    });

    const bgLayer = document.getElementById('bg-overlay-layer');
    if(state.bgImg){
      bgLayer.style.backgroundImage = `url(${state.bgImg})`;
      bgLayer.style.opacity = state.bgOpacity/100;
    } else {
      bgLayer.style.backgroundImage = 'none';
      bgLayer.style.opacity = 0;
    }

    updateSlotVisual('heroSlot', state.heroImg, 'heroImg');
    [0,1,2].forEach(i=>updateSlotVisual('docSlot'+i, state['docImg'+i], 'docImg'+i));

    COUNTED_FIELDS.forEach(updateCounter);
  }

  function updateSlotVisual(slotId, imgSrc, stateKey){
    const slot = document.getElementById(slotId);
    if(!slot) return;
    let img = slot.querySelector('img.slot-img');
    let removeBtn = slot.querySelector('.remove-x');
    const placeholder = slot.querySelector('.placeholder');
    if(imgSrc){
      if(!img){
        img = document.createElement('img');
        img.className = 'slot-img';
        slot.insertBefore(img, slot.firstChild);
      }
      img.src = imgSrc;
      if(placeholder) placeholder.style.display = 'none';
      if(!removeBtn){
        removeBtn = document.createElement('button');
        removeBtn.className = 'remove-x';
        removeBtn.type = 'button';
        removeBtn.innerHTML = '✕';
        removeBtn.addEventListener('click', (e)=>{
          e.stopPropagation();
          state[stateKey] = null;
          render();
        });
        slot.appendChild(removeBtn);
      }
    } else {
      if(img) img.remove();
      if(removeBtn) removeBtn.remove();
      if(placeholder) placeholder.style.display = 'flex';
    }
  }

  /* ============ BIND INPUTS ============ */
  Object.keys(FIELD_MAP).forEach(id=>{
    const el = document.getElementById(id);
    const key = FIELD_MAP[id];
    state[key] = el.value;
    el.addEventListener('input', ()=>{
      state[key] = el.value;
      render();
    });
  });

  /* ============ PHOTO UPLOADS ============ */
  function readAsDataURL(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = ()=>resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function bindPhotoSlot(slotEl, fileInputEl, stateKey){
    slotEl.addEventListener('click', (e)=>{
      if(e.target.closest('.remove-x')) return;
      fileInputEl.click();
    });
    fileInputEl.addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      if(!file.type.startsWith('image/')){
        showToast('error','File harus berupa gambar.');
        return;
      }
      state[stateKey] = await readAsDataURL(file);
      render();
      showToast('success','Foto berhasil diunggah.');
      fileInputEl.value = '';
    });
  }
  bindPhotoSlot(document.getElementById('heroSlot'), document.getElementById('heroFileInput'), 'heroImg');
  document.getElementById('p_headerChangeBtn').addEventListener('click', (e)=>{
    e.stopPropagation();
    document.getElementById('heroFileInput').click();
  });
  bindPhotoSlot(document.getElementById('docSlot0'), document.getElementById('docFileInput0'), 'docImg0');
  bindPhotoSlot(document.getElementById('docSlot1'), document.getElementById('docFileInput1'), 'docImg1');
  bindPhotoSlot(document.getElementById('docSlot2'), document.getElementById('docFileInput2'), 'docImg2');

  /* ============ BACKGROUND UPLOAD ============ */
  const bgUploadBox = document.getElementById('bgUploadBox');
  const bgFileInput = document.getElementById('bgFileInput');
  const bgPreviewRow = document.getElementById('bgPreviewRow');
  const bgThumb = document.getElementById('bgThumb');
  const bgRemoveBtn = document.getElementById('bgRemoveBtn');
  const bgOpacityInput = document.getElementById('bgOpacity');
  const bgOpacityVal = document.getElementById('bgOpacityVal');

  bgUploadBox.addEventListener('click', ()=>bgFileInput.click());
  bgFileInput.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){
      showToast('error','File harus berupa gambar.');
      return;
    }
    state.bgImg = await readAsDataURL(file);
    bgThumb.src = state.bgImg;
    bgUploadBox.style.display = 'none';
    bgPreviewRow.style.display = 'flex';
    render();
    showToast('success','Background berhasil ditambahkan.');
    bgFileInput.value = '';
  });
  bgRemoveBtn.addEventListener('click', ()=>{
    state.bgImg = null;
    bgUploadBox.style.display = 'block';
    bgPreviewRow.style.display = 'none';
    render();
  });
  bgOpacityInput.addEventListener('input', ()=>{
    state.bgOpacity = parseInt(bgOpacityInput.value,10);
    bgOpacityVal.textContent = state.bgOpacity + '%';
    render();
  });
  bgOpacityVal.textContent = state.bgOpacity + '%';

  /* ============ ZOOM ============ */
  let zoom = 0.7;
  const a4Stage = document.getElementById('a4Stage');
  const previewScroll = document.getElementById('previewScroll');
  const zoomLabel = document.getElementById('zoomLabel');

  function setZoom(z, clamp=true){
    if(clamp) z = Math.min(2, Math.max(0.25, z));
    zoom = z;
    a4Stage.style.transform = `scale(${zoom})`;
    a4Stage.style.marginBottom = (1123*zoom - 1123) + 'px';
    zoomLabel.textContent = Math.round(zoom*100) + '%';
  }
  document.getElementById('zoomIn').addEventListener('click', ()=>setZoom(zoom+0.1));
  document.getElementById('zoomOut').addEventListener('click', ()=>setZoom(zoom-0.1));
  document.getElementById('zoom100').addEventListener('click', ()=>setZoom(1));
  document.getElementById('zoomFit').addEventListener('click', fitToScreen);

  function fitToScreen(){
    const availW = previewScroll.clientWidth - 80;
    const availH = previewScroll.clientHeight - 80;
    const scaleW = availW / 794;
    const scaleH = availH / 1123;
    setZoom(Math.min(scaleW, scaleH, 1), false);
  }
  window.addEventListener('resize', fitToScreen);

  /* ============ TOAST ============ */
  function showToast(type, message){
    const stack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const iconSVG = type==='success'
      ? '<svg class="toast-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
      : '<svg class="toast-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
    el.innerHTML = iconSVG + `<span>${escapeHTML(message)}</span>`;
    stack.appendChild(el);
    setTimeout(()=>{
      el.classList.add('hide');
      setTimeout(()=>el.remove(), 220);
    }, 3200);
  }

  /* ============ LOADING OVERLAY ============ */
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  function showLoading(text){ loadingText.textContent = text; loadingOverlay.classList.add('show'); }
  function hideLoading(){ loadingOverlay.classList.remove('show'); }

  /* ============ RESET MODAL ============ */
  const modalBackdrop = document.getElementById('modalBackdrop');
  document.getElementById('btnReset').addEventListener('click', ()=>modalBackdrop.classList.add('show'));
  document.getElementById('modalCancel').addEventListener('click', ()=>modalBackdrop.classList.remove('show'));
  modalBackdrop.addEventListener('click', (e)=>{ if(e.target === modalBackdrop) modalBackdrop.classList.remove('show'); });
  document.getElementById('modalConfirm').addEventListener('click', ()=>{
    resetAll();
    modalBackdrop.classList.remove('show');
    showToast('success','Semua data telah direset.');
  });
  document.getElementById('btnNew').addEventListener('click', ()=>{
    resetAll();
    showToast('success','Dokumen baru dimulai.');
  });

  function resetAll(){
    Object.keys(FIELD_MAP).forEach(id=>{
      const el = document.getElementById(id);
      el.value = '';
      state[FIELD_MAP[id]] = '';
    });
    state.id = null;
    state.heroImg = null;
    state.docImg0 = null;
    state.docImg1 = null;
    state.docImg2 = null;
    state.bgImg = null;
    state.bgOpacity = 18;
    bgOpacityInput.value = 18;
    bgOpacityVal.textContent = '18%';
    bgUploadBox.style.display = 'block';
    bgPreviewRow.style.display = 'none';
    applyTheme(THEMES[0].id);
    setMode('buletin');
    applyLayout(LAYOUTS[0].id);
    render();
  }

  /* ============ CONTOH (SAMPLE DATA) ============ */
  const SAMPLE = {
    edisi:"EDISI 08 / 2026", rubrik:"LAPORAN KHUSUS", tanggal:"14 Agustus 2026",
    meta:"Sorotan Utama Pekan Ini",
    judul:"Merajut Asa di Tengah Perubahan, Bersama Kita Bertumbuh",
    subjudul:"Sebuah catatan perjalanan tentang bagaimana komunitas kecil mampu menghadirkan dampak besar bagi lingkungan sekitarnya.",
    herocap:"Warga bergotong royong menanam pohon di area konservasi, Sabtu pagi.",
    label1:"Kabar Utama",
    narasi1:"Pagi itu udara masih basah oleh embun ketika puluhan warga berkumpul di lapangan desa. Mereka datang bukan untuk sebuah perayaan, melainkan untuk sebuah aksi nyata merawat bumi. Bibit-bibit pohon dibagikan satu demi satu, tangan-tangan kecil hingga dewasa bekerja sama menggali tanah dan menanam harapan baru bagi generasi mendatang.",
    label2:"Dampak & Harapan",
    narasi2:"Program ini telah berjalan selama tiga tahun terakhir dan berhasil menghijaukan lebih dari lima hektare lahan kritis. Bukan hanya soal pohon yang tumbuh, tetapi juga tentang kesadaran kolektif yang perlahan mengakar di tengah masyarakat, menjadikan kepedulian lingkungan sebagai bagian dari identitas bersama.",
    label3:"Langkah ke Depan",
    narasi3:"Ke depan, pengurus komunitas berencana memperluas jangkauan program ke tiga desa tetangga sekaligus membuka pelatihan pembibitan bagi generasi muda.",
    kutipan:"Kami tidak menanam untuk diri kami sendiri, tetapi untuk anak cucu yang akan meneduh di bawahnya kelak.",
    kutipanauthor:"Ketua Kelompok Tani Hijau Lestari",
    doccap0:"Pembagian bibit pohon", doccap1:"Proses penanaman bersama", doccap2:"Foto bersama warga",
    org:"Komunitas Hijau Lestari", kontak:"hijaulestari.org  ·  @hijaulestari  ·  0812-xxxx-xxxx",
    penulis:"Ditulis oleh Aulia R."
  };
  document.getElementById('btnContoh').addEventListener('click', ()=>{
    Object.keys(FIELD_MAP).forEach(id=>{
      const key = FIELD_MAP[id];
      if(SAMPLE[key] !== undefined){
        document.getElementById(id).value = SAMPLE[key];
        state[key] = SAMPLE[key];
      }
    });
    render();
    showToast('success','Data contoh telah dimuat.');
  });

  /* ============ EXPORT PNG / PDF ============ */
  async function captureA4(){
    const target = document.getElementById('a4doc');
    if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
    const stage = document.getElementById('a4Stage');
    const prevTransform = stage.style.transform;
    const prevMargin = stage.style.marginBottom;
    stage.style.transform = 'none';
    stage.style.marginBottom = '0px';
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    let canvas;
    try{
      canvas = await html2canvas(target, {
        scale: 3, useCORS: true, backgroundColor: '#f7f4ee', logging: false,
        windowWidth: 794, windowHeight: 1123
      });
    } finally {
      stage.style.transform = prevTransform;
      stage.style.marginBottom = prevMargin;
    }
    return canvas;
  }

  document.getElementById('btnPNG').addEventListener('click', async ()=>{
    showLoading('Menyiapkan gambar PNG...');
    try{
      await new Promise(r=>setTimeout(r, 80));
      const canvas = await captureA4();
      const link = document.createElement('a');
      link.download = 'buletin-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      showToast('success','Buletin berhasil diekspor sebagai PNG.');
    }catch(err){
      console.error(err);
      showToast('error','Gagal mengekspor PNG. Coba lagi.');
    }finally{ hideLoading(); }
  });

  document.getElementById('btnPDF').addEventListener('click', async ()=>{
    showLoading('Menyiapkan dokumen PDF...');
    try{
      await new Promise(r=>setTimeout(r, 80));
      const canvas = await captureA4();
      const imgData = canvas.toDataURL('image/png', 1.0);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save('buletin-' + Date.now() + '.pdf');
      showToast('success','Buletin berhasil diekspor sebagai PDF.');
    }catch(err){
      console.error(err);
      showToast('error','Gagal mengekspor PDF. Coba lagi.');
    }finally{ hideLoading(); }
  });

  /* ============ SUPABASE: SAVE / LOAD / DELETE ============ */
  function requireCloud(){
    if(!supabaseClient){
      showToast('error','Supabase belum dikonfigurasi. Isi supabase-config.js (lihat README.md).');
      return false;
    }
    return true;
  }

  async function uploadImageIfNeeded(dataUrl, fieldName){
    if(!dataUrl || !dataUrl.startsWith('data:')) return dataUrl; // already a URL or empty
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg','jpg');
    const folder = state.id || ('draft-' + Date.now());
    const path = `${folder}/${fieldName}-${Date.now()}.${ext}`;
    const { error } = await supabaseClient.storage.from(BUCKET).upload(path, blob, {
      upsert: true, contentType: blob.type
    });
    if(error) throw error;
    const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  function getContentSnapshot(){
    const content = {};
    Object.values(FIELD_MAP).forEach(key=>{ content[key] = state[key]; });
    content.heroImg = state.heroImg;
    content.docImg0 = state.docImg0;
    content.docImg1 = state.docImg1;
    content.docImg2 = state.docImg2;
    content.bgImg = state.bgImg;
    content.bgOpacity = state.bgOpacity;
    return content;
  }

  async function saveToCloud(){
    if(!requireCloud()) return;
    showLoading('Mengunggah gambar & menyimpan...');
    try{
      state.heroImg = await uploadImageIfNeeded(state.heroImg, 'hero');
      state.docImg0 = await uploadImageIfNeeded(state.docImg0, 'doc0');
      state.docImg1 = await uploadImageIfNeeded(state.docImg1, 'doc1');
      state.docImg2 = await uploadImageIfNeeded(state.docImg2, 'doc2');
      state.bgImg   = await uploadImageIfNeeded(state.bgImg, 'bg');
      render();

      const payload = {
        title: state.judul || 'Tanpa Judul',
        layout: currentLayout,
        theme: getThemeSnapshot(),
        content: getContentSnapshot(),
        updated_at: new Date().toISOString()
      };

      let result;
      if(state.id){
        result = await supabaseClient.from(TABLE).update(payload).eq('id', state.id).select().single();
      } else {
        result = await supabaseClient.from(TABLE).insert(payload).select().single();
      }
      if(result.error) throw result.error;
      state.id = result.data.id;
      showToast('success','Buletin tersimpan ke cloud.');
    }catch(err){
      console.error(err);
      showToast('error','Gagal menyimpan: ' + (err.message || 'periksa koneksi/konfigurasi Supabase.'));
    }finally{
      hideLoading();
    }
  }
  btnSaveCloud.addEventListener('click', saveToCloud);

  function applyContentSnapshot(row){
    const content = row.content || {};
    Object.keys(FIELD_MAP).forEach(id=>{
      const key = FIELD_MAP[id];
      const val = content[key] !== undefined ? content[key] : '';
      document.getElementById(id).value = val;
      state[key] = val;
    });
    state.heroImg = content.heroImg || null;
    state.docImg0 = content.docImg0 || null;
    state.docImg1 = content.docImg1 || null;
    state.docImg2 = content.docImg2 || null;
    state.bgImg = content.bgImg || null;
    state.bgOpacity = content.bgOpacity != null ? content.bgOpacity : 18;
    bgOpacityInput.value = state.bgOpacity;
    bgOpacityVal.textContent = state.bgOpacity + '%';
    if(state.bgImg){
      bgThumb.src = state.bgImg;
      bgUploadBox.style.display = 'none';
      bgPreviewRow.style.display = 'flex';
    } else {
      bgUploadBox.style.display = 'block';
      bgPreviewRow.style.display = 'none';
    }
    state.id = row.id;
    const loadedLayout = row.layout || LAYOUTS[0].id;
    setMode(groupOf(loadedLayout), {silent:true});
    applyLayout(loadedLayout);
    loadThemeSnapshot(row.theme);
    render();
  }

  /* ============ LIBRARY DRAWER ============ */
  const libraryBackdrop = document.getElementById('libraryBackdrop');
  const libraryList = document.getElementById('libraryList');

  btnLibrary.addEventListener('click', async ()=>{
    if(!requireCloud()) return;
    libraryBackdrop.classList.add('show');
    await refreshLibrary();
  });
  document.getElementById('libraryClose').addEventListener('click', ()=>libraryBackdrop.classList.remove('show'));
  libraryBackdrop.addEventListener('click', (e)=>{ if(e.target===libraryBackdrop) libraryBackdrop.classList.remove('show'); });

  async function refreshLibrary(){
    libraryList.innerHTML = '<div class="library-empty">Memuat…</div>';
    try{
      const { data, error } = await supabaseClient
        .from(TABLE)
        .select('id,title,layout,updated_at')
        .order('updated_at', { ascending:false })
        .limit(50);
      if(error) throw error;
      if(!data || data.length===0){
        libraryList.innerHTML = '<div class="library-empty">Belum ada buletin tersimpan.</div>';
        return;
      }
      libraryList.innerHTML = '';
      data.forEach(row=>{
        const item = document.createElement('div');
        item.className = 'library-item';
        const date = new Date(row.updated_at);
        const layoutName = (LAYOUTS.find(l=>l.id===row.layout)||{}).name || row.layout;
        item.innerHTML = `
          <div class="li-info">
            <div class="li-title">${escapeHTML(row.title || 'Tanpa Judul')}</div>
            <div class="li-meta">${escapeHTML(layoutName)} · ${date.toLocaleString('id-ID')}</div>
          </div>
          <div class="li-actions">
            <button class="li-btn" title="Buka" data-action="open">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button class="li-btn danger" title="Hapus" data-action="delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>`;
        item.querySelector('[data-action="open"]').addEventListener('click', ()=>openBulletin(row.id));
        item.querySelector('[data-action="delete"]').addEventListener('click', ()=>deleteBulletin(row.id));
        libraryList.appendChild(item);
      });
    }catch(err){
      console.error(err);
      libraryList.innerHTML = '<div class="library-empty">Gagal memuat daftar.</div>';
    }
  }

  async function openBulletin(id){
    showLoading('Membuka buletin...');
    try{
      const { data, error } = await supabaseClient.from(TABLE).select('*').eq('id', id).single();
      if(error) throw error;
      applyContentSnapshot(data);
      libraryBackdrop.classList.remove('show');
      showToast('success','Buletin dimuat.');
    }catch(err){
      console.error(err);
      showToast('error','Gagal membuka buletin.');
    }finally{ hideLoading(); }
  }

  async function deleteBulletin(id){
    if(!confirm('Hapus buletin ini secara permanen?')) return;
    try{
      const { error } = await supabaseClient.from(TABLE).delete().eq('id', id);
      if(error) throw error;
      if(state.id === id) state.id = null;
      showToast('success','Buletin dihapus.');
      refreshLibrary();
    }catch(err){
      console.error(err);
      showToast('error','Gagal menghapus buletin.');
    }
  }

  /* ============ INIT ============ */
  applyTheme(THEMES[0].id);
  setMode('buletin', {silent:true});
  applyLayout(LAYOUTS[0].id);
  render();
  requestAnimationFrame(fitToScreen);

})();
