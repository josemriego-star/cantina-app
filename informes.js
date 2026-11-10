/* Informes del administrador: réplica de las pestañas de "Ventas al día" (Comparativo, Clientes, Cobranzas, Empresas)
   y desplegables del Dashboard. Usa las funciones de admin.html (A, fm, gs, esc, show, hoyS, norm, hh, MN). */
(function () {
  const st = document.createElement('style');
  st.textContent = 'summary{cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}.sm{display:flex;justify-content:space-between;gap:8px;padding:12px 14px;align-items:center}.sm::before{content:"▸";color:#5F6F76;margin-right:6px}details[open]>.sm::before{content:"▾"}.sub{border-top:1px solid #DDEBDD;padding:8px 14px}.hm td,.hm th{white-space:nowrap}';
  document.head.appendChild(st);
})();
const VX = {};
const CONDN = { efectivo: 'Contado', credito: 'Crédito', pos_debito: 'POS Débito', pos_credito: 'POS Crédito', transferencia: 'Transferencia' };
const MESN = m => { const [y, o] = m.split('-').map(Number); return new Date(y, o - 1, 1).toLocaleDateString('es-PY', { month: 'long', year: 'numeric' }); };
const MESC = m => { const [y, o] = m.split('-').map(Number); return new Date(y, o - 1, 1).toLocaleDateString('es-PY', { month: 'short', year: '2-digit' }).replace('.', ''); };
const mesHoy = () => hoyS().slice(0, 7);
const mesMas = (m, n) => { const [y, o] = m.split('-').map(Number), d = new Date(y, o - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const mesFin = m => { const [y, o] = m.split('-').map(Number); return m + '-' + String(new Date(y, o, 0).getDate()).padStart(2, '0'); };
const fd2 = s => s.split('-').reverse().join('/');
const pct = (a, b) => b ? Math.min(100, a / b * 100) : 0;
const mnav = (m, fn, sig) => `<div class=bar style="justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px"><button class="bt s" onclick="${fn}(-1)">‹</button><b style="text-transform:capitalize">${MESN(m)}</b><button class="bt s" ${sig ? '' : 'disabled'} onclick="${fn}(1)">›</button></div>`;
const kpi = (n, v, c) => `<div class=cd><small>${n}</small><b${c ? ` style="color:${c}"` : ''}>${v}</b></div>`;
const barsSvg = (d, col) => {
  const W = 700, H = 170, pb = 22, n = d.length || 1, mx = Math.max(1, ...d.map(x => x.v)), bw = W / n, g = Math.min(6, bw * .2), st = Math.ceil(n / 16), al = H - pb - 6;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${d.map((x, i) => { const h = x.v / mx * al, X = (i * bw + g / 2).toFixed(1), w = Math.max(1, bw - g).toFixed(1);
    return `<g><title>${esc(x.t)}</title><rect x="${X}" y="${(H - pb - h).toFixed(1)}" width="${w}" height="${h.toFixed(1)}" fill="${col || '#1B5E3B'}"/>${i % st === 0 ? `<text x="${(+X + w / 2).toFixed(1)}" y="${H - 6}" font-size="11" text-anchor="middle" fill="#5F6F76">${esc(x.l)}</text>` : ''}</g>`; }).join('')}<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="#DDEBDD"/></svg>`;
};
function navTo(k) { if (k === 'cli') CLI.id = null; if (k === 'cob') COB.mk = null; show(k); }

/* ---------- Dashboard: detalle al tocar Contado / Crédito ---------- */
let DD = null;
const ddTog = t => { DD = DD === t ? null : t; show('dash'); };
async function ddHTML() {
  const r = await A(`/api/admin/ventas-detalle?desde=${DS.desde}&hasta=${DS.hasta}&tipo=${DD}`);
  const agr = (arr, fnEmp) => { const m = new Map(); for (const x of arr) { const e = fnEmp(x); if (!m.has(e)) m.set(e, []); m.get(e).push(x); } return [...m]; };
  const emp = x => x.empresa || (x.cliente ? '(sin empresa)' : 'Venta de mostrador');
  const vt = r.ventas.reduce((s, v) => s + v.total, 0), ct = r.cobros.reduce((s, p) => s + p.monto, 0);
  const gv = agr(r.ventas, emp).map(([e, l]) => `<details class=cd style="padding:0;margin:6px 0"><summary class=sm><b>${esc(e)}</b><span><small class=mut>${l.length} venta(s)</small> <b>${gs(l.reduce((s, v) => s + v.total, 0))}</b></span></summary>${l.map(v => `<div class=sub><div style="display:flex;justify-content:space-between;gap:8px"><span><b>${esc(v.cliente || 'Mostrador')}</b> <small class=mut>· ${hh(v.fecha)}${v.medio ? ' · ' + (MN[v.medio] || v.medio) : ''}</small></span><b>${gs(v.total)}</b></div><small class=mut>${v.lineas.map(l => `${l.cantidad}× ${esc(l.nombre)}`).join(', ')}</small></div>`).join('')}</details>`).join('') || '<p class=mut>Sin ventas en el período</p>';
  const gc = agr(r.cobros, emp).map(([e, l]) => `<details class=cd style="padding:0;margin:6px 0"><summary class=sm><b>${esc(e)}</b><span><small class=mut>${l.length} cobro(s)</small> <b>${gs(l.reduce((s, v) => s + v.monto, 0))}</b></span></summary>${l.map(p => `<div class=sub style="display:flex;justify-content:space-between;gap:8px"><span>${esc(p.cliente)} <small class=mut>· ${hh(p.fecha)} · ${MN[p.medio] || p.medio}</small></span><b>${gs(p.monto)}</b></div>`).join('')}</details>`).join('') || '<p class=mut>Sin cobros en el período</p>';
  return `<div class=cd style="border:2px solid var(--ok)"><b>Ventas ${DD === 'contado' ? 'al contado' : 'a crédito'}</b> · ${gs(vt)} <button class="bt s" style="float:right" onclick="ddTog('${DD}')">Cerrar</button>${gv}<div style="margin-top:12px"><b>Cobros de deudas</b> · ${gs(ct)}</div>${gc}</div>`;
}

/* ---------- Comparativo ---------- */
let CM = null;
function cmMes(n) { const x = mesMas(CM, n); if (x > mesHoy()) return; CM = x; show('cmp'); }
VX.cmp = async () => {
  if (!CM) CM = mesHoy();
  const h = hoyS(), fin = mesFin(CM) > h ? h : mesFin(CM);
  const d = await A(`/api/admin/dashboard?desde=${CM}-01&hasta=${fin}`);
  const dias = d.por_dia.filter(x => x.total > 0), total = dias.reduce((s, x) => s + x.total, 0);
  const best = dias.reduce((b, x) => (!b || x.total > b.total ? x : b), null), mx = Math.max(1, ...dias.map(x => x.total));
  const wd = f => new Date(f + 'T12:00:00').toLocaleDateString('es-PY', { weekday: 'short' }).replace('.', '');
  return `${mnav(CM, 'cmMes', mesMas(CM, 1) <= mesHoy())}<div class=kp>${kpi('Total del mes', gs(total))}${kpi('Promedio diario', gs(dias.length ? total / dias.length : 0))}${best ? kpi('Mejor día · ' + fd2(best.fecha), gs(best.total)) : ''}</div>
  <div class=cd><b>Evolución de ventas diarias</b>${barsSvg(dias.map(x => ({ v: x.total, l: String(+x.fecha.slice(8)), t: fd2(x.fecha) + ': ' + gs(x.total) })))}</div>
  <p class=mut>${dias.length} día(s) con ventas</p>
  ${dias.map((x, i) => { const p = i ? dias[i - 1].total : null, dl = p === null ? null : x.total - p, up = dl !== null && dl >= 0;
    return `<div class=it style="display:block"><div style="display:flex;justify-content:space-between"><b><span style="text-transform:capitalize">${wd(x.fecha)}</span> ${fd2(x.fecha)}</b><b>${gs(x.total)}</b></div><div style="background:#E8F0E8;border-radius:6px;height:6px;margin-top:6px"><div style="width:${Math.max(1, x.total / mx * 100)}%;background:#1B5E3B;height:6px;border-radius:6px"></div></div><small style="color:${dl === null ? '#5F6F76' : up ? '#1B5E3B' : '#C94F4F'}">${dl === null ? 'Primer día registrado' : `${up ? '▲' : '▼'} ${gs(Math.abs(dl))}${p ? ` (${dl >= 0 ? '+' : ''}${(dl / p * 100).toFixed(1)}%)` : ''} vs día anterior`}</small></div>`; }).join('') || '<p class=mut>Sin ventas en este mes</p>'}`;
};

/* ---------- Clientes y estado de cuenta ---------- */
let CLI = { id: null, modo: 'mes', mes: null, desde: '', hasta: '', ant: true, data: null, q: '' }, CLL = [];
const cliGrupos = () => {
  const t = norm(CLI.q).split(/\s+/).filter(Boolean), m = new Map();
  for (const c of CLL) { if (!(c.saldo > 0)) continue; if (!t.every(x => norm(c.nombre + ' ' + (c.empresa || '') + ' ' + (c.cedula || '')).includes(x))) continue;
    const e = c.empresa || '(sin empresa)'; if (!m.has(e)) m.set(e, []); m.get(e).push(c); }
  return [...m].map(([e, l]) => ({ e, l, t: l.reduce((s, c) => s + c.saldo, 0) })).sort((a, b) => b.t - a.t);
};
const cliListHTML = () => cliGrupos().map(x => `<details class=cd style="padding:0" ${CLI.q ? 'open' : ''}><summary class=sm><b>${esc(x.e)}</b><span><small class=mut>${x.l.length} cliente(s)</small> <b class=neg>${gs(x.t)}</b></span></summary>${x.l.map(c => `<div class=sub style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${esc(c.nombre)}<br><small class=mut>CI: ${esc(c.cedula || c.nombre)}</small></span><span><b class=neg>${gs(c.saldo)}</b> <button class="bt s" onclick="cliAbrir(${c.id})">Estado de cuenta</button></span></div>`).join('')}</details>`).join('') || '<p class=mut>Ningún cliente con saldo pendiente</p>';
const cliDraw = () => { const e = $('#cll'); if (e) e.innerHTML = cliListHTML(); };
function cliAbrir(id) { CLI.id = id; CLI.data = null; CLI.modo = 'mes'; CLI.mes = mesHoy(); CLI.ant = true; show('cli'); }
function cliSet(k, v) { CLI[k] = v; show('cli'); }
function cliMes(n) { const x = mesMas(CLI.mes, n); if (x > mesHoy()) return; CLI.mes = x; show('cli'); }
const cliRango = () => CLI.modo === 'todo' ? ['2000-01-01', hoyS()] : CLI.modo === 'rango' ? [CLI.desde || mesHoy() + '-01', CLI.hasta || hoyS()] : [CLI.mes + '-01', mesFin(CLI.mes)];
const cliEtiqueta = () => CLI.modo === 'todo' ? 'Todos los meses' : CLI.modo === 'rango' ? `${fd2(cliRango()[0])} al ${fd2(cliRango()[1])}` : MESN(CLI.mes);
function ecRows(d, ant) {
  let s = ant ? d.saldo_anterior : 0, compras = 0, pagos = 0; const rows = [];
  for (const m of d.movimientos) {
    const k = new Date(m.fecha).toLocaleDateString('en-CA');
    if (m.tipo === 'compra') { s += m.monto; compras += m.monto; const L = rows[rows.length - 1];
      if (L && L.t === 'c' && L.k === k) { L.monto += m.monto; L.lineas.push(...m.lineas); L.saldo = s; } else rows.push({ t: 'c', k, f: m.fecha, monto: m.monto, lineas: [...m.lineas], saldo: s }); }
    else { s -= m.monto; pagos += m.monto; rows.push({ t: 'p', k, f: m.fecha, monto: m.monto, lineas: [], saldo: s }); }
  }
  return { rows, compras, pagos, saldo: s };
}
function ecCard(d) {
  const r = ecRows(d, CLI.ant), c = d.cliente, ini = c.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const dm = f => { const x = new Date(f); return String(x.getDate()).padStart(2, '0') + '/' + String(x.getMonth() + 1).padStart(2, '0'); };
  return `<div id=ecp style="background:#fff;border:1px solid #ece7db;border-radius:14px;padding:14px;font-family:'Open Sans','Noto Sans',Arial,sans-serif;color:#2c2c2a">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:12px"><div><p style="margin:0;font-weight:600;font-size:16px">Estado de cuenta</p><p style="margin:0;font-size:13px;color:#7a756a">Ventas a crédito</p></div><div style="text-align:right"><p style="margin:0;font-size:13px;color:#7a756a;text-transform:capitalize">${esc(cliEtiqueta())}</p><p style="margin:0;font-size:12px;color:#9a9488">${new Date().toLocaleDateString('es-PY')}</p></div></div>
  <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #ece7db;border-bottom:1px solid #ece7db"><div style="width:40px;height:40px;border-radius:50%;background:#DFF5E1;color:#1B5E3B;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;flex-shrink:0">${esc(ini)}</div><div><p style="margin:0;font-weight:600;font-size:15px">${esc(c.nombre)}</p><p style="margin:0;font-size:12px;color:#7a756a">${esc([c.cedula && 'CI: ' + c.cedula, c.empresa].filter(Boolean).join(' · ') || 'Cliente a crédito')}</p>${CLI.ant ? `<p style="margin:0;font-size:12px;color:#7a756a">Saldo anterior ${fm(d.saldo_anterior)} Gs</p>` : ''}</div></div>
  <table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px;margin-top:8px"><colgroup><col style="width:13%"><col style="width:50%"><col style="width:18.5%"><col style="width:18.5%"></colgroup><thead><tr style="color:#7a756a;font-size:12px"><th style="text-align:left;font-weight:400;padding:6px 0;border:0">Fecha</th><th style="text-align:left;font-weight:400;border:0">Detalle (cant. × precio)</th><th style="text-align:right;font-weight:400;border:0">Monto</th><th style="text-align:right;font-weight:400;border:0">Saldo</th></tr></thead><tbody>
  ${r.rows.map(x => `<tr style="border-top:1px solid #ece7db"><td style="padding:8px 0;vertical-align:top;text-align:left;border:0">${dm(x.f)}</td><td style="vertical-align:top;text-align:left;border:0;color:${x.t === 'p' ? '#1B5E3B' : 'inherit'}">${x.t === 'p' ? '<div style="font-size:12px">Pago</div>' : x.lineas.map(l => `<div style="font-size:12px;line-height:1.45">${l.cantidad} ${esc(l.nombre)} × ${fm(l.precio_unit)}</div>`).join('')}</td><td style="text-align:right;vertical-align:top;border:0;color:${x.t === 'p' ? '#1B5E3B' : 'inherit'}">${x.t === 'p' ? '−' : ''}${fm(x.monto)}</td><td style="text-align:right;vertical-align:top;border:0">${fm(x.saldo)}</td></tr>`).join('') || '<tr><td colspan=4 style="text-align:center;color:#a8a292;padding:20px 0;border:0">Sin movimientos en este período</td></tr>'}</tbody></table>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><div style="background:#F1EFE8;border-radius:12px;padding:10px 12px"><p style="margin:0;font-size:12px;color:#7a756a">Compras</p><p style="margin:0;font-size:18px;font-weight:600">${fm(r.compras)}</p></div><div style="background:#F1EFE8;border-radius:12px;padding:10px 12px"><p style="margin:0;font-size:12px;color:#7a756a">Pagos</p><p style="margin:0;font-size:18px;font-weight:600;color:#1B5E3B">${fm(r.pagos)}</p></div></div>
  <div style="background:#FAECE7;border-radius:12px;padding:10px 12px;margin-top:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;color:#712B13">Saldo a pagar</span><span style="font-size:20px;font-weight:600;color:#712B13">${fm(r.saldo)} Gs</span></div>
  <p style="margin:12px 0 0;font-size:12px;color:#7a756a;line-height:1.45">Si algo no coincide avisa para realizar una verificación</p></div>`;
}
VX.cli = async () => {
  if (!CLI.id) {
    CLL = await A('/api/clientes');
    const tot = CLL.filter(c => c.saldo > 0);
    return `<div class=kp>${kpi('Total pendiente', gs(tot.reduce((s, c) => s + c.saldo, 0)), '#993C1D')}${kpi('Clientes con saldo', tot.length)}</div><input type=search placeholder="Buscar cliente, empresa o cédula" value="${esc(CLI.q)}" oninput="CLI.q=this.value;cliDraw()" style="width:100%"><div id=cll>${cliListHTML()}</div>`;
  }
  const [a, b] = cliRango();
  CLI.data = await A(`/api/clientes/${CLI.id}/estado-cuenta?desde=${a}&hasta=${b}`);
  return `<div class=bar><button class=bt onclick="CLI.id=null;show('cli')">← Volver</button><span style="flex:1"></span><button class="bt ok" onclick="cliPng()">Exportar imagen</button><button class="bt p" onclick="cliWA()">WhatsApp</button></div>
  <div class=bar>${[['mes', 'Por mes'], ['rango', 'Por rango de fechas'], ['todo', 'Todos']].map(([k, n]) => `<button class="bt s ${CLI.modo === k ? 'p' : ''}" onclick="cliSet('modo','${k}')">${n}</button>`).join('')}</div>
  ${CLI.modo === 'mes' ? mnav(CLI.mes, 'cliMes', mesMas(CLI.mes, 1) <= mesHoy()) : ''}
  ${CLI.modo === 'rango' ? `<div class=bar><label class=mut>Desde <input type=date value="${cliRango()[0]}" onchange="CLI.desde=this.value;show('cli')"></label><label class=mut>Hasta <input type=date value="${cliRango()[1]}" onchange="CLI.hasta=this.value;show('cli')"></label></div>` : ''}
  <label style="display:block;margin:0 0 10px"><input type=checkbox ${CLI.ant ? 'checked' : ''} onchange="cliSet('ant',this.checked)" style="width:auto;margin:0 8px 0 0">Mostrar saldo anterior</label>${ecCard(CLI.data)}`;
};
function cargarHTI() {
  if (window.htmlToImage) return Promise.resolve(window.htmlToImage);
  return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
    s.onload = () => ok(window.htmlToImage); s.onerror = () => ko(new Error('No se pudo cargar el generador de imagen. Revisá la conexión.')); document.head.appendChild(s); });
}
async function cliImagen() {
  const n = $('#ecp'); if (!n) return null;
  try { const h = await cargarHTI(); if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const r = n.getBoundingClientRect(), pr = Math.max(1, Math.min(2, 4000 / Math.max(r.width, r.height, 1)));
    return await h.toPng(n, { backgroundColor: '#ffffff', pixelRatio: pr, cacheBust: true }); }
  catch (e) { alert(e.message || 'No se pudo generar la imagen'); return null; }
}
function cliDescargar(u) { const a = document.createElement('a'); a.href = u; a.download = 'estado-de-cuenta-' + CLI.data.cliente.nombre.replace(/\s+/g, '-') + '.png'; a.click(); }
async function cliCompartir(u) {
  const c = CLI.data.cliente, f = new File([await (await fetch(u)).blob()], 'estado-de-cuenta.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Estado de cuenta' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  cliDescargar(u);
  let n = String(c.telefono || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '595' + n.slice(1);
  const t = `Estado de cuenta de ${c.nombre}. Saldo a pagar: ${fm(ecRows(CLI.data, CLI.ant).saldo)} Gs`;
  alert('Se descargó la imagen. Adjuntala en el WhatsApp que se abre.');
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(t)}`, '_blank');
}
async function cliWA() { const u = await cliImagen(); if (u) cliCompartir(u); }
async function cliPng() {
  const u = await cliImagen(); if (!u) return;
  const d = document.createElement('div'); d.className = 'dlg';
  d.innerHTML = `<div class=bx style="max-height:92vh;overflow:auto"><h3>Estado de cuenta</h3><img src="${u}" style="width:100%;border:1px solid #DDEBDD;border-radius:10px;margin-bottom:14px"><div class=bs><button class=c>Cerrar</button><button class=d>Descargar</button><button class=p>WhatsApp</button></div></div>`;
  d.querySelector('.c').onclick = () => d.remove();
  d.querySelector('.d').onclick = () => cliDescargar(u);
  d.querySelector('.p').onclick = () => cliCompartir(u);
  document.body.appendChild(d);
}

/* ---------- Cobranzas ---------- */
let COBD = null, COB = { yr: 'TODOS', mk: null };
function cobSet(k, v) { COB[k] = v; show('cob'); }
VX.cob = async () => { COBD = await A('/api/admin/cobranzas'); return COB.mk ? cobDet() : cobLista(); };
function cobLista() {
  const yrs = [...new Set(COBD.meses.map(x => x.mes.slice(0, 4)))].sort();
  const L = COBD.meses.filter(x => (COB.yr === 'TODOS' || x.mes.startsWith(COB.yr)) && (x.vendido > 0 || x.caja > 0));
  const t = L.reduce((a, x) => ({ v: a.v + x.vendido, c: a.c + x.cobrado, p: a.p + x.pendiente, j: a.j + x.caja }), { v: 0, c: 0, p: 0, j: 0 });
  const cv = L.filter(x => x.vendido > 0), avg = cv.length ? cv.reduce((s, x) => s + pct(x.cobrado, x.vendido), 0) / cv.length : 0;
  return `<div class=bar>${['TODOS', ...yrs].map(y => `<button class="bt s ${COB.yr === y ? 'p' : ''}" onclick="cobSet('yr','${y}')">${y === 'TODOS' ? 'Todos' : y}</button>`).join('')}</div>
  <div class=kp>${kpi('Vendido a crédito', gs(t.v))}${kpi('Cobrado', gs(t.c), '#1B5E3B')}${kpi('Pendiente', gs(t.p), '#993C1D')}${kpi('Cobrado en caja', gs(t.j))}
  <div class=cd style="background:#DFF5E1"><small style="color:#1B5E3B">% cobro efectivo</small><b style="font-size:24px;color:#1B5E3B">${pct(t.c, t.v).toFixed(1)}%</b><small style="color:#1B5E3B">Promedio mensual ${avg.toFixed(1)}%</small></div>
  <div class=cd style="background:#FAECE7"><small style="color:#712B13">% no cobrado</small><b style="font-size:24px;color:#712B13">${pct(t.p, t.v).toFixed(1)}%</b><small style="color:#712B13">Pasa a meses siguientes</small></div></div>
  <p class=mut><small>Cada mes agrupa las ventas a crédito hechas en ese mes: cuánto se cobró de ellas y cuánto sigue pendiente. Los pagos de cada cliente se aplican primero a sus deudas más antiguas. "Caja del mes" es lo que entró ese mes, aunque sea de ventas anteriores. Tocá un mes para ver día por día.</small></p>
  ${L.slice().reverse().map(m => `<div class=it style="display:block;cursor:pointer" onclick="cobSet('mk','${m.mes}')"><div style="display:flex;justify-content:space-between"><b style="text-transform:capitalize">${MESN(m.mes)} ›</b><b>${gs(m.vendido)}</b></div><div style="display:flex;height:10px;border-radius:6px;overflow:hidden;background:#F1EFE8;margin-top:8px"><div style="width:${pct(m.cobrado, m.vendido)}%;background:#43A047"></div><div style="width:${pct(m.pendiente, m.vendido)}%;background:#C94F4F"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px"><div><small class=mut>Cobrado · ${m.vendido ? pct(m.cobrado, m.vendido).toFixed(1) + '%' : '—'}</small><br><b class=pos>${gs(m.cobrado)}</b></div><div style="text-align:right"><small class=mut>Pendiente · ${m.vendido ? pct(m.pendiente, m.vendido).toFixed(1) + '%' : '—'}</small><br><b class=neg>${gs(m.pendiente)}</b></div></div><small class=mut>Caja del mes: ${gs(m.caja)} · Pendiente acumulado: ${gs(m.acum)}</small></div>`).join('') || '<p class=mut>Sin ventas a crédito en este período</p>'}`;
}
function cobDet() {
  const mk = COB.mk, [y, o] = mk.split('-').map(Number), full = new Date(y, o, 0).getDate(), dd = COBD.dias[mk] || {}, h = hoyS();
  const n = mk === h.slice(0, 7) ? Math.min(full, +h.slice(8)) : full, days = [];
  for (let d = 1; d <= n; d++) days.push({ d, v: dd[d] || 0 });
  const tot = days.reduce((s, x) => s + x.v, 0), con = days.filter(x => x.v > 0), best = con.reduce((b, x) => (!b || x.v > b.v ? x : b), null);
  const tr = (a, b) => { const s = days.filter(x => x.d >= a && x.d <= b).reduce((z, x) => z + x.v, 0); return { l: `Día ${a} al ${Math.min(b, n)}`, v: s, p: tot ? s / tot * 100 : 0 }; };
  const tramos = [tr(1, 10), tr(11, 20), ...(n > 20 ? [tr(21, 31)] : [])], pend = COBD.pendiente[mk] || [], pt = pend.reduce((s, g) => s + g.total, 0);
  return `<div class=bar><button class=bt onclick="cobSet('mk',null)">← Volver</button><b style="text-transform:capitalize">${MESN(mk)}</b></div>
  <div class=kp>${kpi('Cobrado en el mes', gs(tot), '#1B5E3B')}${kpi('Promedio por día con cobro', gs(con.length ? tot / con.length : 0))}${kpi('Días con cobros', con.length)}${kpi('Días sin cobros', days.length - con.length, '#993C1D')}</div>
  ${best ? `<div class=cd style="background:#DFF5E1"><small>Día de mayor cobro · ${fd2(mk + '-' + String(best.d).padStart(2, '0'))}</small><b style="color:#1B5E3B">${gs(best.v)}</b></div>` : ''}
  <div class=cd><b>Evolución de cobros por día</b>${barsSvg(days.map(x => ({ v: x.v, l: String(x.d), t: `${x.d}/${o}: ${gs(x.v)}` })), '#43A047')}</div>
  <div class=cd><b>¿En qué parte del mes se cobra?</b>${tramos.map(t => dbar(t.l, t.v, tot, t.p.toFixed(1) + '%')).join('')}</div>
  <h2>Pendiente de cobro por empresa · ventas de ${MESN(mk)}</h2><div class=cd style="background:#FAECE7"><small style="color:#712B13">Total pendiente del mes</small><b style="color:#712B13">${gs(pt)}</b></div>
  ${pend.map(g => `<details class=cd style="padding:0"><summary class=sm><b>${esc(g.empresa)}</b><span><small class=mut>${g.clientes.length} cliente(s)</small> <b class=neg>${gs(g.total)}</b></span></summary>${g.clientes.map(c => `<div class=sub style="display:flex;justify-content:space-between;gap:8px"><span>${esc(c.nombre)}<br><small class=mut>${c.ventas} venta(s) pendiente(s)</small></span><b class=neg>${gs(c.saldo)}</b></div>`).join('')}</details>`).join('') || '<p class=mut>Sin saldo pendiente en las ventas a crédito de este mes</p>'}`;
}

/* ---------- Empresas por mes ---------- */
let EMPD = null, EMP = { yr: 'TODOS', cond: 'TODAS', q: '', cero: false };
const empSet = (k, v) => { EMP[k] = v; empDraw(); };
VX.emp = async () => { EMPD = (await A('/api/admin/empresas')).filas; return `<input type=search placeholder="Buscar empresa" value="${esc(EMP.q)}" oninput="EMP.q=this.value;empDraw()" style="width:100%"><div id=empx>${empHTML()}</div>`; };
const empDraw = () => { const e = $('#empx'); if (e) e.innerHTML = empHTML(); };
function empHTML() {
  const yrs = [...new Set(EMPD.map(x => x.mes.slice(0, 4)))].sort(), q = norm(EMP.q);
  const F = EMPD.filter(x => (EMP.yr === 'TODOS' || x.mes.startsWith(EMP.yr)) && (EMP.cond === 'TODAS' || x.cond === EMP.cond) && norm(x.empresa).includes(q));
  const meses = [...new Set(EMPD.filter(x => EMP.yr === 'TODOS' || x.mes.startsWith(EMP.yr)).map(x => x.mes))].sort(), cel = {}, tot = {};
  for (const x of F) { cel[x.empresa + '|' + x.mes] = (cel[x.empresa + '|' + x.mes] || 0) + x.monto; tot[x.empresa] = (tot[x.empresa] || 0) + x.monto; }
  const lista = Object.entries(tot).sort((a, b) => b[1] - a[1]), grand = lista.reduce((s, [, v]) => s + v, 0), mxc = Math.max(1, ...Object.values(cel));
  const chip = (k, v, n, cur) => `<button class="bt s ${cur === v ? 'p' : ''}" onclick="empSet('${k}','${v}')">${n}</button>`;
  return `<div class=bar style="margin-top:8px">${chip('yr', 'TODOS', 'Todos los años', EMP.yr)}${yrs.map(y => chip('yr', y, y, EMP.yr)).join('')}</div>
  <div class=bar>${chip('cond', 'TODAS', 'Todas las condiciones', EMP.cond)}${Object.entries(CONDN).map(([k, n]) => chip('cond', k, n, EMP.cond)).join('')}</div>
  <div class=kp>${kpi('Total del período', gs(grand))}${kpi('Empresas', lista.length)}</div>
  <p class=mut><small>Ventas por empresa y mes · montos en Gs. (más oscuro = más ventas). Las ventas sin cliente figuran como "(sin empresa)".</small></p>
  <div class=cd style="padding:0"><table class=hm style="width:max-content;min-width:100%"><thead><tr><th style="position:sticky;left:0;background:#F4F9F4">Empresa</th>${meses.map(m => `<th class=n>${MESC(m)}</th>`).join('')}<th class=n>Total</th><th class=n>%</th></tr></thead><tbody>
  ${lista.map(([e, t]) => `<tr><td style="position:sticky;left:0;background:#fff;white-space:normal;min-width:120px;max-width:160px;font-weight:600">${esc(e)}</td>${meses.map(m => { const v = cel[e + '|' + m] || 0; return `<td class=n style="background:${v ? `rgba(27,94,59,${(0.06 + 0.35 * v / mxc).toFixed(3)})` : 'transparent'};color:${v ? '#37474F' : '#c9c4b6'}">${v ? fm(v) : '–'}</td>`; }).join('')}<td class=n><b>${fm(t)}</b></td><td class=n style="color:#5F6F76">${grand ? (t / grand * 100).toFixed(1) : 0}%</td></tr>`).join('') || `<tr><td colspan=${meses.length + 3} class=mut>Ninguna empresa con compras con estos filtros</td></tr>`}
  <tr style="background:#DFF5E1"><td style="position:sticky;left:0;background:#DFF5E1"><b>Total</b></td>${meses.map(m => `<td class=n><b>${fm(lista.reduce((s, [e]) => s + (cel[e + '|' + m] || 0), 0))}</b></td>`).join('')}<td class=n><b>${fm(grand)}</b></td><td class=n>100%</td></tr></tbody></table></div>`;
}
