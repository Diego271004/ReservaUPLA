using Microsoft.EntityFrameworkCore;
using Npgsql;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

public sealed class ReservaRepository : IReservaRepository
{
    private readonly ReservaUPLADbContext _contexto;

    public ReservaRepository(ReservaUPLADbContext contexto)
    {
        _contexto = contexto;
    }

    public Task<Reserva?> ObtenerConHistorialAsync(int id, CancellationToken cancellationToken) =>
        _contexto.Reservas
            .Include(reserva => reserva.Historial)
            .FirstOrDefaultAsync(reserva => reserva.Id == id, cancellationToken);

    public async Task<IReadOnlyList<ReservaDto>> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken)
    {
        var consulta =
            from reserva in _contexto.Reservas.AsNoTracking()
            join ambiente in _contexto.Ambientes.AsNoTracking() on reserva.AmbienteId equals ambiente.Id
            join solicitante in _contexto.Usuarios.AsNoTracking() on reserva.UsuarioId equals solicitante.Id
            select new { reserva, ambiente, solicitante };

        if (filtro.UsuarioId is { } usuarioId)
        {
            consulta = consulta.Where(fila => fila.reserva.UsuarioId == usuarioId);
        }

        if (filtro.ResponsableId is { } responsableId)
        {
            consulta = consulta.Where(fila => fila.ambiente.ResponsableId == responsableId);
        }

        var filas = await consulta
            .OrderByDescending(fila => fila.reserva.Fecha)
            .ThenBy(fila => fila.reserva.HoraInicio)
            .ToListAsync(cancellationToken);

        return filas
            .Select(fila => fila.reserva.ADto(fila.ambiente.Nombre, fila.solicitante.NombreCompleto))
            .ToList();
    }

    // Dos rangos se cruzan si cada uno empieza antes de que termine el otro (extremos que se tocan no cuentan).
    public Task<Reserva?> BuscarAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, int? excluirReservaId, CancellationToken cancellationToken) =>
        _contexto.Reservas
            .AsNoTracking()
            .Where(reserva => reserva.AmbienteId == ambienteId
                && reserva.Fecha == fecha
                && reserva.Estado == EstadoReserva.Aprobada
                && reserva.HoraInicio < horaFin
                && reserva.HoraFin > horaInicio
                && (excluirReservaId == null || reserva.Id != excluirReservaId))
            .OrderBy(reserva => reserva.HoraInicio)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AgregarAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        _contexto.Reservas.Add(reserva);
        await GuardarCambiosAsync(cancellationToken);
    }

    public Task GuardarAsync(Reserva reserva, CancellationToken cancellationToken) => GuardarCambiosAsync(cancellationToken);

    // La reserva y sus eventos de historial se guardan en una sola operación (una transacción).
    // La base es la última barrera de RN-01 y se traduce, no se deja subir como 500:
    //  - 23P01 (exclusion_violation): la restricción de exclusión rechazó el cruce de dos reservas Aprobadas.
    //  - 40P01 (deadlock_detected): dos aprobaciones simultáneas de reservas que se cruzan se esperan entre sí al comprobar
    //    esa restricción y PostgreSQL aborta una; para quien la pidió es el mismo conflicto (la otra ya la ganó).
    private async Task GuardarCambiosAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _contexto.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (EsConflictoDeHorario(ex))
        {
            throw new ConflictoDeHorarioException(ex);
        }
    }

    // EF puede envolver el error de PostgreSQL en DbUpdateException y esta en InvalidOperationException (fallo transitorio).
    private static bool EsConflictoDeHorario(Exception ex)
    {
        for (Exception? actual = ex; actual is not null; actual = actual.InnerException)
        {
            if (actual is PostgresException { SqlState: PostgresErrorCodes.ExclusionViolation or PostgresErrorCodes.DeadlockDetected })
            {
                return true;
            }
        }

        return false;
    }
}
