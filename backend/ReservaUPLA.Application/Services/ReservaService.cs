using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Reglas;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Domain.Exceptions;

namespace ReservaUPLA.Application.Services;

/// <summary>Crea, consulta y cambia el estado de las reservas aplicando RN-01 a RN-06.</summary>
public sealed class ReservaService : IReservaService
{
    private readonly IValidator<CrearReservaDto> _validador;
    private readonly IValidator<ConsultarDisponibilidadDto> _validadorDisponibilidad;
    private readonly IReservaRepository _reservas;
    private readonly IAmbienteRepository _ambientes;
    private readonly IUsuarioRepository _usuarios;
    private readonly IEnumerable<IReglaReserva> _reglas;
    private readonly ComprobadorDeHorario _comprobador;
    private readonly TimeProvider _reloj;

    public ReservaService(
        IValidator<CrearReservaDto> validador,
        IValidator<ConsultarDisponibilidadDto> validadorDisponibilidad,
        IReservaRepository reservas,
        IAmbienteRepository ambientes,
        IUsuarioRepository usuarios,
        IEnumerable<IReglaReserva> reglas,
        ComprobadorDeHorario comprobador,
        TimeProvider reloj)
    {
        _validador = validador;
        _validadorDisponibilidad = validadorDisponibilidad;
        _reservas = reservas;
        _ambientes = ambientes;
        _usuarios = usuarios;
        _reglas = reglas;
        _comprobador = comprobador;
        _reloj = reloj;
    }

    // ================================================================ Crear

    public async Task<ResultadoOperacion<ReservaDto>> CrearAsync(
        CrearReservaDto dto, int usuarioId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitud = dto with { Motivo = dto.Motivo?.Trim() };

        if (ResultadoOperacion<ReservaDto>.SiNoEsValido(await _validador.ValidateAsync(solicitud, cancellationToken)) is { } invalido)
        {
            return invalido;
        }

        var ambiente = await _ambientes.ObtenerPorIdAsync(solicitud.AmbienteId!.Value, cancellationToken);
        if (ambiente is null)
        {
            return ResultadoOperacion<ReservaDto>.DatosInvalidos(
                CamposFormulario.AmbienteId, MensajesValidacion.AmbienteInexistente);
        }

        var reserva = ConstruirReserva(solicitud.Fecha, solicitud.HoraInicio, solicitud.HoraFin, solicitud.Motivo!, usuarioId, ambiente.Id);

        if (await PrimeraViolacionAsync(reserva, ambiente, cancellationToken) is { } violacion)
        {
            return violacion.EsConflicto
                ? ResultadoOperacion<ReservaDto>.Conflicto(violacion.Mensaje)
                : ResultadoOperacion<ReservaDto>.DatosInvalidos(violacion.Campo!, violacion.Mensaje);
        }

        try
        {
            await _reservas.AgregarAsync(reserva, cancellationToken);
        }
        catch (ConflictoDeHorarioException conflicto)
        {
            // Otra aprobación se coló entre la comprobación y el guardado: la base es la última barrera de RN-01.
            return ResultadoOperacion<ReservaDto>.Conflicto(await MensajeDeConflictoAsync(reserva, conflicto, cancellationToken));
        }

        var solicitante = await _usuarios.ObtenerPorIdAsync(usuarioId, cancellationToken);
        return ResultadoOperacion<ReservaDto>.Exitoso(
            reserva.ADto(ambiente.Nombre, solicitante?.NombreCompleto ?? string.Empty));
    }

    // ================================================================ Consultar

    public async Task<ResultadoOperacion<ReservaDetalleDto>> ObtenerAsync(
        int id, ActorDto actor, CancellationToken cancellationToken)
    {
        var reserva = await _reservas.ObtenerConHistorialAsync(id, cancellationToken);
        if (reserva is null)
        {
            return ResultadoOperacion<ReservaDetalleDto>.NoEncontrado();
        }

        var ambiente = await _ambientes.ObtenerPorIdAsync(reserva.AmbienteId, cancellationToken);
        // Quien no puede ver la reserva recibe lo mismo que si no existiera: no se revela su existencia.
        return PuedeVer(reserva, ambiente, actor)
            ? ResultadoOperacion<ReservaDetalleDto>.Exitoso(await ArmarDetalleAsync(reserva, ambiente!, cancellationToken))
            : ResultadoOperacion<ReservaDetalleDto>.NoEncontrado();
    }

    public async Task<ResultadoOperacion<DisponibilidadDto>> ConsultarDisponibilidadAsync(
        ConsultarDisponibilidadDto dto, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (ResultadoOperacion<DisponibilidadDto>.SiNoEsValido(await _validadorDisponibilidad.ValidateAsync(dto, cancellationToken)) is { } invalido)
        {
            return invalido;
        }

        var ambiente = await _ambientes.ObtenerPorIdAsync(dto.AmbienteId!.Value, cancellationToken);
        if (ambiente is null)
        {
            return ResultadoOperacion<DisponibilidadDto>.DatosInvalidos(
                CamposFormulario.AmbienteId, MensajesValidacion.AmbienteInexistente);
        }

        // Una reserva solo para evaluar las mismas reglas que al registrar; no se guarda.
        var prueba = ConstruirReserva(dto.Fecha, dto.HoraInicio, dto.HoraFin, string.Empty, 0, ambiente.Id);
        var violacion = await PrimeraViolacionAsync(prueba, ambiente, cancellationToken);

        return ResultadoOperacion<DisponibilidadDto>.Exitoso(
            violacion is null
                ? new DisponibilidadDto(true, MensajesValidacion.Disponible)
                : new DisponibilidadDto(false, violacion.Mensaje));
    }

    // ================================================================ Cambiar de estado

    public Task<ResultadoOperacion<ReservaDetalleDto>> AprobarAsync(int id, ActorDto actor, CancellationToken cancellationToken) =>
        TransicionarAsync(
            id,
            permitido: actor.Rol == RolUsuario.Administrador, // RN-05
            comprobaciones: ComprobarSinCruceAsync,
            transicion: reserva => reserva.Aprobar(actor.UsuarioId, _reloj.GetUtcNow()),
            cancellationToken);

    public Task<ResultadoOperacion<ReservaDetalleDto>> RechazarAsync(int id, ActorDto actor, CancellationToken cancellationToken) =>
        TransicionarAsync(
            id,
            permitido: actor.Rol == RolUsuario.Administrador, // RN-05
            comprobaciones: (_, _) => SinObjeciones,
            transicion: reserva => reserva.Rechazar(actor.UsuarioId, _reloj.GetUtcNow()),
            cancellationToken);

    public Task<ResultadoOperacion<ReservaDetalleDto>> CancelarAsync(int id, ActorDto actor, CancellationToken cancellationToken) =>
        TransicionarAsync(
            id,
            permitido: actor.Rol != RolUsuario.Responsable,
            // Cancela el solicitante dueño de la reserva o el Administrador.
            comprobaciones: (reserva, _) => Task.FromResult(
                actor.Rol == RolUsuario.Solicitante && reserva.UsuarioId != actor.UsuarioId
                    ? ResultadoOperacion<ReservaDetalleDto>.SinPermiso()
                    : null),
            transicion: reserva => reserva.Cancelar(actor.UsuarioId, _reloj.GetUtcNow()),
            cancellationToken);

    // ================================================================ Apoyo

    private static readonly Task<ResultadoOperacion<ReservaDetalleDto>?> SinObjeciones =
        Task.FromResult<ResultadoOperacion<ReservaDetalleDto>?>(null);

    /// <summary>
    /// El flujo común de aprobar, rechazar y cancelar: permiso por rol, la reserva existe, comprobaciones propias de la
    /// acción y, por último, la transición del dominio (RN-06) guardada junto con su evento de historial.
    /// </summary>
    private async Task<ResultadoOperacion<ReservaDetalleDto>> TransicionarAsync(
        int id,
        bool permitido,
        Func<Reserva, CancellationToken, Task<ResultadoOperacion<ReservaDetalleDto>?>> comprobaciones,
        Action<Reserva> transicion,
        CancellationToken cancellationToken)
    {
        if (!permitido)
        {
            return ResultadoOperacion<ReservaDetalleDto>.SinPermiso();
        }

        var reserva = await _reservas.ObtenerConHistorialAsync(id, cancellationToken);
        if (reserva is null)
        {
            return ResultadoOperacion<ReservaDetalleDto>.NoEncontrado();
        }

        if (await comprobaciones(reserva, cancellationToken) is { } rechazo)
        {
            return rechazo;
        }

        return await CambiarEstadoAsync(reserva, transicion, cancellationToken);
    }

    // RN-01 se vuelve a comprobar al aprobar: desde que se pidió pudo aprobarse otra reserva que se cruza.
    private async Task<ResultadoOperacion<ReservaDetalleDto>?> ComprobarSinCruceAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        if (reserva.Estado == EstadoReserva.Pendiente
            && await _comprobador.MensajeDeConflictoAsync(reserva, cancellationToken) is { } mensaje)
        {
            return ResultadoOperacion<ReservaDetalleDto>.Conflicto(mensaje);
        }

        return null;
    }

    private async Task<ResultadoOperacion<ReservaDetalleDto>> CambiarEstadoAsync(
        Reserva reserva, Action<Reserva> transicion, CancellationToken cancellationToken)
    {
        try
        {
            transicion(reserva); // RN-06: el dominio rechaza lo que sale de un estado final
        }
        catch (DomainException error)
        {
            return ResultadoOperacion<ReservaDetalleDto>.Conflicto(error.Message);
        }

        try
        {
            await _reservas.GuardarAsync(reserva, cancellationToken);
        }
        catch (ConflictoDeHorarioException conflicto)
        {
            // RN-01 en la base: dos aprobaciones simultáneas que se cruzan; la segunda recibe el mismo mensaje de conflicto.
            return ResultadoOperacion<ReservaDetalleDto>.Conflicto(await MensajeDeConflictoAsync(reserva, conflicto, cancellationToken));
        }

        var ambiente = await _ambientes.ObtenerPorIdAsync(reserva.AmbienteId, cancellationToken);
        return ResultadoOperacion<ReservaDetalleDto>.Exitoso(await ArmarDetalleAsync(reserva, ambiente!, cancellationToken));
    }

    private async Task<ViolacionDeRegla?> PrimeraViolacionAsync(
        Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken)
    {
        foreach (var regla in _reglas)
        {
            if (await regla.EvaluarAsync(reserva, ambiente, cancellationToken) is { } violacion)
            {
                return violacion;
            }
        }

        return null;
    }

    private async Task<string> MensajeDeConflictoAsync(
        Reserva reserva, ConflictoDeHorarioException conflicto, CancellationToken cancellationToken) =>
        await _comprobador.MensajeDeConflictoAsync(reserva, cancellationToken) ?? conflicto.Message;

    private Reserva ConstruirReserva(
        string? fecha, string? horaInicio, string? horaFin, string motivo, int usuarioId, int ambienteId)
    {
        HorarioReserva.TryFecha(fecha, out var fechaReserva);
        HorarioReserva.TryHora(horaInicio, out var inicio);
        HorarioReserva.TryHora(horaFin, out var fin);
        return Reserva.Crear(fechaReserva, inicio, fin, motivo, usuarioId, ambienteId, _reloj.GetUtcNow());
    }

    private static bool PuedeVer(Reserva reserva, Ambiente? ambiente, ActorDto actor) => actor.Rol switch
    {
        RolUsuario.Administrador => true,
        RolUsuario.Solicitante => reserva.UsuarioId == actor.UsuarioId,
        RolUsuario.Responsable => ambiente?.ResponsableId == actor.UsuarioId,
        _ => false,
    };

    private async Task<ReservaDetalleDto> ArmarDetalleAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken)
    {
        var idsDePersonas = reserva.Historial.Select(evento => evento.UsuarioId).Append(reserva.UsuarioId);
        var nombres = (await _usuarios.ObtenerPorIdsAsync(idsDePersonas, cancellationToken))
            .ToDictionary(usuario => usuario.Id, usuario => usuario.NombreCompleto);
        string NombreDe(int usuarioId) => nombres.GetValueOrDefault(usuarioId, string.Empty);

        var historial = reserva.Historial
            .OrderBy(evento => evento.Fecha)
            .ThenBy(evento => evento.Id)
            .Select(evento => new EventoHistorialDto(
                evento.Id, evento.EstadoAnterior?.ToString(), evento.EstadoNuevo.ToString(), NombreDe(evento.UsuarioId), evento.Fecha))
            .ToList();

        return new ReservaDetalleDto(reserva.ADto(ambiente.Nombre, NombreDe(reserva.UsuarioId)), historial);
    }
}
