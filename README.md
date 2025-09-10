# Pro Flappy Bird

Hedef basit: Ekrana dokunup/tuşlara basıp kuşu engellerin arasından geçirerek en yüksek skoru yapmak.

## Nasıl Oynanır

- Zıplama: Boşluk, Yukarı, W veya ekrana dokun/tıkla.
- Yeniden başlat: Oyun bittiğinde R veya Enter.
- Amaç: Borular arasındaki boşluklardan geçerek puan topla. Zemine veya borulara değersen oyun biter.

## Skor Kaydetme ve Liderlik

- Oyun bittiğinde ismini yazıp “Skoru Kaydet”e bas.
- Minimum skor: 3. Her oyun için 1 kere kaydedebilirsin (kısa aralıkta tekrar kayda izin yok).
- Liderlik tablosu: Son 1 saat, 24 saat ve 1 ay pencerelerine göre en yüksek skorlar listelenir.

## Mobil Deneyim

- Dokunma ile zıplama, yüksek DPI’larda net görüntü ve küçük ekranlara uygun düzen.
- Çentikli ekranlar için güvenli alanlar gözetilir.

## Neler Yaptık (Özet)

- Canvas tabanlı oyun motoru (fizik, çarpışma, skor, oyun durumu).
- Firebase ile skor kaydı ve zaman pencereli liderlik tablosu.
- Basit hile önleme: anonim oturum, minimum skor, isim sınırı ve kısa aralıkta tekrar kayda karşı oran sınırlama.
- Mobil uyum: Daha büyük dokunma hedefleri, yüksek DPI ölçekleme, responsive düzen.

Keyifli oyunlar!
