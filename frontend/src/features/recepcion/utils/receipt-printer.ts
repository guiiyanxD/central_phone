export function printPermutaReceipt(nota: any) {
  if (!nota) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const fechaObj = nota.fechaIngreso ? new Date(nota.fechaIngreso) : new Date();
  const fechaStr = fechaObj.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteNombre = `${nota.proveedor?.nombre || 'Cliente Particular'}${
    nota.proveedor?.apellido ? ` ${nota.proveedor.apellido}` : ''
  }`;
  const clienteTelefono = nota.proveedor?.telefono || 'Sin teléfono';
  const sucursalNombre = nota.sucursal?.nombre || 'CentralPhone';

  const dispositivos = Array.isArray(nota.dispositivos) ? nota.dispositivos : [];
  const totalEquipos = dispositivos.length;
  const totalCostoBs = Number(nota.totalCostoBs || 0);

  const equiposHtml = dispositivos
    .map((disp: any, index: number) => {
      const modeloNombre = disp.variante?.modelo?.nombreModelo || 'iPhone';
      const capGb = disp.variante?.capacidadGb || 0;
      const capStr = capGb >= 1024 ? `${capGb / 1024}TB` : capGb > 0 ? `${capGb}GB` : '';
      const colorStr = disp.variante?.color || '';
      const simStr = disp.variante?.tipoSim ? ` (${disp.variante.tipoSim})` : '';

      return `
        <div style="border-bottom:1px dashed #bbb;padding:6px 0;margin-bottom:4px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11px;">
            <span>${index + 1}. ${modeloNombre} ${colorStr} ${capStr}${simStr}</span>
            <span>Bs ${Number(disp.costoBs || 0).toFixed(2)}</span>
          </div>
          <div style="font-size:9px;color:#333;margin-top:2px;line-height:1.3;">
            <div><strong>IMEI 1:</strong> ${disp.imei1 || 'N/A'}</div>
            ${disp.imei2 ? `<div><strong>IMEI 2:</strong> ${disp.imei2}</div>` : ''}
            <div><strong>N° Serie:</strong> ${disp.numeroSerie || 'N/A'} | <strong>Batería:</strong> ${disp.porcentajeBateria || 0}%</div>
            ${disp.detallesFisicos ? `<div><strong>Detalles/Reg:</strong> ${disp.detallesFisicos}</div>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante de Recepción - Permuta #${nota.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 2mm auto;
            padding: 0;
            font-size: 10px;
            color: #000;
            line-height: 1.25;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px dashed #000; margin: 6px 0; }
        </style>
      </head>
      <body>
        <div class="text-center" style="margin-bottom:6px;">
          <div style="font-size:14px;" class="bold">CENTRALPHONE</div>
          <div style="font-size:9px;">Especialistas en Apple</div>
          <div class="bold" style="font-size:11px;margin-top:4px;">COMPROBANTE DE RECEPCIÓN / PERMUTA</div>
          <div style="font-size:9px;">Nota N°: #ING-${nota.id}</div>
          ${nota.numeroComprobante ? `<div style="font-size:9px;">Recibo Cliente: ${nota.numeroComprobante}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div>
          <div><strong>Fecha/Hora:</strong> ${fechaStr}</div>
          <div><strong>Sucursal:</strong> ${sucursalNombre}</div>
          <div><strong>Cliente / Part.:</strong> ${clienteNombre}</div>
          <div><strong>Teléfono:</strong> ${clienteTelefono}</div>
          ${nota.observaciones ? `<div><strong>Observaciones:</strong> ${nota.observaciones}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="bold" style="font-size:10px;margin-bottom:4px;">EQUIPOS RECIBIDOS (${totalEquipos}):</div>
        ${equiposHtml}

        <div class="double-divider"></div>

        <div style="font-size:12px;font-weight:bold;display:flex;justify-content:space-between;margin:4px 0;">
          <span>TOTAL COMPRA/TOMA:</span>
          <span>Bs ${totalCostoBs.toFixed(2)}</span>
        </div>

        <div class="divider"></div>

        <div style="font-size:8px;text-align:justify;color:#333;margin:6px 0;line-height:1.2;">
          El cliente declara bajo juramento que los equipos descritos son de su legítima propiedad, adquiridos lícitamente y entregados libres de gravámenes, cuentas iCloud, reportes por extravío o bloqueos por operador.
        </div>

        <div style="margin-top:22px;display:flex;justify-content:space-between;text-align:center;font-size:9px;">
          <div style="width:45%;">
            <div style="border-top:1px solid #000;padding-top:2px;">Firma del Cliente</div>
            <div style="font-size:8px;color:#555;">C.I.: ______________</div>
          </div>
          <div style="width:45%;">
            <div style="border-top:1px solid #000;padding-top:2px;">Receptor CentralPhone</div>
            <div style="font-size:8px;color:#555;">Sello / Conforme</div>
          </div>
        </div>

        <div class="text-center" style="font-size:8px;color:#777;margin-top:14px;">
          *** Documento Interno de Custodia y Recepción ***
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
}
