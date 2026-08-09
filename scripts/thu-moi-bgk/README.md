# Thư mời Ban Giám Khảo — bộ sinh tự động

Sinh 24 thư mời PNG 1080×1350 (4:5) cho giám khảo chính thức & dự thính, theo đúng
nhận diện của form [/thu-moi](../../thu-moi.html).

Kết quả: `thu-moi-bgk/*.png` + trang danh mục `thu-moi-bgk.html` (rewrite `/thu-moi-bgk`).

## Chạy lại

```sh
node scripts/thu-moi-bgk/generate.js    # xuất 24 PNG
node scripts/thu-moi-bgk/gallery.js     # dựng lại trang danh mục
```

Cần Google Chrome (render) — không cần cài thêm gì.

## Sửa nội dung

- **Danh sách giám khảo, chức danh, chính thức/dự thính** — mảng `judges` trong `generate.js`,
  giữ đồng bộ với `judges` trong [bgk.html](../../bgk.html).
- **Ngày, giờ, địa điểm** — hằng `DAY` trong `generate.js`. Hiện đặt cho Demo Day 14.08
  tại SIHUB; đổi sang chung kết 15.08 (THISO MALL SALA) nếu cần bộ thư mời ngày thứ hai.
- **Bố cục thiệp** — `card.tpl.html`.
- **Danh xưng Ông/Bà** — hiện không hiển thị (thiệp ghi thẳng "Trân trọng kính mời" + họ tên)
  để tránh xưng hô sai. Muốn có thì thêm vào chuỗi tên trong `generate.js`.

## Ảnh chân dung đã tách nền

`img/judges/cut/*.png` sinh từ `img/judges/*` bằng Vision framework của macOS
(chạy offline, ảnh không gửi đi đâu):

```sh
swiftc -O scripts/thu-moi-bgk/cutout.swift  -o /tmp/cutout
swiftc -O scripts/thu-moi-bgk/facebox.swift -o /tmp/facebox

for f in img/judges/*.jpg img/judges/*.png; do
  n=$(basename "$f"); /tmp/cutout "$f" "img/judges/cut/${n%.*}.png" 1000
done
```

`cutout` tách nền rồi phóng to Lanczos + làm nét (ảnh gốc chỉ ~480px, thiệp cần ~1000px).

`facebox` đo khung khuôn mặt; kết quả lưu ở `faces.json` và được `generate.js` dùng để
mọi thiệp có khuôn mặt **cùng cỡ, cùng vị trí** — nếu không, ảnh cận mặt và ảnh toàn thân
sẽ lệch nhau tới 3 lần. Thêm giám khảo mới thì phải cập nhật lại `faces.json`:

```sh
for f in img/judges/cut/*.png; do echo "$(basename "$f" .png): $(/tmp/facebox "$f")"; done
```
