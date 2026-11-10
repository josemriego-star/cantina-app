/* Mensajes de la app (reemplazan los cuadros del navegador): mismo formato visual que Mercator. */
(function () {
  const st = document.createElement('style');
  st.textContent = `.dlg{position:fixed;inset:0;background:rgba(20,40,30,.45);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
.dlg .bx{background:#fff;border-radius:18px;padding:20px;width:100%;max-width:420px;box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:'Open Sans','Noto Sans',-apple-system,'Segoe UI',sans-serif;color:#37474F}
.dlg h3{margin:0 0 8px;font-size:19px;font-weight:700;color:#1B5E3B}.dlg p{margin:0 0 14px;font-size:16px;line-height:1.4;white-space:pre-line}
.dlg input{display:block;width:100%;min-height:48px;border-radius:12px;border:1px solid #DDEBDD;font:inherit;font-size:17px;padding:0 12px;margin:0 0 14px;box-sizing:border-box}
.dlg input:focus{outline:2px solid #1B5E3B}.dlg .bs{display:flex;gap:10px;justify-content:flex-end}
.dlg button{min-height:46px;padding:0 20px;border-radius:12px;font:inherit;font-weight:600;font-size:16px;cursor:pointer;border:1.5px solid #1B5E3B;background:#fff;color:#1B5E3B}
.dlg button.p{background:#1B5E3B;color:#fff}`;
  document.head.appendChild(st);
  function dlg(msg, o) {
    return new Promise(res => {
      const d = document.createElement('div');
      d.className = 'dlg';
      d.innerHTML = '<div class=bx><h3>Mercator</h3><p></p>' + (o.input ? '<input type=text autocomplete=off>' : '') +
        '<div class=bs>' + (o.cancel ? '<button class=c></button>' : '') + '<button class=p></button></div></div>';
      d.querySelector('p').textContent = msg;
      d.querySelector('.p').textContent = o.ok || 'Aceptar';
      const inp = d.querySelector('input'), c = d.querySelector('.c');
      if (inp) inp.value = o.def == null ? '' : o.def;
      if (c) c.textContent = o.cancel;
      const fin = v => { d.remove(); res(v); };
      const aceptar = () => fin(o.input ? inp.value : true);
      const cancelar = () => fin(o.input ? null : o.cancel ? false : undefined);
      d.querySelector('.p').onclick = aceptar;
      if (c) c.onclick = cancelar;
      d.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); aceptar(); } else if (e.key === 'Escape') cancelar(); });
      document.body.appendChild(d);
      (inp || d.querySelector('.p')).focus();
      if (inp) inp.select();
    });
  }
  window.alert = m => { dlg(String(m), {}); };                        // aviso (no frena el código)
  window.confirmarSN = m => dlg(String(m), { cancel: 'Cancelar' });  // await confirmarSN('...') -> true / false
  window.preguntar = (m, def) => dlg(String(m), { input: true, def, cancel: 'Cancelar' }); // -> texto o null
})();
