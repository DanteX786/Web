from dataclasses import dataclass

from fastapi import APIRouter, Depends, HTTPException, Query

from app.application.dashboard_service import DashboardService
from app.presentation.dependencies.medicion_dependencies import get_dashboard_service
from app.presentation.schemas.dashboard_schema import (
    AtencionRespuesta,
    ClientesRespuesta,
    DineroRespuesta,
    EmpleadosRespuesta,
    Movimiento,
    ProduccionRespuesta,
    TipoPeriodo,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

DESC_PERIODO = "mes | trimestre | semestre | anio"


@dataclass
class FiltroPeriodo:
    """Periodo pedido: tipo + año + número (mes 1-12, trimestre 1-4, semestre 1-2).
    Sin año ni número se usa el periodo que contiene a hoy."""
    periodo: TipoPeriodo
    anio: int | None
    numero: int | None


def filtro_periodo(
    periodo: TipoPeriodo = Query("mes", description=DESC_PERIODO),
    anio: int | None = Query(None, ge=2000, le=2100, description="Año a consultar (por defecto, el actual)"),
    numero: int | None = Query(None, ge=1, le=12,
                               description="Mes (1-12), trimestre (1-4) o semestre (1-2). Por defecto, el actual"),
) -> FiltroPeriodo:
    return FiltroPeriodo(periodo, anio, numero)


def _consultar(funcion, f: FiltroPeriodo):
    """Llama al servicio y convierte un periodo inválido (ej. trimestre 5 o uno futuro) en error 422."""
    try:
        return funcion(f.periodo, anio=f.anio, numero=f.numero)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error


@router.get("/atencion", response_model=AtencionRespuesta,
            summary="Lo que hay que atender hoy: por aprobar, producción, atrasos, por cobrar, stock bajo")
def atencion(service: DashboardService = Depends(get_dashboard_service)):
    return service.atencion()


@router.get("/dinero", response_model=DineroRespuesta,
            summary="Facturado, cobrado, gastos en compras y ganancia del periodo (HU_58)")
def dinero(f: FiltroPeriodo = Depends(filtro_periodo),
           service: DashboardService = Depends(get_dashboard_service)):
    return _consultar(service.dinero, f)


@router.get("/produccion", response_model=ProduccionRespuesta,
            summary="Unidades confeccionadas, prendas entregadas, cumplimiento y rendimiento por empleado")
def produccion(f: FiltroPeriodo = Depends(filtro_periodo),
               service: DashboardService = Depends(get_dashboard_service)):
    return _consultar(service.produccion, f)


@router.get("/clientes", response_model=ClientesRespuesta,
            summary="Clientes que más facturan y remisiones recibidas por estado (HU_60)")
def clientes(f: FiltroPeriodo = Depends(filtro_periodo),
             service: DashboardService = Depends(get_dashboard_service)):
    return _consultar(service.clientes, f)


@router.get("/empleados", response_model=EmpleadosRespuesta,
            summary="Asistencia de los empleados y desempeño según la producción (quién rinde mejor en cada proceso)")
def empleados(f: FiltroPeriodo = Depends(filtro_periodo),
              service: DashboardService = Depends(get_dashboard_service)):
    return _consultar(service.empleados, f)


@router.get("/anios", response_model=list[int],
            summary="Años con datos, para el selector de año del dashboard (incluye el actual)")
def anios(service: DashboardService = Depends(get_dashboard_service)):
    return service.anios()


@router.get("/movimientos", response_model=list[Movimiento],
            summary="Últimos movimientos del taller (remisiones, compras y entregas)")
def movimientos(limite: int = Query(8, ge=1, le=50),
                service: DashboardService = Depends(get_dashboard_service)):
    return service.movimientos(limite)
