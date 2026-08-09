// Sinh trang danh mục thu-moi-bgk.html — xem & tải nhanh 24 thư mời để gửi Zalo/email
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/m/Edge';

const files = fs.readdirSync(path.join(ROOT, 'thu-moi-bgk')).filter(f => f.endsWith('.png')).sort();
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'people.json'), 'utf8'));

const cardsFor = ok => meta.filter(p => p.ok === ok).map(p => `
      <figure class="it">
        <a href="thu-moi-bgk/${p.file}" target="_blank" rel="noopener">
          <img src="thu-moi-bgk/${p.file}" alt="Thư mời ${p.name}" loading="lazy">
        </a>
        <figcaption>
          <b>${p.name}</b>
          <span>${p.role}</span>
          <a class="dl" href="thu-moi-bgk/${p.file}" download>⬇ Tải PNG</a>
        </figcaption>
      </figure>`).join('');

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thư mời Ban Giám Khảo — Fund the Future 2026</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32.png">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#0b0a09;--tile:#141210;--line:rgba(255,255,255,.08);--ink:#f5f1ea;
        --muted:#9b968d;--dim:#5d5950;--org:#ff5c00;--org-2:#ff8a3c;
        --disp:'Unbounded',sans-serif;--body:'Be Vietnam Pro',sans-serif}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--body);background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1180px;margin:0 auto;padding:40px 20px 80px}
  h1{font-family:var(--disp);font-weight:700;font-size:clamp(22px,4vw,34px);letter-spacing:-.01em}
  h1 em{font-style:normal;color:var(--org-2)}
  .lede{color:var(--muted);font-size:14.5px;margin-top:12px;max-width:640px}
  .kicker{font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--org-2);margin-bottom:10px}
  h2{font-family:var(--disp);font-size:19px;margin-bottom:4px}
  section{margin-top:48px}
  .shead{margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--line)}
  .shead p{color:var(--muted);font-size:13.5px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
  .it{background:var(--tile);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:.22s}
  .it:hover{border-color:rgba(255,92,0,.45);transform:translateY(-3px)}
  .it img{width:100%;display:block;aspect-ratio:4/5;object-fit:cover}
  figcaption{padding:13px 15px 15px;display:flex;flex-direction:column;gap:3px}
  figcaption b{font-size:14px;font-weight:600}
  figcaption span{color:var(--muted);font-size:12px;line-height:1.35}
  .dl{margin-top:9px;align-self:flex-start;font-size:12px;font-weight:600;color:var(--org-2);
      border:1px solid rgba(255,92,0,.4);border-radius:8px;padding:5px 12px;transition:.2s}
  .dl:hover{background:rgba(255,92,0,.12)}
  footer{margin-top:60px;padding-top:24px;border-top:1px solid var(--line);color:var(--dim);font-size:12px}
</style>
</head>
<body>
<div class="wrap">
  <div class="kicker">Nội bộ · Ban Tổ Chức</div>
  <h1>Thư mời <em>Ban Giám Khảo</em> — Fund the Future 2026</h1>
  <p class="lede">${meta.length} thư mời khổ 1080×1350 (4:5), ảnh chân dung đã tách nền, chuẩn gửi Zalo · email · Facebook.
     Demo Day ngày 14.08.2026 tại SIHUB, 123 Trương Định, Q.3 — đón khách 08:00.</p>

  <section>
    <div class="shead">
      <h2>Giám khảo chính thức</h2>
      <p>${meta.filter(p => p.ok).length} thư mời</p>
    </div>
    <div class="grid">${cardsFor(true)}
    </div>
  </section>

  <section>
    <div class="shead">
      <h2>Giám khảo dự thính</h2>
      <p>${meta.filter(p => !p.ok).length} thư mời</p>
    </div>
    <div class="grid">${cardsFor(false)}
    </div>
  </section>

  <footer>FUND THE FUTURE 2026 · AI BUILDERS × INVESTORS · Trang nội bộ, không lập chỉ mục tìm kiếm.</footer>
</div>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'thu-moi-bgk.html'), html);
console.log('Đã tạo thu-moi-bgk.html — ' + files.length + ' thư mời');
