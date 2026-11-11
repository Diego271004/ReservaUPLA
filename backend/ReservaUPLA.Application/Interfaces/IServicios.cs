using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

public interface IAuthService
{
    Task<ResultadoAutenticacion> IniciarSesionAsync(LoginRequestDto dto, CancellationToken cancellationToken);
}

public interface IUsuarioService
{
    Task<ResultadoOperacion<UsuarioDto>> CrearAsync(CrearUsuarioDto dto, CancellationToken cancellationToken);
    Task<IReadOnlyList<UsuarioDto>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken);
}

public interface IAmbienteService
{
    Task<ResultadoOperacion<AmbienteDto>> CrearAsync(CrearAmbienteDto dto, CancellationToken cancellationToken);
    Task<IReadOnlyList<AmbienteDto>> ListarAsync(CancellationToken cancellationToken);
}

public interface IReservaService
{
    /// <summary>Crea una reserva Pendiente a nombre de <paramref name="usuarioId"/> (RN-02, RN-03, RN-04, RN-01 y mantenimiento).</summary>
    Task<ResultadoOperacion<ReservaDto>> CrearAsync(CrearReservaDto dto, int usuarioId, CancellationToken cancellationToken);

    /// <summary>Una reserva con su historial. Quien no puede verla recibe NoEncontrado (no se revela que existe).</summary>
    Task<ResultadoOperacion<ReservaDetalleDto>> ObtenerAsync(int id, ActorDto actor, CancellationToken cancellationToken);

    /// <summary>Aviso inmediato de disponibilidad (RN-01 contra reservas Aprobadas y mantenimiento).</summary>
    Task<ResultadoOperacion<DisponibilidadDto>> ConsultarDisponibilidadAsync(
        ConsultarDisponibilidadDto dto, CancellationToken cancellationToken);

    /// <summary>RN-05: solo el Administrador. Vuelve a comprobar RN-01; si la base rechaza el cruce, el mismo mensaje de conflicto.</summary>
    Task<ResultadoOperacion<ReservaDetalleDto>> AprobarAsync(int id, ActorDto actor, CancellationToken cancellationToken);

    /// <summary>RN-05: solo el Administrador.</summary>
    Task<ResultadoOperacion<ReservaDetalleDto>> RechazarAsync(int id, ActorDto actor, CancellationToken cancellationToken);

    Task<ResultadoOperacion<ReservaDetalleDto>> CancelarAsync(int id, ActorDto actor, CancellationToken cancellationToken);
}

/// <summary>Salida de datos: lista de Reservas, Dashboard y Mi ambiente.</summary>
public interface IConsultaService
{
    Task<ResultadoOperacion<PaginaDeReservasDto>> ListarAsync(ActorDto actor, ConsultaReservasDto consulta, CancellationToken cancellationToken);

    Task<DashboardDto> ObtenerDashboardAsync(ActorDto actor, CancellationToken cancellationToken);

    Task<ResultadoOperacion<MiAmbienteDto>> ObtenerMiAmbienteAsync(
        int responsableId, int? ambienteId, int? pagina, CancellationToken cancellationToken);

    Task<ResultadoOperacion<DisponibilidadDiaDto>> ObtenerDisponibilidadDiaAsync(
        ActorDto actor, string fecha, CancellationToken cancellationToken);
}

/// <summary>Un incumplimiento de una regla de negocio: de un campo (400) o de conflicto con otras reservas (409).</summary>
public sealed record ViolacionDeRegla(string? Campo, string Mensaje, bool EsConflicto)
{
    public static ViolacionDeRegla EnCampo(string campo, string mensaje) => new(campo, mensaje, false);

    public static ViolacionDeRegla Conflicto(string mensaje) => new(null, mensaje, true);
}

/// <summary>
/// Regla de negocio que consulta datos y se evalúa antes de guardar una reserva nueva o de consultar su disponibilidad
/// (RN-01, ambiente en mantenimiento). Devuelve la violación o null.
/// </summary>
public interface IReglaReserva
{
    Task<ViolacionDeRegla?> EvaluarAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken);
}
