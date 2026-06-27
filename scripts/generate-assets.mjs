import fs from "node:fs/promises";
import path from "node:path";

const out = "public/assets";

const colors = {
  teal: "#0e3a3f",
  deep: "#06191d",
  gold: "#c99a46",
  paper: "#f2dfbd",
  red: "#a43a32",
  jade: "#2f8f7b",
  ink: "#1d2526",
};

async function write(file, contents) {
  const target = path.join(out, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, "utf8");
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2cf"/>
      <stop offset="1" stop-color="#d8bd82"/>
    </linearGradient>
    <linearGradient id="teal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#14515a"/>
      <stop offset="1" stop-color="#06191d"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#001014" flood-opacity="0.34"/>
    </filter>
  </defs>
  ${body}
</svg>`;
}

function background(kind) {
  const sharedFloor = `<rect x="0" y="1260" width="1080" height="660" fill="#07191c"/>
  <path d="M0 1260h1080v660H0z" fill="url(#teal)" opacity=".85"/>
  <path d="M0 1370c220-50 390-30 560 12 230 56 352 34 520-20v558H0z" fill="#0b2b31" opacity=".7"/>`;
  if (kind === "bank") {
    return svg(1080, 1920, `
      <rect width="1080" height="1920" fill="#0b252a"/>
      <rect x="0" y="0" width="1080" height="840" fill="#0f3d45"/>
      <circle cx="888" cy="188" r="180" fill="#d7b15f" opacity=".12"/>
      <rect x="70" y="130" width="940" height="92" rx="10" fill="#f2dfbd" opacity=".9"/>
      <text x="540" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#15363a">NGÂN HÀNG NHÂN ÁI</text>
      <rect x="110" y="288" width="860" height="720" rx="28" fill="#103f46" stroke="#d6a84e" stroke-width="8"/>
      <rect x="170" y="360" width="300" height="420" rx="12" fill="#e5c986" opacity=".23"/>
      <rect x="610" y="360" width="300" height="420" rx="12" fill="#e5c986" opacity=".23"/>
      <path d="M92 1060h896c36 0 68 31 68 68v170H24v-170c0-37 31-68 68-68z" fill="#c99a46" filter="url(#softShadow)"/>
      <path d="M70 1115h940v210H70z" fill="#71492c" opacity=".62"/>
      <rect x="168" y="1096" width="260" height="74" rx="8" fill="#f5e5bf"/>
      <rect x="672" y="1098" width="230" height="64" rx="8" fill="#f5e5bf"/>
      ${sharedFloor}
    `);
  }
  if (kind === "home") {
    return svg(1080, 1920, `
      <rect width="1080" height="1920" fill="#0b2022"/>
      <rect x="0" y="0" width="1080" height="1220" fill="#7a3430"/>
      <rect x="70" y="120" width="940" height="860" rx="24" fill="#a4513f" opacity=".5"/>
      <rect x="380" y="140" width="320" height="280" rx="18" fill="#502320" stroke="#d9ae54" stroke-width="8"/>
      <circle cx="540" cy="270" r="76" fill="#f1dfb8"/>
      <rect x="448" y="372" width="184" height="34" rx="8" fill="#d9ae54"/>
      <rect x="185" y="540" width="710" height="370" rx="20" fill="#ecd7a8" opacity=".2"/>
      <path d="M150 960h780l80 285H70z" fill="#301b19" filter="url(#softShadow)"/>
      <rect x="256" y="1020" width="568" height="80" rx="18" fill="#f2dfbd"/>
      ${sharedFloor}
    `);
  }
  if (kind === "temple") {
    return svg(1080, 1920, `
      <rect width="1080" height="1920" fill="#102a28"/>
      <rect width="1080" height="1160" fill="#183c36"/>
      <circle cx="170" cy="190" r="170" fill="#d6a84e" opacity=".18"/>
      <path d="M150 680l390-360 390 360z" fill="#8b302b" stroke="#d6a84e" stroke-width="12"/>
      <rect x="236" y="680" width="608" height="390" fill="#bd8f46"/>
      <rect x="404" y="760" width="272" height="310" rx="18" fill="#2b2a20"/>
      <path d="M88 604c180 36 318 36 452-44 140 82 278 80 452 44" fill="none" stroke="#d6a84e" stroke-width="26"/>
      ${sharedFloor}
    `);
  }
  return svg(1080, 1920, `
    <rect width="1080" height="1920" fill="#0b252a"/>
    <rect x="90" y="150" width="900" height="780" rx="36" fill="#163f45" stroke="#c99a46" stroke-width="8"/>
    <rect x="165" y="250" width="750" height="540" rx="18" fill="#f2dfbd" opacity=".12"/>
    <path d="M160 880h760v240H160z" fill="#412b22"/>
    ${sharedFloor}
  `);
}

function portrait(id, opts) {
  const { áo = "#0f4b55", skin = "#d69a73", hair = "#25201c", accent = "#d7ad5d", age = 40, role = "" } = opts;
  const wrinkles = age > 55 ? `<path d="M332 250h82M318 288h110" stroke="#8d5f4b" stroke-width="5" opacity=".42" stroke-linecap="round"/>` : "";
  const greyHair = age > 55 ? "#d7d1c2" : hair;
  const accessory = role === "monk"
    ? `<circle cx="365" cy="290" r="155" fill="#c98832"/><circle cx="365" cy="282" r="105" fill="${skin}"/>`
    : `<path d="M206 284c14-125 86-198 164-198s155 74 166 198c-82-44-184-48-330 0z" fill="${greyHair}"/>`;
  const collar = role === "banker"
    ? `<path d="M224 610h282l-72-108-68 82-70-82z" fill="#f8e9ca"/><path d="M338 586l28 108 28-108z" fill="${colors.red}"/>`
    : "";
  return svg(720, 920, `
    <rect width="720" height="920" fill="none"/>
    <ellipse cx="360" cy="780" rx="250" ry="82" fill="#001014" opacity=".25"/>
    <path d="M178 850c18-178 78-282 182-282s164 104 182 282z" fill="${áo}" filter="url(#softShadow)"/>
    <path d="M208 850c22-118 62-188 152-188s130 70 152 188z" fill="#0a1d21" opacity=".22"/>
    ${collar}
    ${accessory}
    <ellipse cx="360" cy="326" rx="126" ry="150" fill="${skin}"/>
    <path d="M252 318c42 18 88 18 132 0" stroke="#33241f" stroke-width="9" stroke-linecap="round" opacity=".9"/>
    <circle cx="312" cy="350" r="9" fill="#1e1715"/>
    <circle cx="410" cy="350" r="9" fill="#1e1715"/>
    <path d="M356 360c-8 36-6 54 22 60" stroke="#8d5f4b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M318 468c34 30 72 30 104 0" stroke="#6a332e" stroke-width="8" fill="none" stroke-linecap="round"/>
    ${wrinkles}
    <circle cx="238" cy="390" r="20" fill="${skin}"/>
    <circle cx="482" cy="390" r="20" fill="${skin}"/>
    <path d="M210 608c-28 50-52 118-66 206" stroke="${accent}" stroke-width="18" opacity=".8"/>
    <path d="M510 608c28 50 52 118 66 206" stroke="${accent}" stroke-width="18" opacity=".8"/>
  `);
}

function documentAsset(id, title, lines) {
  return svg(760, 1000, `
    <rect width="760" height="1000" rx="36" fill="url(#paper)" stroke="#9b7438" stroke-width="12"/>
    <text x="380" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#263234">${title}</text>
    <rect x="90" y="140" width="580" height="6" fill="#a43a32"/>
    ${lines.map((line, i) => `<text x="88" y="${220 + i * 74}" font-family="Arial, sans-serif" font-size="34" fill="#263234">${line}</text>`).join("")}
    <circle cx="586" cy="780" r="86" fill="none" stroke="#a43a32" stroke-width="10" opacity=".75"/>
    <text x="586" y="792" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#a43a32">CẦN XÁC MINH</text>
  `);
}

function wav({ frequency = 440, duration = 0.25, type = "sine", volume = 0.28 }) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.min(1, i / 600) * Math.max(0, 1 - i / samples);
    const base = type === "square" ? Math.sign(Math.sin(2 * Math.PI * frequency * t)) : Math.sin(2 * Math.PI * frequency * t);
    const overtone = Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.25;
    buffer.writeInt16LE(Math.round((base + overtone) * volume * envelope * 32767), 44 + i * 2);
  }
  return buffer;
}

await write("backgrounds/bank.svg", background("bank"));
await write("backgrounds/home.svg", background("home"));
await write("backgrounds/temple.svg", background("temple"));
await write("backgrounds/consult.svg", background("consult"));

await write("characters/player.svg", portrait("player", { áo: "#174f59", skin: "#d49a76", hair: "#1f1a17", role: "banker", age: 32 }));
await write("characters/son.svg", portrait("son", { áo: "#12404a", skin: "#c88660", hair: "#5a5751", role: "banker", age: 55 }));
await write("characters/ba_hanh.svg", portrait("ba_hanh", { áo: "#6b4035", skin: "#c68f70", hair: "#d8d0bd", age: 68 }));
await write("characters/anh_tam.svg", portrait("anh_tam", { áo: "#25415b", skin: "#c98664", hair: "#191512", age: 35 }));
await write("characters/me.svg", portrait("me", { áo: "#8a3d35", skin: "#ca9070", hair: "#cbc3b0", age: 66 }));
await write("characters/di_tu.svg", portrait("di_tu", { áo: "#7d4d6a", skin: "#c98d69", hair: "#cfc7b8", age: 60 }));
await write("characters/su_thay.svg", portrait("su_thay", { áo: "#c77d2d", skin: "#c88c66", hair: "#c77d2d", role: "monk", age: 60 }));

await write("documents/police-fake.svg", documentAsset("police", "LỆNH TẠM GIỮ?", ["Ảnh gửi qua Zalo", "TK nhận: cá nhân", "Hạn: trước 15:00", "Yêu cầu giữ bí mật"]));
await write("documents/invoice-real.svg", documentAsset("invoice", "HÓA ĐƠN NCC", ["MST khớp hồ sơ", "Lịch sử đều đặn", "Người nhận quen thuộc", "Không có dấu hiệu ép"]));
await write("documents/mom-chat.svg", documentAsset("mom-chat", "TIN NHẮN ‘THẦY’", ["Hỏi thăm sức khoẻ", "Nhắc chuyện gia đình", "Dặn không kể con", "Hẹn giờ chuyển tiền"]));
await write("documents/mom-receipts.svg", documentAsset("mom-receipts", "BIÊN NHẬN LỄ", ["30tr rồi 70tr", "Rút theo ngày đẹp", "Số tiền leo thang", "STK cá nhân"]));

await fs.mkdir(path.join(out, "audio"), { recursive: true });
await fs.writeFile(path.join(out, "audio/click.wav"), wav({ frequency: 620, duration: 0.09, type: "sine", volume: 0.2 }));
await fs.writeFile(path.join(out, "audio/reveal.wav"), wav({ frequency: 330, duration: 0.35, type: "sine", volume: 0.25 }));
await fs.writeFile(path.join(out, "audio/warning.wav"), wav({ frequency: 165, duration: 0.45, type: "square", volume: 0.18 }));
await fs.writeFile(path.join(out, "audio/soft-win.wav"), wav({ frequency: 520, duration: 0.5, type: "sine", volume: 0.24 }));

console.log(`Generated Vietnamese game art and audio in ${out}`);
