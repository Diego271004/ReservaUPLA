using System.Globalization;
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

    public async Task<PaginaDeReservasDto> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken)
    {
        var consulta =
            from reserva in _contexto.Reservas.AsNoTracking()
            join ambiente in _contexto.Ambientes.AsNoTracking() on reserva.AmbienteId equals ambiente.Id
            join solicitante in _contexto.Usuarios.AsNoTracking() on reserva.UsuarioId equals solicitante.Id
            select new { reserva, ambiente, solicitante };

        // El alcance del rol y los filtros se aplican en la base: lo que no le corresponde al rol nunca sale de ella.
        if (filtro.UsuarioId is { } usuarioId)
        {
            consulta = consulta.Where(fila => fila.reserva.UsuarioId == usuarioId);
        }

        if (filtro.ResponsableId is { } responsableId)
        {
            consulta = consulta.Where(fila => fila.ambiente.ResponsableId == responsableId);
        }

        if (filtro.Estado is { } estado)
        {
            consulta = consulta.Where(fila => fila.reserva.Estado == estado);
        }

        if (filtro.AmbienteId is { } ambienteId)
        {
            consulta = consulta.Where(fila => fila.reserva.AmbienteId == ambienteId);
        }

        if (filtro.Desde is { } desde)
        {
            consulta = consulta.Where(fila => fila.reserva.Fecha >= desde);
        }

        if (filtro.Hasta is { } hasta)
        {
            consulta = consulta.Where(fila => fila.reserva.Fecha <= hasta);
        }

        var total = await consulta.CountAsync(cancellationToken);

        var ordenada = filtro.Orden == OrdenReservas.PorAntiguedad
            ? consulta.OrderBy(fila => fila.reserva.FechaCreacion).ThenBy(fila => fila.reserva.Id)
            : consulta.OrderBy(fila => fila.reserva.Fecha).ThenBy(fila => fila.reserva.HoraInicio).ThenBy(fila => fila.reserva.Id);

        var filas = await ordenada
            .Skip((filtro.Pagina - 1) * filtro.Tamano)
            .Take(filtro.Tamano)
            .ToListAsync(cancellationToken);

        var elementos = filas
            .Select(fila => fila.reserva.ADto(fila.ambiente.Nombre, fila.solicitante.NombreCompleto))
            .ToList();
        return new PaginaDeReservasDto(elementos, total, filtro.Pagina, filtro.Tamano);
    }

    public async Task<IndicadoresDto> ContarAsync(int? ambienteId, CancellationToken cancellationToken)
    {
        var consulta = _contexto.Reservas.AsNoTracking();
        if (ambienteId is { } id)
        {
            consulta = consulta.Where(reserva => reserva.AmbienteId == id);
        }

        var porEstado = await consulta
            .GroupBy(reserva => reserva.Estado)
            .Select(grupo => new { Estado = grupo.Key, Cantidad = grupo.Count() })
            .ToListAsync(cancellationToken);

        int De(EstadoReserva estado) => porEstado.FirstOrDefault(fila => fila.Estado == estado)?.Cantidad ?? 0;
        return new IndicadoresDto(
            Total: porEstado.Sum(fila => fila.Cantidad),
            Pendientes: De(EstadoReserva.Pendiente),
            Aprobadas: De(EstadoReserva.Aprobada),
            Rechazadas: De(EstadoReserva.Rechazada));
    }

    public async Task<IReadOnlyList<ActividadRecienteDto>> ActividadRecienteAsync(int cantidad, CancellationToken cancellationToken)
    {
        var filas = await (
            from evento in _contexto.HistorialReservas.AsNoTracking()
            join reserva in _contexto.Reservas.AsNoTracking() on evento.ReservaId equals reserva.Id
            join ambiente in _contexto.Ambientes.AsNoTracking() on reserva.AmbienteId equals ambiente.Id
            join solicitante in _contexto.Usuarios.AsNoTracking() on reserva.UsuarioId equals solicitante.Id
            join autor in _contexto.Usuarios.AsNoTracking() on evento.UsuarioId equals autor.Id
            orderby evento.Fecha descending, evento.Id descending
            select new { evento, reserva, ambiente, solicitante, autor })
            .Take(cantidad)
            .ToListAsync(cancellationToken);

        return filas
            .Select(fila => new ActividadRecienteDto(
                fila.reserva.Id,
                fila.ambiente.Nombre,
                fila.solicitante.NombreCompleto,
                fila.reserva.Fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                fila.reserva.HoraInicio.ToString("HH:mm", CultureInfo.InvariantCulture),
                fila.reserva.HoraFin.ToString("HH:mm", CultureInfo.InvariantCulture),
                fila.evento.EstadoAnterior?.ToString(),
                fila.evento.EstadoNuevo.ToString(),
                fila.autor.NombreCompleto,
                fila.evento.Fecha))
            .ToList();
    }

    public async Task<IReadOnlyList<AmbienteUsoDto>> UsoPorAmbienteAsync(CancellationToken cancellationToken)
    {
        var aprobadas = await _contexto.Reservas.AsNoTracking()
            .Where(reserva => reserva.Estado == EstadoReserva.Aprobada)
            .GroupBy(reserva => reserva.AmbienteId)
            .Select(grupo => new { AmbienteId = grupo.Key, Cantidad = grupo.Count() })
            .ToListAsync(cancellationToken);

        var ambientes = await _contexto.Ambientes.AsNoTracking().ToListAsync(cancellationToken);
        return ambientes
            .OrderBy(ambiente => ambiente.Nombre)
            .Select(ambiente => new AmbienteUsoDto(
                ambiente.Id,
                ambiente.Nombre,
                aprobadas.FirstOrDefault(fila => fila.AmbienteId == ambiente.Id)?.Cantidad ?? 0))
            .ToList();
    }

    public async Task<IReadOnlyList<AmbienteUsoDto>> AmbientesMasUtilizadosAsync(CancellationToken cancellationToken)
    {
        var aprobadas = await _contexto.Reservas.AsNoTracking()
            .Where(reserva => reserva.Estado == EstadoReserva.Aprobada)
            .GroupBy(reserva => reserva.AmbienteId)
            .Select(grupo => new { AmbienteId = grupo.Key, Cantidad = grupo.Count() })
            .ToListAsync(cancellationToken);

        if (aprobadas.Count == 0)
        {
            return [];
        }

        // Si dos ambientes empatan en el máximo, salen los dos.
        var maximo = aprobadas.Max(fila => fila.Cantidad);
        var empatados = aprobadas.Where(fila => fila.Cantidad == maximo).Select(fila => fila.AmbienteId).ToList();

        return await _contexto.Ambientes.AsNoTracking()
            .Where(ambiente => empatados.Contains(ambiente.Id))
            .OrderBy(ambiente => ambiente.Nombre)
            .Select(ambiente => new AmbienteUsoDto(ambiente.Id, ambiente.Nombre, maximo))
            .ToListAsync(cancellationToken);
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
