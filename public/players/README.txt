FOOTBALL ARENA — oyunçu şəkilləri

KART ŞƏKİLLƏRİ:  public/players/cards/<ad>.png
  Kartda göstərilən şəkillər buradan oxunur. Ən yaxşı nəticə üçün FONSUZ (şəffaf) PNG qoy:
  baş + çiyinlər/bədənin yuxarı hissəsi, üz yuxarıda. Şəkil kartın sağ üst pəncərəsinə sığdırılır.
  Fayl adları (src/data/players.js ilə eyni olmalıdır):

    messi.png  ronaldo.png  mbappe.png  haaland.png  vinicius.png
    de-bruyne.png  bellingham.png  modric.png  van-dijk.png  courtois.png

  Fayl yoxdursa (modric, van-dijk, courtois) həmin oyunçu üçün illüstrasiya portreti göstərilir.

ƏSL ŞƏKİLLƏR:  public/players/*.png
  Sənin göndərdiyin orijinal (fonlu) şəkillər. Kartlar bunlardan istifadə etmir; yalnız mənbə kimi saxlanılır.

FONSUZ KƏSİM ÜÇÜN:  tools/cutouts.py  (Python + opencv-python + numpy + Pillow)
  python3 tools/cutouts.py public/players public/players/cards
  Ağ fonlu və ya şahmat fonlu şəkillərdən fonu silir. Hər şəkil üçün parametrlər faylın sonundakı `jobs` siyahısındadır.

ŞƏKİL UYĞUNLAŞDIRMASI:  src/data/players.js
  photoFit: "contain"  — şəkil tam görünsün (illüstrasiya, yalnız baş). Yazılmasa "cover" olur: hündür kəsim, üz yuxarıda.
