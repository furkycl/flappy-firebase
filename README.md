# Pro Flappy Bird (TS + React)

Basit ve hatasız bir başlangıç sürümü. Oyun canvas üzerinde çalışır, React arayüzü skor ve kontrol akışını sunar. Firebase liderlik tablosu entegrasyonu sonraki adımda eklenecek.

## Kurulum

1. Node.js 18+ önerilir.
2. Bağımlılıklar:

```
npm install
```

3. Geliştirme sunucusu:

```
npm run dev
```

Tarayıcıda `http://localhost:5173` adresine gidin.

## Kontroller

- Boşluk / Yukarı / Tıkla: zıpla
- R / Enter: oyun bitince yeniden başlat

## Yapı

- `src/game/engine.ts`: Oyun fiziği ve çizim döngüsü
- `src/App.tsx`: React arayüzü ve oyun kontrolü
- `src/services/leaderboard.ts`: Firebase entegrasyon kancaları (placeholder)

## Planlanan Firebase Entegrasyonu

Artık eklendi. Aşağıdaki adımları izleyin.

### Firebase Kurulum

1. Firebase Console’da bir Web App oluşturun ve Firestore etkinleştirin.
2. `./.env` dosyası oluşturup `.env.example` içeriğini doldurun:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

3. Bağımlılıkları kurun ve çalıştırın:

```
npm install
npm run dev
```

### Firestore Yapısı

- Koleksiyon: `scores`
- Alanlar: `uid` (string), `name` (string), `score` (number), `ts` (timestamp - server time)
- Koleksiyon: `users/{uid}` -> `lastScoreTs` (timestamp)

### Güvenlik (öneri)

Üretime daha yakın kurallar repo’daki `firestore.rules` dosyasındadır. Özellikler:
- Anonymous Auth zorunlu (yazmak için)
- İsim/Skor validasyonu, skor üst sınırı (5000), ts = server time
- 10 saniyede bir yazma sınırı (per user)

Yükleme talimatı (Firebase CLI):
```
firebase deploy --only firestore:rules
```

### Sorgular ve Sıralama

- Uygulama `ts >= cutoff` (timestamp) filtresi ile son pencereyi alır, sonuçları client tarafında skora göre sıralar ve ilk 50’yi gösterir.

## Sonraki Adımlar

- Firebase konfigürasyonu (`.env`, `firebaseConfig` ve güvenlik kuralları)
- Skor kaydı ve listeleme arayüzü
- Mobil dokunma optimizasyonları ve ses efektleri (opsiyonel)
