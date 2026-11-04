using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
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
    /// <summary>Crea una reserva Pendiente a nombre de <paramref name="usuarioId"/>.</summary>
    Task<ResultadoOperacion<ReservaDto>> CrearAsync(
        CrearReservaDto dto, int usuarioId, CancellationToken cancellationToken);

    /// <summary>Lista según el rol: el Administrador ve todas, el Solicitante las suyas y el Responsable las de sus ambientes.</summary>
    Task<IReadOnlyList<ReservaDto>> ListarAsync(int usuarioId, RolUsuario rol, CancellationToken cancellationToken);
}

/// <summary>
/// Punto de extensión de la Fase 6: reglas de negocio que se evalúan antes de guardar una reserva
/// (RN-01 sin cruce con Aprobadas, ambiente en mantenimiento...). Devuelve un error por campo o null.
/// En la Fase 5 no hay ninguna registrada.
/// </summary>
public interface IReglaReserva
{
    Task<KeyValuePair<string, string>?> EvaluarAsync(Domain.Entities.Reserva reserva, CancellationToken cancellationToken);
}
