# Antalya Ekoloji & İhale İzleme Sistemi

Antalya'nın tüm ilçelerindeki ekolojik ihlalleri, kamu ihalelerini ve
çevre kararlarını harita üzerinde gösteren, her gün otomatik güncellenen
web uygulaması.

## Özellikler

- Leaflet.js harita üzerinde ilçe bazlı görselleştirme
- Günlük otomatik web araması (Anthropic Claude API)
- Eski veriler silinmez, yeni kayıtlar eklenir (tekrar korumalı)
- İlçe / kategori / risk / durum / tarih aralığı filtreleri
- CSV, JSON, GeoJSON dışa aktarma
- Manuel güncelleme endpoint'i (`/update?token=XXX`)

## Kurulum

### 1. Gereksinimleri yükle

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

```bash
cp .env.example .env
nano .env   # veya tercih ettiğiniz editör
```

`.env` dosyasını doldurun:

```
ANTHROPIC_API_KEY=sk-ant-...   ← console.anthropic.com'dan alın
PORT=3000
CRON_HOUR=6                     ← her gün saat 06:00'da güncelle
UPDATE_TOKEN=gizli-token        ← manuel güncelleme için
```

### 3. Başlat

```bash
node server.js
```

Tarayıcıda açın: **http://localhost:3000**

İlk başlatmada `public/data.json` yoksa uygulama hemen bir güncelleme yapar.

---

## Üretim Ortamı (PM2 ile)

```bash
npm install -g pm2

# Başlat ve sistem yeniden başladığında otomatik çalıştır
pm2 start server.js --name antalya-ekoloji
pm2 save
pm2 startup     # çıktıdaki komutu çalıştırın
```

Logları izlemek için:
```bash
pm2 logs antalya-ekoloji
```

---

## Manuel Güncelleme

Sunucu çalışırken istediğiniz zaman güncelleme tetikleyebilirsiniz:

```
http://localhost:3000/update?token=gizli-token
```

---

## Sistem Durumu

```
http://localhost:3000/status
```

Örnek yanıt:
```json
{
  "status": "ok",
  "cron_hour": 6,
  "uptime_sec": 3600,
  "last_update": "15.03.2026 06:00:12",
  "record_count": 47
}
```

---

## Veri Güncelleme Mantığı

Her güncellemede `scripts/update.js`:

1. Mevcut `public/data.json` dosyasını okur
2. Anthropic API'ye web araması yaptırır (Resmi Gazete, EPDK, DSİ, ÇED, MIGEM, OGM vb.)
3. Dönen kayıtları **başlık bazında** mevcut kayıtlarla karşılaştırır
4. Daha önce olmayan kayıtları listenin başına ekler
5. Güncellenmiş veriyi `public/data.json`'a yazar
6. `public/update_log.jsonl` dosyasına log ekler

**Eski veriler hiçbir zaman silinmez.**

---

## Dosya Yapısı

```
antalya-ekoloji/
├── server.js          → Express sunucu + cron scheduler
├── scripts/
│   └── update.js      → Veri güncelleme scripti
├── public/
│   ├── index.html     → Harita arayüzü
│   ├── data.json      → Güncel veri (otomatik oluşturulur)
│   └── update_log.jsonl → Güncelleme geçmişi
├── .env               → API anahtarı ve ayarlar (git'e eklemeyin!)
├── .env.example       → Örnek ayar dosyası
└── package.json
```

---

## Kategoriler

| Kategori | Açıklama |
|---|---|
| DSİ | Devlet Su İşleri ihaleleri |
| EPDK | Enerji lisans kararları |
| ÇED | Çevresel Etki Değerlendirme |
| Maden | Maden ruhsatları |
| Orman | Orman izin ve tahsis kararları |
| Kamulaştırma | Acele kamulaştırma kararları |
| Kıyı | Sahil dolgu ve marina projeleri |
| HES | Hidroelektrik santraller |
| RES | Rüzgar enerji santralleri |
| GES | Güneş enerji santralleri |
| Enerji | Enerji altyapısı ihaleleri |
