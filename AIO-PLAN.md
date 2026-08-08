# Plan AIO — theedgealliance.com

Mục tiêu: trang được các AI (ChatGPT, Gemini, Perplexity, Google AI Overviews) đọc được đầy đủ — kể cả tiếng Việt — và trích dẫn khi người dùng hỏi về sự kiện Fund the Future.

## Quy ước làm việc chung (bắt buộc đọc trước khi nhận task)

- Mỗi task làm trên 1 branch riêng: `aio/<mã-task>` (ví dụ `aio/a1-llms-txt`), xong tạo PR về `main`.
- **Chỉ sửa đúng file ghi trong task của mình.** Hai task cùng đụng `index.html` (A2, A4) phải làm nối tiếp hoặc do cùng 1 người.
- Mọi thông tin sự kiện (tên, ngày, giờ, địa chỉ…) **chỉ copy từ `FACTS.md`** (task T0), không tự gõ lại, không tự "nhớ".
- Test local: chạy `python3 -m http.server 8000` ở thư mục gốc repo rồi mở `http://localhost:8000`.
- Không ai tự deploy. Deploy production (`vercel deploy --prod`) do 1 người phụ trách sau khi merge.
- Kiểm tra JSON-LD hợp lệ bằng lệnh (chạy ở gốc repo, thay tên file nếu cần):
  ```bash
  python3 -c "
  import re, json
  html = open('index.html').read()
  for m in re.finditer(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.S):
      json.loads(m.group(1))
  print('OK')"
  ```

## Bảng task tổng

| Mã | Việc | File đụng tới | Phụ thuộc | Ước lượng |
|----|------|---------------|-----------|-----------|
| T0 | Fact sheet chuẩn | `FACTS.md` (mới) | — | 30' |
| A1 | Tạo `llms.txt` | `llms.txt` (mới) | T0 | 1h |
| A2 | FAQPage JSON-LD | `index.html` | T0 | 1–2h |
| A3 | Khai báo AI bot trong robots.txt | `robots.txt` | — | 30' |
| A4 | Khối facts văn xuôi song ngữ | `index.html` | T0, sau A2 | 2h |
| C1 | Script trích từ điển i18n | `scripts/extract-i18n.py`, `i18n-vi.json` (mới) | — | 2h |
| C2 | Dựng trang tiếng Việt `/vi` | `scripts/build-vi.py`, `vi/index.html` (mới) | C1, T0 | 1 ngày |
| C3 | hreflang + nút đổi ngôn ngữ thành link thật | `index.html`, `vi/index.html` | C2 | 2–3h |
| C4 | Cập nhật sitemap cho `/vi` | `sitemap.xml` | C2 | 30' |
| C5 | Trang recap sau sự kiện | `recap.html` (mới) | sau 15.08 | 0.5–1 ngày |
| C6 | QA tổng + baseline chatbot | không sửa code | tất cả A, C1–C4 | 2h |

## Phân công chạy song song (ví dụ với 3 dev)

- **Dev 1:** T0 → A1 → A3 → C4 (toàn file text riêng, không đụng ai)
- **Dev 2:** A2 → A4 → C3 (chuỗi các task đụng `index.html`, một người ôm để khỏi conflict)
- **Dev 3:** C1 → C2 (nhánh tiếng Việt, độc lập hoàn toàn cho tới C3)
- C6 giao cho bất kỳ ai xong sớm nhất. C5 để sau sự kiện.

Timeline gợi ý: T0 + toàn bộ nhóm A xong và deploy trong **1 ngày** (10.08). C1–C4 xong **11–12.08** để Google/Bing kịp index trước 14.08.

---

## Chi tiết từng task

### T0 — `FACTS.md`: nguồn sự thật duy nhất

Tạo file `FACTS.md` ở gốc repo, nội dung lấy từ `index.html` hiện tại (đối chiếu footer + section Day 1 / Grand Finale), gồm:

- Tên sự kiện đầy đủ (VI + EN): Fund the Future 2026 — AI Builders × Investors
- Ngày giờ: Demo Day 14.08.2026, 8h00–15h30; Grand Finale 15.08.2026 (trong khuôn khổ Conviction 2026)
- Địa điểm 1: SIHUB — Saigon Innovation Hub, 123 Trương Định, Phường Xuân Hòa, TP.HCM
- Địa điểm 2: THISO MALL SALA, 10 Mai Chí Thọ, Phường Thủ Thiêm, TP. Thủ Đức, TP.HCM
- Đơn vị tổ chức: Fresgen AI Co., Ltd. (thương hiệu The Edge Alliance), Snappp.AI; phối hợp SIHUB
- Các URL chính: `/`, `/agenda`, `/the-le.html`, `/bgk`, `/community`, `/thu-moi`, link đăng ký startup, link mua vé
- Mô tả 2–3 câu về sự kiện (VI + EN) — dùng lại meta description hiện có

**Nghiệm thu:** được người phụ trách duyệt nội dung trước khi các task khác dùng.

### A1 — Tạo `/llms.txt`

File markdown cho AI crawler đọc, theo chuẩn [llmstxt.org](https://llmstxt.org):

```markdown
# Fund the Future 2026

> [2–3 câu mô tả EN từ FACTS.md]

> [2–3 câu mô tả VI từ FACTS.md]

## Key facts
- Dates: ...
- Venues: ...
- Organizers: ...
- Registration: ...

## Pages
- [Agenda](https://theedgealliance.com/agenda): ...
- [Rules / Thể lệ](https://theedgealliance.com/the-le.html): ...
- [Judges / BGK](https://theedgealliance.com/bgk): ...
```

Mỗi mục facts viết cả VI lẫn EN. **Nghiệm thu:** sau deploy, `curl https://theedgealliance.com/llms.txt` trả 200; mọi số liệu khớp `FACTS.md` 100%.

### A2 — FAQPage JSON-LD trong `index.html`

- Tìm section FAQ trong `index.html` (quanh dòng có `faq-title`). Lấy **nguyên văn** từng cặp câu hỏi–trả lời bản tiếng Anh (bản hiển thị mặc định).
- Thêm 1 khối `<script type="application/ld+json">` mới **ngay sau** khối Event schema có sẵn trong `<head>`, dạng:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "<câu hỏi>",
        "acceptedAnswer": { "@type": "Answer", "text": "<câu trả lời>" }
      }
    ]
  }
  ```
- Không sửa gì khác trong file.

**Nghiệm thu:** lệnh kiểm tra JSON-LD in `OK`; dán URL preview vào [Rich Results Test](https://search.google.com/test/rich-results) nhận diện được FAQPage; số câu hỏi trong schema = số câu trong section FAQ.

### A3 — robots.txt: khai báo rõ AI bot

Sửa `robots.txt` thành (giữ nguyên dòng Sitemap):

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://theedgealliance.com/sitemap.xml
```

**Nghiệm thu:** sau deploy `curl https://theedgealliance.com/robots.txt` ra đúng nội dung trên.

### A4 — Khối facts văn xuôi song ngữ trong `index.html`

⚠️ Cùng file với A2 — chỉ bắt đầu sau khi A2 đã merge.

- Thêm 1 section ngắn ngay **sau hero** (trước section "The Organizers"): một đoạn 3–4 câu tiếng Việt + một đoạn tiếng Anh trả lời thẳng: *Fund the Future là gì, diễn ra ngày nào ở đâu, ai tổ chức, đăng ký/mua vé ở đâu* (nội dung từ `FACTS.md`, có link).
- Đây là văn bản tĩnh nằm ngoài hệ thống `data-i18n` (cả 2 ngôn ngữ cùng hiển thị) — mục đích là để crawler luôn thấy bản tiếng Việt.
- Style: dùng lại class sẵn có (`wrap`, màu `--muted`), chữ nhỏ, không phá layout. Tham khảo style đoạn `lead` hiện có.

**Nghiệm thu:** mở local thấy đoạn text ở cả desktop lẫn mobile (thu cửa sổ ~375px) không vỡ layout; `curl` trang chủ thấy đoạn tiếng Việt trong HTML thô.

### C1 — Script trích từ điển i18n

- Trong `index.html` có 1 object JS dạng `'key': 'chuỗi tiếng Việt'` (tìm quanh dòng chứa `'sihub-desc'`) và các phần tử HTML mang thuộc tính `data-i18n="key"`.
- Viết `scripts/extract-i18n.py`: đọc `index.html`, xuất ra `i18n-vi.json` gồm toàn bộ cặp key → chuỗi VI, đồng thời in ra cảnh báo: key nào có trong HTML (`data-i18n`) mà **thiếu** trong dict, và ngược lại.

**Nghiệm thu:** `python3 scripts/extract-i18n.py` chạy không lỗi; số key trong JSON = số key trong dict của `index.html`; danh sách key thiếu (nếu có) được ghi vào PR description.

### C2 — Dựng trang tiếng Việt tĩnh `vi/index.html`

- Viết `scripts/build-vi.py`: đọc `index.html` + `i18n-vi.json`, tạo `vi/index.html`:
  1. Thay nội dung mọi phần tử có `data-i18n` bằng chuỗi VI tương ứng (giữ nguyên thẻ con như `<em>` nếu chuỗi VI có chứa HTML).
  2. Đổi `<html lang="en">` → `<html lang="vi">`.
  3. Dịch `<title>`, `meta description`, `og:title`, `og:description`, `twitter:*` sang tiếng Việt (chuỗi dịch cố định trong script, duyệt cùng PR).
  4. Đổi canonical thành `https://theedgealliance.com/vi` và `og:url` tương ứng.
  5. Sửa đường dẫn tương đối (`img/…`, `logos/…`) thành tuyệt đối (`/img/…`, `/logos/…`) để chạy đúng dưới `/vi`.
  6. Giữ nguyên khối JSON-LD Event; dịch trường `name`/`description` sang VI.
- Chạy script bằng lệnh, **không sửa tay** `vi/index.html` (mỗi lần trang gốc đổi chỉ cần chạy lại script).

**Nghiệm thu:** mở `http://localhost:8000/vi/` — layout y hệt bản gốc, toàn bộ chữ trong các phần tử `data-i18n` là tiếng Việt; view-source không còn meta description tiếng Anh; lệnh kiểm tra JSON-LD in `OK` cho `vi/index.html`.

### C3 — hreflang + nút đổi ngôn ngữ thành link thật

⚠️ Đụng cả `index.html` và `vi/index.html` — làm sau khi C2 merge.

- Thêm vào `<head>` của **cả hai** trang:
  ```html
  <link rel="alternate" hreflang="en" href="https://theedgealliance.com/">
  <link rel="alternate" hreflang="vi" href="https://theedgealliance.com/vi">
  <link rel="alternate" hreflang="x-default" href="https://theedgealliance.com/">
  ```
  (Bước này thêm vào `build-vi.py` cho bản VI, không sửa tay.)
- Đổi nút chuyển ngôn ngữ VI/EN: từ toggle JS (`localStorage 'ftf-lang'`) thành **link thật**: trên trang EN nút "VI" là `<a href="/vi">`, trên trang VI nút "EN" là `<a href="/">`. Gỡ hoặc vô hiệu JS toggle để không còn 2 cơ chế song song.

**Nghiệm thu:** click nút chuyển qua lại đúng 2 URL; view-source cả 2 trang thấy đủ 3 dòng hreflang; không còn hiện tượng trang EN tự nhảy sang VI do localStorage cũ.

### C4 — Sitemap cho `/vi`

Thêm vào `sitemap.xml`:

```xml
<url>
  <loc>https://theedgealliance.com/vi</loc>
  <lastmod>[ngày merge]</lastmod>
  <priority>0.9</priority>
</url>
```

**Nghiệm thu:** sau deploy, `curl -o /dev/null -w '%{http_code}' https://theedgealliance.com/vi` trả 200; sitemap vẫn là XML hợp lệ (`python3 -c "import xml.dom.minidom;xml.dom.minidom.parse('sitemap.xml');print('OK')"`).

### C5 — Trang recap (làm sau 15.08)

- Tạo `recap.html`: kết quả chung cuộc, quán quân, số liệu (số startup, số quỹ, số người tham dự), 6–10 ảnh, quote từ BGK/nhà tài trợ. Song ngữ theo mô hình C2.
- Cập nhật Event schema trên trang chủ: giữ nguyên (sự kiện đã qua vẫn hợp lệ), thêm link nổi bật tới recap từ hero.
- Thêm `/recap` vào sitemap.

**Nghiệm thu:** trang mở được, có trong sitemap, được link từ trang chủ.

### C6 — QA tổng + baseline chatbot

Không sửa code. Chạy checklist sau deploy cuối:

1. `curl` các URL: `/`, `/vi`, `/llms.txt`, `/robots.txt`, `/sitemap.xml` — tất cả 200.
2. Rich Results Test cho `/` và `/vi`: thấy Event + FAQPage.
3. Search Console + Bing Webmaster: submit lại sitemap, Request Indexing cho `/` và `/vi`.
4. Hỏi ChatGPT, Gemini, Perplexity 3 câu: "Fund the Future SIHUB là sự kiện gì?", "Sự kiện gọi vốn AI startup TP.HCM tháng 8/2026?", "Fund the Future 2026 diễn ra ở đâu?" — chụp màn hình kết quả làm **baseline** (chưa cần được nhắc tên, mục đích là so sánh sau này).
5. Ghi kết quả vào 1 issue/ghi chú chung.

**Nghiệm thu:** checklist 5 mục có kết quả ghi lại.
