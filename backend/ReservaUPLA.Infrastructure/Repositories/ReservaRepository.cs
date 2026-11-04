using Microsoft.EntityFrameworkCore;
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

    public Task<Reserva?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        _contexto.Reservas.AsNoTracking().FirstOrDefaultAsync(reserva => reserva.Id == id, cancellationToken);

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

    public Task<bool> ExisteAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, CancellationToken cancellationToken) =>
        _contexto.Reservas.AnyAsync(
            reserva => reserva.AmbienteId == ambienteId
                && reserva.Fecha == fecha
                && reserva.Estado == EstadoReserva.Aprobada
                && reserva.HoraInicio < horaFin
                && reserva.HoraFin > horaInicio,
            cancellationToken);

    public async Task CrearAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        await using var transaccion = await _contexto.Database.BeginTransactionAsync(cancellationToken);

        _contexto.Reservas.Add(reserva);
        await _contexto.SaveChangesAsync(cancellationToken);

        _contexto.HistorialReservas.Add(new HistorialReserva
        {
            ReservaId = reserva.Id,
            EstadoAnterior = null,
            EstadoNuevo = reserva.Estado,
            UsuarioId = reserva.UsuarioId,
        });
        await _contexto.SaveChangesAsync(cancellationToken);

        await transaccion.CommitAsync(cancellationToken);
    }
}
