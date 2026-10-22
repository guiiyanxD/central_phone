import { roundMoney } from '../../common/utils/money.util';

export class VentaResponseMapper {
  static toResponse(venta: any, userRole?: string) {
    let costoTotalBs = 0;
    for (const d of venta.detalles || []) {
      costoTotalBs += Number(d.costoUnitarioBs || 0) * (d.cantidad || 1);
    }
    const totalVentaBs = Number(venta.totalVentaBs || 0);
    const gananciaNetaBs = roundMoney(totalVentaBs - costoTotalBs);

    if (userRole === 'ADMIN') {
      return {
        ...venta,
        costoTotalBs: roundMoney(costoTotalBs),
        gananciaNetaBs,
      };
    }

    // Para VENDEDOR u otros roles: Proyección limpia sin costos (CENTRALPHONE-CONF-001)
    const { detalles, ...restoVenta } = venta;
    const safeDetalles = (detalles || []).map(
      ({ costoUnitarioBs, ...restoDetalle }: any) => restoDetalle,
    );

    return {
      ...restoVenta,
      detalles: safeDetalles,
    };
  }

  static toManyResponse(ventas: any[], userRole?: string) {
    return ventas.map((v) => this.toResponse(v, userRole));
  }
}
