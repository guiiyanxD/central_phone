export function printReceipt(completedSale: any) {
  if (!completedSale) return;

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

  const fechaHora = new Date(completedSale.fechaHora).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml =
    completedSale.detalles
      ?.map((det: any) => {
        const nombreItem =
          det.tipoItem === 'DISPOSITIVO'
            ? `${det.dispositivo?.variante?.modelo?.nombreModelo || 'iPhone'} (${det.dispositivo?.variante?.color || ''} ${det.dispositivo?.variante?.capacidadGb ? det.dispositivo.variante.capacidadGb + 'GB' : ''})`
            : `${det.loteAccesorio?.accesorio?.nombre || 'Accesorio'} [${det.loteAccesorio?.nombreDiferenciador || ''}]`;

        const imeiHtml = det.dispositivo
          ? `<div style="font-size:9px;color:#222;margin-top:1px;">${det.dispositivo.imei1 ? 'IMEI 1: ' + det.dispositivo.imei1 + (det.dispositivo.imei2 ? '<br>IMEI 2: ' + det.dispositivo.imei2 : '') + '<br>' : ''}SERIE: ${det.dispositivo.numeroSerie}</div>`
          : '';

        const cantHtml =
          det.cantidad > 1
            ? `<div style="font-size:9px;color:#444;">${det.cantidad} unid. x Bs ${Number(det.precioUnitarioBs).toFixed(2)}</div>`
            : '';

        return `
          <tr>
            <td style="padding:4px 0;vertical-align:top;">
              <div style="font-weight:bold;">${nombreItem}</div>
              ${imeiHtml}
              ${cantHtml}
            </td>
            <td style="padding:4px 0;vertical-align:top;text-align:right;font-weight:bold;white-space:nowrap;">
              Bs ${Number(det.subtotalBs).toFixed(2)}
            </td>
          </tr>
        `;
      })
      .join('') || '';

  const clienteInfo = completedSale.cliente
    ? `
      <div style="display:flex;justify-content:space-between;margin:2px 0;">
        <span style="color:#555;">Cliente:</span>
        <span style="font-weight:bold;">${completedSale.cliente.nombreCompleto}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:2px 0;">
        <span style="color:#555;">Teléfono:</span>
        <span style="font-weight:bold;">${completedSale.cliente.telefono}</span>
      </div>
      ${
        completedSale.cliente.ciNit
          ? `<div style="display:flex;justify-content:space-between;margin:2px 0;">
              <span style="color:#555;">C.I. / NIT:</span>
              <span>${completedSale.cliente.ciNit}</span>
            </div>`
          : ''
      }
    `
    : `
      <div style="display:flex;justify-content:space-between;margin:2px 0;">
        <span style="color:#555;">Cliente:</span>
        <span>Mostrador General</span>
      </div>
    `;

  const totalVenta = Number(completedSale.totalVentaBs).toFixed(2);

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket #${completedSale.comprobanteReferencia || completedSale.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px 10px;
            width: 72mm;
            line-height: 1.25;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .title {
            font-size: 15px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .subtitle { font-size: 9.5px; }
          table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10.5px; }
          .footer {
            font-size: 8.5px;
            text-align: center;
            margin-top: 8px;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">CENTRALPHONE</div>
          <div class="subtitle">Importación y Venta Serializada Apple</div>
          <div class="subtitle">${completedSale.caja?.sucursal?.nombre || 'Sucursal Principal'}</div>
          <div class="subtitle">${completedSale.caja?.sucursal?.ciudad || 'Santa Cruz, Bolivia'}</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 10px;">
          <div style="display:flex;justify-content:space-between;">
            <span>Ticket: <span class="bold">#${completedSale.comprobanteReferencia || completedSale.id}</span></span>
            <span>${fechaHora}</span>
          </div>
          <div style="margin-top:2px;">
            <span>Atendido por: </span><span class="bold">${completedSale.usuario?.nombre || 'Vendedor'}</span>
          </div>
        </div>

        <div class="divider"></div>

        ${clienteInfo}

        <div class="divider"></div>

        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:bold;margin:4px 0;">
          <span>TOTAL:</span>
          <span>Bs ${totalVenta}</span>
        </div>

        <div style="font-size: 10px; margin-top: 2px;">
          <span>Método de Pago: </span><span class="bold">${completedSale.metodoPago?.nombre || 'Efectivo'}</span>
        </div>

        <div class="divider"></div>

        <div class="footer">
          *** GARANTÍA OFICIAL CENTRALPHONE ***<br>
          6 Meses de Garantía en Dispositivos Apple.<br>
          Imprescindible presentar este ticket y número de serie/IMEI intacto para reclamos.<br>
          ¡Gracias por su preferencia!
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
}
