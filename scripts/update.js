/**
 * update.js — Antalya Ekoloji & İhale Veri Güncelleyici
 * -------------------------------------------------------
 * Bu script Anthropic API'yi kullanarak web araması yapar,
 * yeni kayıtları data.json dosyasına ekler.
 *
 * Kullanım:
 *   node scripts/update.js            → tek seferlik çalıştır
 *   (server.js içinden cron ile)      → günlük otomatik
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');

const API_KEY   = process.env.ANTHROPIC_API_KEY;
const DATA_FILE = path.join(__dirname, '..', process.env.DATA_FILE || 'public/data.json');

// ── Başlangıç örnek verisi (data.json henüz yoksa) ──────────────────────────
const SAMPLE_DATA = [
  {id:"s1",ilce:"Manavgat",lat:36.7853,lng:31.4436,kategori:"DSİ",baslik:"Manavgat Çayı Taşkın Koruma İhalesi",aciklama:"DSİ 13. Bölge Müdürlüğü'nce 48 km dere yatağı betonlama ve taşkın koruma yapımı ihalesi açıldı. Riparian ekosisteme zarar verme riski var.",risk:"orta",tarih:"2026-02-15",kaynak:"DSİ",kaynak_url:"https://dsi.gov.tr",durum:"devam",notlar:""},
  {id:"s2",ilce:"Kemer",lat:36.5967,lng:30.5594,kategori:"Kıyı",baslik:"Kemer Yat Limanı Genişletme ÇED",aciklama:"15 hektarlık deniz dolgusu ile yat limanı kapasitesi artırımı ÇED sürecinde. Posidonia oceanica çayırları tehdit altında.",risk:"yüksek",tarih:"2026-01-20",kaynak:"ÇED Bilgi Sistemi",kaynak_url:"https://csb.gov.tr/ced",durum:"askıda",notlar:""},
  {id:"s3",ilce:"Elmalı",lat:36.7333,lng:29.9167,kategori:"Maden",baslik:"Elmalı Krom Madeni Arama Ruhsatı",aciklama:"MTA tarafından 2450 hektarlık alanda krom madeni arama ruhsatı verildi.",risk:"yüksek",tarih:"2026-01-10",kaynak:"MIGEM",kaynak_url:"https://maden.gov.tr",durum:"devam",notlar:""},
  {id:"s4",ilce:"Alanya",lat:36.5444,lng:32.0017,kategori:"GES",baslik:"Alanya GES Üretim Lisansı (50 MW)",aciklama:"50 MW kapasiteli güneş enerji santrali için EPDK üretim lisansı verildi.",risk:"düşük",tarih:"2026-02-01",kaynak:"EPDK",kaynak_url:"https://epdk.gov.tr",durum:"tamamlandı",notlar:""},
  {id:"s5",ilce:"Kaş",lat:36.2014,lng:29.64,kategori:"Orman",baslik:"Kaş Yangın Alanında Yapılaşma İtirazı",aciklama:"2024 orman yangınıyla zarar gören Kalkan bölgesinde villa projesi imar izni tartışması.",risk:"yüksek",tarih:"2025-12-05",kaynak:"Antalya İl Çevre Müdürlüğü",kaynak_url:"",durum:"askıda",notlar:"İtiraz davası açıldı"},
  {id:"s6",ilce:"Finike",lat:36.295,lng:30.1528,kategori:"HES",baslik:"Alakır Çayı HES Genişletme İhalesi",aciklama:"Alakır Çayı üzerinde ek santral kurulumu ihalesi. Endemik alabalık ve akdeniz foku tehdit altında.",risk:"yüksek",tarih:"2026-02-20",kaynak:"DSİ",kaynak_url:"https://dsi.gov.tr",durum:"devam",notlar:""},
  {id:"s7",ilce:"Serik",lat:36.9167,lng:31.1,kategori:"ÇED",baslik:"Serik OSB Genişletme ÇED Olumlu Kararı",aciklama:"320 hektar tarım-orman alanında OSB genişletme ÇED olumlu kararı aldı.",risk:"orta",tarih:"2026-01-25",kaynak:"ÇED Bilgi Sistemi",kaynak_url:"https://csb.gov.tr/ced",durum:"tamamlandı",notlar:""},
  {id:"s8",ilce:"Konyaaltı",lat:36.8667,lng:30.6,kategori:"Kıyı",baslik:"Konyaaltı Sahil Dolgu İnşaatı",aciklama:"Büyükşehir Belediyesi'nce 2.8 km sahil dolgu ihalesi.",risk:"orta",tarih:"2026-03-01",kaynak:"ABS",kaynak_url:"",durum:"devam",notlar:""},
  {id:"s9",ilce:"Kumluca",lat:36.3667,lng:30.2833,kategori:"Kamulaştırma",baslik:"Kumluca GES Acele Kamulaştırma",aciklama:"80 hektar 1. sınıf tarım arazisi ve zeytinlik GES için acele kamulaştırıldı.",risk:"yüksek",tarih:"2026-01-08",kaynak:"Resmi Gazete",kaynak_url:"https://resmigazete.gov.tr",durum:"devam",notlar:""},
  {id:"s10",ilce:"Gündoğmuş",lat:36.8167,lng:32.0167,kategori:"RES",baslik:"Gündoğmuş RES Projesi Ön Lisansı",aciklama:"17 türbinli 51 MW rüzgar santrali EPDK ön lisansı aldı.",risk:"orta",tarih:"2025-11-15",kaynak:"EPDK",kaynak_url:"https://epdk.gov.tr",durum:"askıda",notlar:""},
  {id:"s11",ilce:"Akseki",lat:37.0528,lng:31.7944,kategori:"Maden",baslik:"Köprülü Kanyon Yakınında Mermer Ocağı",aciklama:"Köprülü Kanyon Milli Parkı sınırına 400 metre mesafede mermer ocağı genişletme talebi.",risk:"yüksek",tarih:"2026-02-10",kaynak:"MIGEM",kaynak_url:"",durum:"askıda",notlar:""},
  {id:"s12",ilce:"Gazipaşa",lat:36.2686,lng:32.5175,kategori:"DSİ",baslik:"Gazipaşa Sulama Kanalı İnşaatı",aciklama:"DSİ Gazipaşa ovasında 45 km beton kaplama sulama kanalı ihalesi.",risk:"düşük",tarih:"2026-03-05",kaynak:"DSİ",kaynak_url:"https://dsi.gov.tr",durum:"devam",notlar:""},
  {id:"s13",ilce:"Kepez",lat:37.0,lng:30.7,kategori:"Enerji",baslik:"SEDAŞ Kepez Kablo Döşeme İhalesi",aciklama:"SEDAŞ Kepez 150 km yer altı kablo döşeme ihalesi.",risk:"düşük",tarih:"2026-02-28",kaynak:"SEDAŞ",kaynak_url:"",durum:"devam",notlar:""},
  {id:"s14",ilce:"Döşemealtı",lat:37.1167,lng:30.6167,kategori:"Orman",baslik:"Döşemealtı Lojistik Köy Orman İzni",aciklama:"1200 dönüm kızılçam ormanı üzerinde lojistik köy kurulması için OGM'ye başvuru.",risk:"yüksek",tarih:"2025-12-20",kaynak:"OGM",kaynak_url:"https://ogm.gov.tr",durum:"askıda",notlar:""},
  {id:"s15",ilce:"Korkuteli",lat:37.0667,lng:30.2,kategori:"HES",baslik:"Aksu Çayı HES Ön Lisansı",aciklama:"8 MW run-of-river HES için EPDK ön lisansı verildi.",risk:"orta",tarih:"2026-01-30",kaynak:"EPDK",kaynak_url:"https://epdk.gov.tr",durum:"devam",notlar:""},
  {id:"s16",ilce:"İbradı",lat:37.1,lng:31.5833,kategori:"ÇED",baslik:"İbradı Barajı ÇED Başvurusu",aciklama:"İbradı barajı ÇED süreci. 3 köyün taşınması ve 500 ha alan su altında kalacak.",risk:"yüksek",tarih:"2026-02-14",kaynak:"ÇED Bilgi Sistemi",kaynak_url:"https://csb.gov.tr/ced",durum:"devam",notlar:""},
  {id:"s17",ilce:"Aksu",lat:36.9838,lng:30.9192,kategori:"GES",baslik:"Aksu Tarım Arazisi GES İmar Değişikliği",aciklama:"100 dönüm 1. sınıf tarım arazisi üzerine GES imar planı değişikliği talebi.",risk:"orta",tarih:"2026-03-08",kaynak:"Antalya Belediyesi",kaynak_url:"",durum:"askıda",notlar:""},
  {id:"s18",ilce:"Muratpaşa",lat:36.8841,lng:30.7056,kategori:"Kıyı",baslik:"Lara Sahili Yasadışı Dolgu İtirazı",aciklama:"Lara kıyı bandında otel inşaatında izinsiz deniz dolgusu suç duyurusu.",risk:"yüksek",tarih:"2026-01-12",kaynak:"Antalya Barosu",kaynak_url:"",durum:"askıda",notlar:"Suç duyurusu yapıldı"}
];

// ── Mevcut veriyi oku ────────────────────────────────────────────────────────
function loadExisting() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.records) ? parsed.records : SAMPLE_DATA;
    }
  } catch (e) {
    console.error('[update] data.json okunamadı, örnek veriyle başlanıyor:', e.message);
  }
  return [...SAMPLE_DATA];
}

// ── Veriyi kaydet ────────────────────────────────────────────────────────────
function saveData(records, log) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload = {
    updated_at: new Date().toISOString(),
    updated_at_tr: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    count: records.length,
    records
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');

  // Güncelleme günlüğü
  const logFile = path.join(path.dirname(DATA_FILE), 'update_log.jsonl');
  fs.appendFileSync(logFile, JSON.stringify({ ...log, ts: new Date().toISOString() }) + '\n', 'utf8');
  console.log('[update] Kaydedildi →', DATA_FILE, '| Toplam:', records.length, '| Yeni:', log.added);
}

// ── Anthropic API çağrısı ────────────────────────────────────────────────────
async function fetchFromClaude() {
  if (!API_KEY) throw new Error('ANTHROPIC_API_KEY tanımlı değil (.env dosyasını kontrol edin)');

  const today = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: `Sen Antalya ili çevre ihlalleri ve kamu ihaleleri izleme asistanısın.
YALNIZCA geçerli JSON array döndür. Başka hiçbir metin, açıklama veya markdown ekleme.

Her kayıt formatı:
{"id":"unique_string","ilce":"ilçe","lat":enlem,"lng":boylam,"kategori":"DSİ|EPDK|ÇED|Maden|Orman|Kamulaştırma|Kıyı|Enerji|HES|RES|GES","baslik":"kısa başlık","aciklama":"detay","risk":"yüksek|orta|düşük","tarih":"YYYY-AA-GG","kaynak":"kaynak adı","kaynak_url":"url veya bos","durum":"devam|tamamlandı|iptal|askıda","notlar":"ek bilgi veya bos"}

Koordinatlar:
Aksu:36.9838,30.9192|Alanya:36.5444,32.0017|Akseki:37.0528,31.7944|Döşemealtı:37.1167,30.6167
Elmalı:36.7333,29.9167|Finike:36.295,30.1528|Gazipaşa:36.2686,32.5175|Gündoğmuş:36.8167,32.0167
İbradı:37.1,31.5833|Kaş:36.2014,29.64|Kemer:36.5967,30.5594|Kepez:37.0,30.7
Konyaaltı:36.8667,30.6|Korkuteli:37.0667,30.2|Kumluca:36.3667,30.2833
Manavgat:36.7853,31.4436|Muratpaşa:36.8841,30.7056|Serik:36.9167,31.1`,
    messages: [{
      role: 'user',
      content: `Bugün ${today}. Antalya ili için son 60 güne ait verileri şu kaynaklarda ara:
1. resmigazete.gov.tr — acele kamulaştırma, ihale kararları
2. epdk.gov.tr — HES/RES/GES/termik lisans kararları
3. dsi.gov.tr — DSİ ihaleleri
4. csb.gov.tr — ÇED kararları (olumlu/olumsuz)
5. maden.gov.tr — maden ruhsatları
6. ogm.gov.tr — orman izinleri, tahsis kararları
7. Kıyı dolgu, marina projeleri haberleri
8. SEDAŞ Antalya ihale ilanları
9. ekap.kik.gov.tr — Antalya kamu ihaleleri

10-20 kayıt döndür. SADECE JSON array: [...]`
    }]
  };

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error('API ' + resp.status + ': ' + (err.error?.message || resp.statusText));
  }

  const data = await resp.json();
  let txt = '';
  for (const b of (data.content || [])) { if (b.type === 'text') txt += b.text; }

  const s = txt.indexOf('['), e = txt.lastIndexOf(']');
  if (s === -1 || e <= s) throw new Error('API yanıtında JSON array bulunamadı');
  return JSON.parse(txt.slice(s, e + 1));
}

// ── Ana güncelleme fonksiyonu (dışa aktarılan) ───────────────────────────────
async function runUpdate() {
  console.log('[update] Başlıyor —', new Date().toLocaleString('tr-TR'));

  const existing = loadExisting();
  const existingTitles = new Set(existing.map(d => (d.baslik || '').toLowerCase().trim()));

  let newRecs;
  try {
    newRecs = await fetchFromClaude();
  } catch (err) {
    console.error('[update] API hatası:', err.message);
    saveData(existing, { added: 0, error: err.message });
    return { added: 0, total: existing.length, error: err.message };
  }

  if (!Array.isArray(newRecs)) {
    console.warn('[update] Geçersiz yanıt formatı');
    return { added: 0, total: existing.length };
  }

  let added = 0;
  newRecs.forEach((d, i) => {
    if (!d.id) d.id = 'auto_' + Date.now() + '_' + i;
    if (!d.lat || !d.lng) return;
    const title = (d.baslik || '').toLowerCase().trim();
    if (title && !existingTitles.has(title)) {
      existing.unshift(d);
      existingTitles.add(title);
      added++;
    }
  });

  saveData(existing, { added, total: existing.length });
  return { added, total: existing.length };
}

// ── Doğrudan çalıştırıldığında ───────────────────────────────────────────────
if (require.main === module) {
  runUpdate()
    .then(r => { console.log('[update] Tamamlandı:', r); process.exit(0); })
    .catch(e => { console.error('[update] Fatal:', e); process.exit(1); });
}

module.exports = { runUpdate };
