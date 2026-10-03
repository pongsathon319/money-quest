/* Service worker: เก็บไฟล์แอปไว้ในเครื่อง เปิดได้ทันทีแม้เน็ตช้า/ออฟไลน์
   เมื่อแก้ไฟล์แอป ให้เปลี่ยนเลขเวอร์ชันด้านล่าง (เช่น v2 → v3) เพื่อให้ iPhone โหลดของใหม่ */
const VERSION = 'mq-v4';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './img/state1.webp', './img/state2.webp', './img/state3.webp', './img/state4.webp', './img/state5.webp',
  './icons/icon-192.png', './icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // ไม่แคชการเรียก API (Apps Script) และคำขอที่ไม่ใช่ GET
  if (req.method !== 'GET' || /script\.google(usercontent)?\.com$/.test(url.hostname)) return;
  // ตอบจากแคชทันที แล้วอัปเดตแคชเบื้องหลัง (stale-while-revalidate)
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
