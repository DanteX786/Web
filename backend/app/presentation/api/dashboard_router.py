from fastapi import APIRouter, Depends, Query

from app.application.dashboard_service import DashboardService
from app.presentation.dependencies.medicion_dependencies import get_dashboard_service
from app.presentation.schemas.dashboard_schema import (
    AtencionRespuesta,
    ClientesRespuesta,
    DineroRespuesta,
    Movimiento,
    ProduccionRespuesta,
    TipoPeriodo,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

DESC_PERIODO = "mes | trimestre | semestre | anio (periodo de calendario actual, hasta hoy)"


@router.get("/atencion", response_model=AtencionRespuesta,
            summary="Lo que hay que atender hoy: por aprobar, producción, atrasos, por cobrar, stock bajo")
def atencion(service: DashboardService = Depends(get_dashboard_service)):
    return service.atencion()


@router.get("/dinero", response_model=DineroRespuesta,
            summary="Facturado, cobrado, gastos en compras y ganancia del periodo (HU_58)")
def dinero(periodo: TipoPeriodo = Query("mes", description=DESC_PERIODO),
           service: DashboardService = Depends(get_dashboard_service)):
    return service.dinero(periodo)


@router.get("/produccion", response_model=ProduccionRespuesta,
            summary="Unidades confeccionadas, prendas entregadas, cumplimiento y rendimiento por empleado")
def produccion(periodo: TipoPeriodo = Query("mes", description=DESC_PERIODO),
               service: DashboardService = Depends(get_dashboard_service)):
    return service.produccion(periodo)


@router.get("/clientes", response_model=ClientesRespuesta,
            summary="Clientes que más facturan y remisiones recibidas por estado (HU_60)")
def clientes(periodo: TipoPeriodo = Query("mes", description=DESC_PERIODO),
             service: DashboardService = Depends(get_dashboard_service)):
    return service.clientes(periodo)


@router.get("/movimientos", response_model=list[Movimiento],
            summary="Últimos movimientos del taller (remisiones, compras y entregas)")
def movimientos(limite: int = Query(8, ge=1, le=50),
                service: DashboardService = Depends(get_dashboard_service)):
    return service.movimientos(limite)
