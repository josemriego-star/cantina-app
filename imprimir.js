/* Impresión de comanda, ticket y estado de cuenta. La usan la app de la empleada y el administrador.
   Funciona con cualquier impresora que el aparato ya tenga instalada (papel de 58 u 80 mm, o A4 para el estado de cuenta). */
window.PRT = (function () {
  const n = v => String(Math.round(v || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const gs = v => 'Gs. ' + n(v);
  const e = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fh = d => new Date(d).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fd = d => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fdc = s => String(s).split('-').reverse().join('/');
  const MEDIO = { efectivo: 'Efectivo', pos_debito: 'POS Débito', pos_credito: 'POS Crédito', transferencia: 'Transferencia' };
  const PIE_EC = 'Cada movimiento fue confirmado por el cliente con PIN o firma. Si algo no coincide avisa para realizar una verificación.';
  const ln = '<div class=p-ln></div>';
  const nomEmp = cfg => (cfg && cfg.empresa && cfg.empresa.nombre) || '';

  /* v = { id, fecha, empleada, cliente, tipo, lineas:[{cant, nombre, precio, cat, det}] } */
  function comanda(cfg, v) {
    const c = cfg.comanda || {};
    const ls = (v.lineas || []).filter(l => !l.cat || (c.categorias || []).includes(l.cat));
    if (!ls.length) return '';
    return `<div class="p-c p-b p-big">${e(c.titulo || 'COMANDA')}</div>${c.mostrar_numero !== false ? `<div class="p-c p-b">N° ${e(v.id)}</div>` : ''}`
      + (c.mostrar_hora !== false ? `<div class=p-c>${fh(v.fecha)}</div>` : '')
      + (c.mostrar_empleada !== false && v.empleada ? `<div class=p-c>Atendió: ${e(v.empleada)}</div>` : '')
      + (c.mostrar_cliente !== false && v.cliente ? `<div class=p-c>Cliente: ${e(v.cliente)}</div>` : '')
      + ln + ls.map(l => `<div class="p-b p-big">${e(l.cant)} x ${e(l.nombre)}</div>${l.det ? `<div class=p-ind>${e(l.det)}</div>` : ''}`).join('')
      + ln + (c.pie ? `<div class=p-c>${e(c.pie)}</div>` : '');
  }

  /* v además lleva: total, medio, comprobante */
  function ticket(cfg, v) {
    const t = cfg.ticket || {}, total = v.total != null ? v.total : (v.lineas || []).reduce((s, l) => s + l.cant * l.precio, 0);
    return `<div class="p-c p-b p-big">${e(nomEmp(cfg) || t.negocio || 'Mercator')}</div>`
      + (t.ruc ? `<div class=p-c>RUC: ${e(t.ruc)}</div>` : '') + (t.direccion ? `<div class=p-c>${e(t.direccion)}</div>` : '')
      + (t.telefono ? `<div class=p-c>Tel: ${e(t.telefono)}</div>` : '')
      + ln + `<div class=p-r><span>N° ${e(v.id)}</span><span>${fh(v.fecha)}</span></div>`
      + (t.mostrar_empleada !== false && v.empleada ? `<div>Atendió: ${e(v.empleada)}</div>` : '')
      + (v.cliente ? `<div>Cliente: ${e(v.cliente)}</div>` : '') + ln
      + (v.lineas || []).map(l => `<div class=p-r><span>${e(l.cant)} x ${e(l.nombre)}</span><span>${gs(l.cant * l.precio)}</span></div>`
        + `<div class=p-ind>${gs(l.precio)} c/u</div>` + (t.mostrar_detalle_combo !== false && l.det ? `<div class=p-ind>${e(l.det)}</div>` : '')).join('')
      + ln + `<div class="p-r p-b p-big"><span>TOTAL</span><span>${gs(total)}</span></div>`
      + `<div>${v.tipo === 'credito' ? 'A crédito' : 'Pago: ' + e(MEDIO[v.medio] || 'Efectivo')}</div>`
      + (v.comprobante ? `<div>Boleta POS: ${e(v.comprobante)}</div>` : '')
      + ln + (t.mensaje ? `<div class=p-c>${e(t.mensaje)}</div>` : '') + (t.leyenda ? `<div class="p-c p-ind">${e(t.leyenda)}</div>` : '');
  }

  /* ec = respuesta de /api/clientes/{id}/estado-cuenta */
  const ECSS = `.ecw{font:13px/1.4 'Open Sans','Noto Sans',Arial,sans-serif;color:#222}.ecw h2{margin:0 0 2px;font-size:20px;color:#1B5E3B}.ecw .sub{color:#555;margin-bottom:10px}
.ecw table{width:100%;border-collapse:collapse;margin:8px 0}.ecw th{background:#DFF5E1;color:#1B5E3B;text-align:left;padding:6px;font-size:12px}.ecw td{padding:6px;border-bottom:1px solid #ddd;vertical-align:top}
.ecw .n{text-align:right;white-space:nowrap}.ecw .edet{color:#555;font-size:12px}.ecw .tot td{font-weight:700;border-top:2px solid #1B5E3B;border-bottom:0}.ecw .pie{margin-top:12px;font-size:12px;color:#444}`;
  function estadoCuenta(cfg, ec) {
    const c = ec.cliente, neg = nomEmp(cfg) || (cfg.ticket && cfg.ticket.negocio) || 'Mercator', lg = cfg.empresa && cfg.empresa.logo;
    const filas = ec.movimientos.map(m => {
      const compra = m.tipo === 'compra';
      const det = compra ? m.lineas.map(l => `${l.cantidad} × ${e(l.nombre)} × ${gs(l.precio_unit)}`).join('<br>') : 'Pago recibido';
      return `<tr><td>${fd(m.fecha)}</td><td>${compra ? 'Compra a crédito' : 'Pago'}<div class=edet>${det}</div></td><td class=n>${compra ? gs(m.monto) : ''}</td><td class=n>${compra ? '' : gs(m.monto)}</td><td class=n>${gs(m.saldo)}</td></tr>`;
    }).join('');
    return `<div class=ecw>${lg ? `<img src="${lg}" style="height:50px;margin-bottom:6px"><br>` : ''}<h2>${e(neg)} · Estado de cuenta</h2><div class=sub>${e(c.nombre)}${c.empresa ? ' · ' + e(c.empresa) : ''}<br>Cédula: ${e(c.cedula || c.nombre)}${c.telefono ? ' · Tel: ' + e(c.telefono) : ''}<br>Período: ${fdc(ec.desde)} al ${fdc(ec.hasta)}</div>`
      + `<table><tr><th>Fecha</th><th>Detalle</th><th class=n>Compras</th><th class=n>Pagos</th><th class=n>Saldo</th></tr>`
      + `<tr><td colspan=4><i>Saldo anterior</i></td><td class=n>${gs(ec.saldo_anterior)}</td></tr>${filas || '<tr><td colspan=5><i>Sin movimientos en el período</i></td></tr>'}`
      + `<tr class=tot><td colspan=2>Totales del período</td><td class=n>${gs(ec.total_compras)}</td><td class=n>${gs(ec.total_pagos)}</td><td class=n>${gs(ec.saldo_final)}</td></tr></table>`
      + `<div class=pie>${PIE_EC}</div></div>`;
  }
  function estadoTexto(cfg, ec) {
    const c = ec.cliente, neg = nomEmp(cfg) || (cfg.ticket && cfg.ticket.negocio) || 'Mercator';
    const mv = ec.movimientos.map(m => m.tipo === 'compra'
      ? `${fd(m.fecha)} · Compra ${gs(m.monto)}\n` + m.lineas.map(l => `   ${l.cantidad} × ${l.nombre} × ${gs(l.precio_unit)}`).join('\n')
      : `${fd(m.fecha)} · Pago ${gs(m.monto)}`).join('\n');
    return `*${neg} · Estado de cuenta*\nCliente: ${c.nombre}${c.empresa ? ' (' + c.empresa + ')' : ''}\nPeríodo: ${fdc(ec.desde)} al ${fdc(ec.hasta)}\nSaldo anterior: ${gs(ec.saldo_anterior)}\n`
      + (mv ? '\n' + mv + '\n' : '\nSin movimientos en el período\n')
      + `\nCompras: ${gs(ec.total_compras)} · Pagos: ${gs(ec.total_pagos)}\n*Saldo final: ${gs(ec.saldo_final)}*\n\n${PIE_EC}`;
  }

  const rules = sc => `${sc} .p-c{text-align:center}${sc} .p-b{font-weight:700}${sc} .p-big{font-size:1.2em}${sc} .p-ln{border-top:1px dashed #000;margin:5px 0}${sc} .p-r{display:flex;justify-content:space-between;gap:6px}${sc} .p-ind{padding-left:1.2em;font-size:.9em}`;
  /* partes: lista de HTML; ancho: 58 | 80 | 'a4'. Todo va en un solo trabajo de impresión (una hoja por parte). */
  function imprimir(partes, ancho) {
    partes = partes.filter(Boolean);
    if (!partes.length) return false;
    const a4 = ancho === 'a4';
    let st = document.getElementById('prt-css');
    if (!st) { st = document.createElement('style'); st.id = 'prt-css'; document.head.appendChild(st); }
    st.textContent = `#prt{display:none}@media print{@page{size:${a4 ? 'A4' : ancho + 'mm auto'};margin:${a4 ? '15mm' : '0'}}html,body{background:#fff!important;margin:0!important}body>*:not(#prt){display:none!important}`
      + `#prt{display:block;${a4 ? '' : `width:${ancho - 6}mm;margin:0 auto;padding:2mm 0;font:${ancho >= 80 ? 14 : 12}px/1.3 'Courier New',monospace;`}color:#000}`
      + `#prt .p-pg{page-break-after:always}#prt .p-pg:last-child{page-break-after:auto}${rules('#prt')}${ECSS}}`;
    let d = document.getElementById('prt');
    if (!d) { d = document.createElement('div'); d.id = 'prt'; document.body.appendChild(d); }
    d.innerHTML = partes.map(h => `<div class=p-pg>${h}</div>`).join('');
    setTimeout(() => window.print(), 60);
    return true;
  }

  /* arma las hojas de una venta según la configuración (comanda primero, después el ticket) */
  function venta(cfg, v) {
    const p = [];
    if (cfg.comanda && cfg.comanda.imprimir) for (let i = 0; i < (cfg.comanda.copias || 1); i++) p.push(comanda(cfg, v));
    if (cfg.ticket && cfg.ticket.imprimir) for (let i = 0; i < (cfg.ticket.copias || 1); i++) p.push(ticket(cfg, v));
    return p;
  }
  const muestra = () => ({
    id: 123, fecha: Date.now(), empleada: 'Ana', cliente: 'Cliente de ejemplo', tipo: 'contado', medio: 'efectivo',
    lineas: [{ cant: 2, nombre: 'Café con leche', precio: 5000, cat: 'Cafés', det: '' },
      { cant: 1, nombre: 'Almuerzo', precio: 25000, cat: 'Comidas', det: 'Milanesa de pollo + Arroz c/queso' },
      { cant: 1, nombre: 'Gaseosa', precio: 6000, cat: 'Bebidas', det: '' }]
  });
  return { comanda, ticket, estadoCuenta, estadoTexto, imprimir, venta, muestra, ECSS, gs, pcss: rules };
})();
