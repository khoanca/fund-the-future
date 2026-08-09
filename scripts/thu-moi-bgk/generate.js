// Sinh thư mời PNG 1080×1350 cho toàn bộ Ban Giám Khảo — chính thức & dự thính.
// Dùng ảnh chân dung đã tách nền trong img/judges/cut.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = '/Users/m/Edge';
const OUT = path.join(ROOT, 'thu-moi-bgk');
const TMP = __dirname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Ngày 14.08 — Demo Day tại SIHUB, nơi hội đồng chấm điểm (2 hội đồng song song, 30 startup)
const DAY = {
  date: 'Thứ Sáu 14.08.2026',
  time: '08:00',
  event: 'Demo Day & Audition',
  venue: 'SIHUB · 123 Trương Định, Q.3',
  file: '14-08'
};

// [tên, chức danh, tổ chức, slug ảnh, đã xác nhận] — đồng bộ với bgk.html
const judges = [
  ['Tesa Tesanovic', 'Advisor', 'Agile Dynamics', 'tesa-tesanovic', true],
  ['Edward Lim', 'Country Manager', 'BLOCK71 Vietnam (NUS Enterprise)', 'edward-lim', true],
  ['Jeffrey Paine', 'Founding Partner', 'Golden Gate Ventures', 'jeffrey-paine', true],
  ['Vy Lê', 'General Partner', 'Do Ventures', 'vy-le', true],
  ['TS. Trần Quý', 'Founder', 'VIIFM', 'tran-quy', true],
  ['Lương Hưởng', 'Private Equity', 'Maples Capital', 'luong-huong', true],
  ['Jordan Phạm', 'Đại diện', 'NIC — Trung tâm Đổi mới sáng tạo Quốc gia', 'jordan-pham', true],
  ['Nguyễn Thục Khoa', 'Community', 'Eric Capital', 'nguyen-thuc-khoa', true],
  ['Trần Duy Khiêm', 'Country Manager', 'Expara Ventures', 'tran-duy-khiem', true],
  ['Lê Nguyên', 'Đại diện', 'Taiwania Capital', 'le-nguyen', true],
  ['Lucas', 'Investor', 'Equitix Investing', 'lucas-equitix', true],
  ['Nguyễn Xuân Đông', 'Venture Capital', 'VIC Partners', 'nguyen-xuan-dong', true],

  ['Andrew Nhân', 'M&A', 'Eureka', 'andrew-nhan', false],
  ['Sky Hoàng', 'Founder', 'IEC', 'sky-hoang', false],
  ['Giovanni Zangani', 'Private Equity', 'Maestro Equity Partners', 'giovanni-zangani', false],
  ['Phạm Ngọc Huy', 'Venture Capital', 'Lotte Ventures', 'pham-ngoc-huy', false],
  ['Eric Ngo', 'Venture Capital', 'Touchstone Partners', 'eric-ngo', false],
  ['Hà Vĩnh Duy', 'Community', 'Do Ventures', '', false],
  ['Nguyễn Ngọc Nam (Stephan Nam)', 'Angel Investor', '', 'stephan-nam', false],
  ['Châu Lê Minh', 'Private Equity', 'Maples Capital', 'chau-le-minh', false],
  ['Tùng Mai Lê', 'Venture Capital', 'Q Eye', 'tung-mai-le', false],
  ['Nguyễn Tùng Giang', 'Community', 'GBehub', 'nguyen-tung-giang', false],
  ['Laura', 'Managing Partner', 'GenAI Fund', 'laura-genai', false],
  ['Mã Thanh Danh', 'Private Equity', 'KIDO Group', 'ma-thanh-danh', false]
];

// Ảnh gốc mỗi người crop một kiểu — người thì bán thân, người thì cả dáng đứng.
// Dùng khung mặt do Vision đo được để mọi thiệp có khuôn mặt cùng cỡ, cùng vị trí.
const FACES = JSON.parse(fs.readFileSync(path.join(TMP, 'faces.json'), 'utf8'));
const FACE_H = 230;     // chiều cao khuôn mặt trên thiệp 1080×1350 — ảnh chiếm ~2/3 khung
const ANCHOR_X = 610;   // tâm mặt luôn nằm ở đây
const ANCHOR_Y = 500;
const FOOTER_TOP = 1246;

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// PREVIEW_SLUG=<slug> node generate.js — dựng thử 1 người để duyệt bố cục trước khi chạy cả 24
const JUDGES = process.env.PREVIEW_SLUG
  ? judges.filter(j => slug(j[0]) === process.env.PREVIEW_SLUG)
  : judges;

const tpl = fs.readFileSync(path.join(TMP, 'card.tpl.html'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });
const WORK = path.join(require('os').tmpdir(), 'thu-moi-bgk-html');
fs.mkdirSync(WORK, { recursive: true });

const pages = [];
for (const [name, role, org, ph, ok] of JUDGES) {
  const badge = ok ? 'Giám khảo chính thức' : 'Giám khảo dự thính';
  const roleLine = role + (role && org ? ' · ' : '') + org;   // dùng cho trang danh mục (text thường)
  const roleHtml = esc(role) + (role && org ? ' · ' : '') + (org ? `<b>${esc(org)}</b>` : '');

  // tên dài phải nhỏ chữ lại để không tràn khung
  const len = name.length;
  const nameSize = len > 26 ? 34 : len > 20 ? 38 : len > 15 ? 42 : 46;

  let photoHtml = '';
  if (ph) {
    const m = FACES[ph];
    if (!m || !m.face) throw new Error('thiếu dữ liệu khuôn mặt: ' + ph);
    const s = FACE_H / m.face.h;
    const w = Math.round(m.w * s), h = Math.round(m.h * s);
    const left = Math.round(ANCHOR_X - (m.face.x + m.face.w / 2) * s);
    const top = Math.round(ANCHOR_Y - (m.face.y + m.face.h / 2) * s);
    // ảnh bán thân kết thúc lửng giữa thiệp — làm mờ dần chân ảnh cho khỏi bị cắt cụt
    const fade = (top + h) < FOOTER_TOP + 40 ? ' fade' : '';
    photoHtml = `<div class="c-photo${fade}" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px">`
      + `<img src="file://${ROOT}/img/judges/cut/${ph}.png" alt=""></div>`;
  }

  const html = tpl
    .replace(/__ROOT__/g, 'file://' + ROOT)
    .replace(/__NOPHOTO__/g, ph ? '' : 'no-photo')
    .replace(/__PHOTO__/g, photoHtml)
    .replace(/__NS__/g, String(nameSize))
    .replace(/__NAME__/g, esc(name))
    .replace(/__ROLE__/g, () => roleHtml)
    .replace(/__BADGE__/g, badge)
    .replace(/__DATE__/g, DAY.date)
    .replace(/__TIME__/g, DAY.time)
    .replace(/__EVENT__/g, esc(DAY.event))
    .replace(/__VENUE__/g, esc(DAY.venue));

  const base = `thu-moi-${ok ? 'chinh-thuc' : 'du-thinh'}-${slug(name)}-${DAY.file}`;
  const hp = path.join(WORK, base + '.html');
  fs.writeFileSync(hp, html);
  pages.push({ hp, png: path.join(OUT, base + '.png'), name, ok, role: roleLine, file: base + '.png' });
}

fs.writeFileSync(path.join(TMP, 'people.json'), JSON.stringify(
  pages.map(p => ({ name: p.name, role: p.role, ok: p.ok, file: p.file })), null, 1));

let done = 0;
for (const p of pages) {
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=0b0a09ff',
    '--virtual-time-budget=8000',
    '--window-size=1080,1350',
    '--screenshot=' + p.png,
    'file://' + p.hp
  ], { stdio: 'ignore' });
  done++;
  process.stdout.write(`[${done}/${pages.length}] ${p.ok ? 'chính thức' : 'dự thính '} — ${p.name}\n`);
}
console.log('\nXuất xong ' + done + ' thư mời → ' + OUT);
