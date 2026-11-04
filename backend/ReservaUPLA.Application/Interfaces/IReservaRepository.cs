using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IReservaRepository
{
    /// <summary>La reserva con su historial, lista para cambiar de estado y guardarse (seguimiento activo).</summary>
    Task<Reserva?> ObtenerConHistorialAsync(int id, CancellationToken cancellationToken);

    /// <summary>Una página de reservas con el alcance y los filtros pedidos, y el total que cumple esos filtros.</summary>
    Task<PaginaDeReservasDto> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken);

    /// <summary>Cuántas reservas hay por estado (de un ambiente, o de todos si es null).</summary>
    Task<IndicadoresDto> ContarAsync(int? ambienteId, CancellationToken cancellationToken);

    /// <summary>El ambiente con más reservas Aprobadas; si hay empate, todos los empatados. Vacío si no hay ninguna Aprobada.</summary>
    Task<IReadOnlyList<AmbienteUsoDto>> AmbientesMasUtilizadosAsync(CancellationToken cancellationToken);

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
