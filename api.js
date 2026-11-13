/* ตัวกลางเรียก Apps Script ผ่าน HTTP (ทำหน้าที่แทน google.script.run ของ Apps Script) */
(function () {
  function call(fn, args) {
    var url = window.API_URL;
    if (!url || url.indexOf('script.google.com') < 0) {
      return Promise.reject(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js (ต้องเป็นลิงก์ที่ลงท้าย /exec)'));
    }
    // ใช้ text/plain เพื่อเป็น "simple request" ไม่ต้องทำ preflight (Apps Script ไม่รองรับ OPTIONS)
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ fn: fn, args: args }), redirect: 'follow', credentials: 'omit' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var j;
        try { j = JSON.parse(t); } catch (e) { throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง ตรวจสอบลิงก์ API และการตั้งค่า "ผู้มีสิทธิ์เข้าถึง: ทุกคน"'); }
        if (!j.ok) throw new Error(j.error || 'เกิดข้อผิดพลาด');
        return j.data;
      });
  }
  function runner(ok, bad) {
    return new Proxy({}, { get: function (_, k) {
      if (k === 'withSuccessHandler') return function (f) { return runner(f, bad); };
      if (k === 'withFailureHandler') return function (f) { return runner(ok, f); };
      return function () {
        var args = Array.prototype.slice.call(arguments);
        call(String(k), args).then(function (d) { if (ok) ok(d); }, function (e) { if (bad) bad(e); else console.error(e); });
      };
    } });
  }
  window.google = { script: { run: runner(null, null) } };
})();
