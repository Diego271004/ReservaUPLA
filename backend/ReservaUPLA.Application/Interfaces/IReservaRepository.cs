using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IReservaRepository
{
    Task<Reserva?> ObtenerConHistorialAsync(int id, CancellationToken cancellationToken);

    Task<PaginaDeReservasDto> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken);

    /// <summary>Cuántas reservas hay por estado (de un ambiente, o de todos si es null).</summary>
    Task<IndicadoresDto> ContarAsync(int? ambienteId, CancellationToken cancellationToken);

    /// <summary>El ambiente con más reservas Aprobadas; si hay empate, todos los empatados. Vacío si no hay ninguna Aprobada.</summary>
    Task<IReadOnlyList<AmbienteUsoDto>> AmbientesMasUtilizadosAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<ActividadRecienteDto>> ActividadRecienteAsync(int cantidad, CancellationToken cancellationToken);

    /// <summary>Todos los ambientes con su cantidad de reservas Aprobadas, para gráficos y tablas alternativas.</summary>
    Task<IReadOnlyList<AmbienteUsoDto>> UsoPorAmbienteAsync(CancellationToken cancellationToken);

    /// <summary>
    /// La reserva Aprobada del ambiente que se cruza con el rango (RN-01), o null. `excluirReservaId` deja fuera a la
    /// propia reserva cuando se está aprobando.
    /// </summary>
    Task<Reserva?> BuscarAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, int? excluirReservaId, CancellationToken cancellationToken);

    /// <summary>Guarda una reserva nueva con su historial en una sola operación. Completa el Id.</summary>
    /// <exception cref="Common.ConflictoDeHorarioException">La base rechazó el cruce (RN-01).</exception>
    Task AgregarAsync(Reserva reserva, CancellationToken cancellationToken);

    /// <summary>Guarda los cambios de una reserva (el estado nuevo y sus eventos de historial, juntos).</summary>
    /// <exception cref="Common.ConflictoDeHorarioException">La base rechazó el cruce (RN-01).</exception>
    Task GuardarAsync(Reserva reserva, CancellationToken cancellationToken);
}
