using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// En la Fase 5 solo crea y lista. Aprobar, rechazar y cancelar llegan en la Fase 9; las reglas que
/// consultan datos (RN-01, ambiente en mantenimiento) se enchufan en la Fase 6 como <see cref="IReglaReserva"/>.
/// </summary>
public sealed class ReservaService : IReservaService
{
    private readonly IValidator<CrearReservaDto> _validator;
    private readonly IReservaRepository _reservas;
    private readonly IAmbienteRepository _ambientes;
    private readonly IUsuarioRepository _usuarios;
    private readonly IEnumerable<IReglaReserva> _reglas;

    public ReservaService(
        IValidator<CrearReservaDto> validator,
        IReservaRepository reservas,
        IAmbienteRepository ambientes,
        IUsuarioRepository usuarios,
        IEnumerable<IReglaReserva> reglas)
    {
        _validator = validator;
        _reservas = reservas;
        _ambientes = ambientes;
        _usuarios = usuarios;
        _reglas = reglas;
    }

    public async Task<ResultadoOperacion<ReservaDto>> CrearAsync(
        CrearReservaDto dto, int usuarioId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitud = dto with { Motivo = dto.Motivo?.Trim() };

        var validacion = await _validator.ValidateAsync(solicitud, cancellationToken);
        if (!validacion.IsValid)
        {
            return ResultadoOperacion<ReservaDto>.DatosInvalidos(validacion.Errors.AgruparPorCampo());
        }

        var ambiente = await _ambientes.ObtenerPorIdAsync(solicitud.AmbienteId!.Value, cancellationToken);
        if (ambiente is null)
        {
            return ResultadoOperacion<ReservaDto>.DatosInvalidos(
                CamposFormulario.AmbienteId, MensajesValidacion.AmbienteInexistente);
        }

        HorarioReserva.TryFecha(solicitud.Fecha, out var fecha);
        HorarioReserva.TryHora(solicitud.HoraInicio, out var horaInicio);
        HorarioReserva.TryHora(solicitud.HoraFin, out var horaFin);
        var reserva = new Reserva
        {
            Fecha = fecha,
            HoraInicio = horaInicio,
            HoraFin = horaFin,
            Motivo = solicitud.Motivo!,
            Estado = EstadoReserva.Pendiente,
            UsuarioId = usuarioId,
            AmbienteId = ambiente.Id,
        };

        foreach (var regla in _reglas)
        {
            if (await regla.EvaluarAsync(reserva, cancellationToken) is { } error)
            {
                return ResultadoOperacion<ReservaDto>.DatosInvalidos(error.Key, error.Value);
            }
        }

        await _reservas.CrearAsync(reserva, cancellationToken);

        var solicitante = await _usuarios.ObtenerPorIdAsync(usuarioId, cancellationToken);
        return ResultadoOperacion<ReservaDto>.Exitoso(
            reserva.ADto(ambiente.Nombre, solicitante?.NombreCompleto ?? string.Empty));
    }

    public Task<IReadOnlyList<ReservaDto>> ListarAsync(int usuarioId, RolUsuario rol, CancellationToken cancellationToken)
    {
        var filtro = rol switch
        {
            RolUsuario.Administrador => new FiltroReservas(),
            RolUsuario.Solicitante => new FiltroReservas(UsuarioId: usuarioId),
            RolUsuario.Responsable => new FiltroReservas(ResponsableId: usuarioId),
            _ => throw new ArgumentOutOfRangeException(nameof(rol), rol, "Rol no contemplado."),
        };

        return _reservas.ListarAsync(filtro, cancellationToken);
    }
}
