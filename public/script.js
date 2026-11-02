(() => {
  'use strict';

  const state = { moods: [], lagu: [], filterMood: '', q: '', urut: 'terbaru', editId: null, hapusId: null };
  const $ = (sel) => document.querySelector(sel);

  // Mengamankan teks dari database sebelum dimasukkan ke HTML
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Komunikasi dengan API ---------- */

  async function api(path, opsi = {}) {
    let res;
    try {
      res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...opsi });
    } catch {
      throw new Error('Tidak dapat terhubung ke server.');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.error || `Terjadi kesalahan (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  let timerToast;
  function toast(pesan, galat = false) {
    const t = $('#toast');
    t.textContent = pesan;
    t.className = 'toast tampil' + (galat ? ' galat' : '');
    clearTimeout(timerToast);
    timerToast = setTimeout(() => t.classList.remove('tampil'), 3000);
  }

  /* ---------- GET: muat data ---------- */

  async function muatLagu() {
    state.lagu = await api('/lagu');
    render();
  }

  async function muat() {
    try {
      state.moods = await api('/mood');
      $('#f-mood').innerHTML = '<option value="">Pilih mood…</option>'
        + state.moods.map((m) => `<option value="${m.id}">${esc(m.nama)}</option>`).join('');
      $('#acak-mood').innerHTML = '<option value="">Mood apa saja</option>'
        + state.moods.map((m) => `<option value="${esc(m.kode)}">${esc(m.nama)}</option>`).join('');
      await muatLagu();
    } catch (e) {
      $('#daftar').innerHTML = `<div class="kosong"><strong>Toples gagal dibuka</strong><p>${esc(e.message)}</p></div>`;
    }
  }

  /* ---------- Tampilan ---------- */

  function kartu(l, dialog = false) {
    const link = /^https?:\/\//i.test(l.link || '') ? l.link : null;
    const tombol = (link ? `<a class="putar-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Putar</a>` : '')
      + (dialog ? '' : '<button type="button" data-aksi="edit">Edit</button><button type="button" class="hapus" data-aksi="hapus">Hapus</button>');

    return `
      <article class="kaset${dialog ? ' besar' : ''}" data-id="${l.id}" style="--warna:${esc(l.mood.warna)}">
        <span class="mood-tag">${esc(l.mood.nama)} · #${l.id}</span>
        <h3 class="judul">${esc(l.judul)}</h3>
        <p class="artis">${esc(l.artis)}</p>
        <div class="jendela" aria-hidden="true"><span class="reel"></span><span class="reel"></span></div>
        ${l.cerita
          ? `<p class="cerita">“${esc(l.cerita)}”</p>`
          : '<p class="cerita kosong-cerita">Belum ada cerita untuk lagu ini.</p>'}
        ${tombol ? `<div class="kaki-kartu">${tombol}</div>` : ''}
      </article>`;
  }

  function render() {
    const jumlah = {};
    state.lagu.forEach((l) => { jumlah[l.mood.kode] = (jumlah[l.mood.kode] || 0) + 1; });

    // Statistik
    $('#stat-total').textContent = state.lagu.length;
    const teratas = state.moods.reduce((a, m) => ((jumlah[m.kode] || 0) > (jumlah[a?.kode] || 0) ? m : a), null);
    $('#stat-mood').textContent = teratas && jumlah[teratas.kode] ? teratas.nama : '–';

    // Tombol filter mood
    const chip = (kode, nama, warna, n) => `
      <button class="chip" type="button" data-kode="${esc(kode)}" aria-pressed="${state.filterMood === kode}"
        ${warna ? `style="--warna:${esc(warna)}"` : ''}>
        ${warna ? '<span class="titik"></span>' : ''}${esc(nama)}<span class="jml">${n}</span>
      </button>`;
    $('#chips').innerHTML = chip('', 'Semua', '', state.lagu.length)
      + state.moods.map((m) => chip(m.kode, m.nama, m.warna, jumlah[m.kode] || 0)).join('');

    // Saring dan urutkan
    const hasil = state.lagu.filter((l) =>
      (!state.filterMood || l.mood.kode === state.filterMood) &&
      (!state.q || `${l.judul} ${l.artis}`.toLowerCase().includes(state.q)
          || String(l.id) === state.q.replace('#', '')));
    if (state.urut === 'judul') hasil.sort((a, b) => a.judul.localeCompare(b.judul, 'id'));
    else hasil.sort((a, b) => b.id - a.id);

    $('#info-jumlah').textContent = state.lagu.length ? `Menampilkan ${hasil.length} dari ${state.lagu.length} lagu` : '';

    if (hasil.length) {
      $('#daftar').innerHTML = hasil.map((l) => kartu(l)).join('');
    } else {
      const [judul, isi] = state.lagu.length
        ? ['Tidak ada yang cocok', 'Coba kata kunci atau mood yang lain.']
        : ['Toplesmu masih kosong', 'Isi dengan lagu pertamamu lewat form di samping.'];
      $('#daftar').innerHTML = `<div class="kosong"><strong>${judul}</strong><p>${isi}</p></div>`;
    }
  }

  /* ---------- Form ---------- */

  const FIELD = { judul: 'f-judul', artis: 'f-artis', moodId: 'f-mood', link: 'f-link' };

  function tampilGalat(errs) {
    for (const k in FIELD) {
      $('#err-' + k).textContent = errs[k] || '';
      $('#' + FIELD[k]).closest('.medan').classList.toggle('invalid', Boolean(errs[k]));
    }
    const pertama = Object.keys(errs)[0];
    if (pertama) $('#' + FIELD[pertama]).focus();
  }

  function setModeForm(edit) {
    $('#judul-form').textContent = edit ? 'Ubah lagu' : 'Masukkan lagu';
    $('#btn-simpan').textContent = edit ? 'Simpan Perubahan' : 'Simpan';
    $('#btn-batal').hidden = !edit;
    $('.form-panel').classList.toggle('mode-edit', edit);
  }

  function resetForm() {
    $('#form-lagu').reset();
    state.editId = null;
    $('#hitung-cerita').textContent = '0/200';
    tampilGalat({});
    setModeForm(false);
  }

  // POST (tambah) atau PUT (ubah), tergantung state.editId
  async function kirimForm(e) {
    e.preventDefault();
    const d = {
      judul: $('#f-judul').value.trim(),
      artis: $('#f-artis').value.trim(),
      moodId: $('#f-mood').value,
      cerita: $('#f-cerita').value.trim(),
      link: $('#f-link').value.trim(),
    };

    const errs = {};
    if (!d.judul) errs.judul = 'Judul wajib diisi.';
    if (!d.artis) errs.artis = 'Nama artis wajib diisi.';
    if (!d.moodId) errs.moodId = 'Pilih salah satu mood.';
    if (d.link && !/^https?:\/\/\S+$/i.test(d.link)) errs.link = 'Link harus diawali http:// atau https://';
    tampilGalat(errs);
    if (Object.keys(errs).length) return;

    const body = JSON.stringify({
      judul: d.judul, artis: d.artis, moodId: Number(d.moodId),
      cerita: d.cerita || null, link: d.link || null,
    });
    const edit = state.editId !== null;
    const tombol = $('#btn-simpan');
    tombol.disabled = true;

    try {
      await api(edit ? `/lagu/${state.editId}` : '/lagu', { method: edit ? 'PUT' : 'POST', body });
      toast(edit ? 'Perubahan tersimpan.' : 'Lagu masuk ke toples.');
      resetForm();
      await muatLagu();
    } catch (err) {
      toast(err.message, true);
      if (err.status === 404) { resetForm(); muatLagu().catch(() => {}); }
    } finally {
      tombol.disabled = false;
    }
  }

  // Mengisi form dengan data lama untuk diubah
  function mulaiEdit(id) {
    const l = state.lagu.find((x) => x.id === id);
    if (!l) return;
    state.editId = id;
    $('#f-judul').value = l.judul;
    $('#f-artis').value = l.artis;
    $('#f-mood').value = l.moodId;
    $('#f-cerita').value = l.cerita || '';
    $('#f-link').value = l.link || '';
    $('#hitung-cerita').textContent = `${$('#f-cerita').value.length}/200`;
    tampilGalat({});
    setModeForm(true);
    if (window.innerWidth <= 960) $('.form-panel').scrollIntoView({ behavior: 'smooth' });
    $('#f-judul').focus({ preventScroll: true });
  }

  /* ---------- DELETE: hapus ---------- */

  function mintaHapus(id) {
    const l = state.lagu.find((x) => x.id === id);
    if (!l) return;
    state.hapusId = id;
    $('#hapus-judul').textContent = `“${l.judul}”`;
    $('#dlg-hapus').showModal();
  }

  async function hapus() {
    const id = state.hapusId;
    $('#dlg-hapus').close();
    try {
      await api(`/lagu/${id}`, { method: 'DELETE' });
      if (state.editId === id) resetForm();
      toast('Lagu dikeluarkan dari toples.');
      await muatLagu();
    } catch (err) {
      toast(err.message, true);
      if (err.status === 404) muatLagu().catch(() => {});
    }
  }

  /* ---------- Lagu acak ---------- */

  async function acak() {
    const kode = $('#acak-mood').value;
    try {
      const l = await api('/lagu/acak' + (kode ? `?mood=${encodeURIComponent(kode)}` : ''));
      $('#acak-isi').innerHTML = kartu(l, true);
      if (!$('#dlg-acak').open) $('#dlg-acak').showModal();
    } catch (err) {
      toast(err.status === 404 ? 'Belum ada lagu pada mood ini.' : err.message, true);
    }
  }

  /* ---------- Pasang event ---------- */

  $('#form-lagu').addEventListener('submit', kirimForm);
  $('#btn-batal').addEventListener('click', resetForm);
  $('#f-cerita').addEventListener('input', (e) => { $('#hitung-cerita').textContent = `${e.target.value.length}/200`; });

  $('#cari').addEventListener('input', (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $('#urut').addEventListener('change', (e) => { state.urut = e.target.value; render(); });

  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) { state.filterMood = b.dataset.kode; render(); }
  });

  $('#daftar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-aksi]');
    if (!b) return;
    const id = Number(b.closest('.kaset').dataset.id);
    if (b.dataset.aksi === 'edit') mulaiEdit(id); else mintaHapus(id);
  });

  $('#btn-acak').addEventListener('click', acak);
  $('#btn-acak-lagi').addEventListener('click', acak);
  $('#btn-acak-tutup').addEventListener('click', () => $('#dlg-acak').close());

  $('#btn-hapus-ya').addEventListener('click', hapus);
  $('#btn-hapus-batal').addEventListener('click', () => $('#dlg-hapus').close());

  muat();
})();