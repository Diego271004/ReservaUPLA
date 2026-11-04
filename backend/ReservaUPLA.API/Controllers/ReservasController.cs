using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.API.Contracts;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Controlador delgado: delega en <see cref="IReservaService"/> y solo traduce el resultado a HTTP.
/// Cada rol lista lo que le corresponde. Crear y consultar disponibilidad: Administrador y Solicitante.
/// Aprobar y rechazar: solo el Administrador (RN-05, 403 para los demás). Cancelar: el dueño o el Administrador.
/// </summary>
[ApiController]
[Route("api/reservas")]
[Authorize]
public sealed class ReservasController : ControllerBase
{
    private readonly IReservaService _reservas;

    public ReservasController(IReservaService reservas)
    {
        _reservas = reservas;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ReservaDto>>> Listar(CancellationToken cancellationToken) =>
        Ok(await _reservas.ListarAsync(User.ObtenerUsuarioId(), User.ObtenerRol(), cancellationToken));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ReservaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(int id, CancellationToken cancellationToken) =>
        this.Traducir(await _reservas.ObtenerAsync(id, User.ObtenerActor(), cancellationToken), Ok);

    /// <summary>Aviso inmediato de disponibilidad (verde u ocupado) para la pantalla Nueva reserva.</summary>
    [HttpGet("disponibilidad")]
    [Authorize(Roles = Roles.AdministradorOSolicitante)]
    [ProducesResponseType(typeof(DisponibilidadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<IActionResult> Disponibilidad(
        [FromQuery] int? ambienteId,
        [FromQuery] string? fecha,
        [FromQuery] string? horaInicio,
        [FromQuery] string? horaFin,
        CancellationToken cancellationToken) =>
        this.Traducir(
            await _reservas.ConsultarDisponibilidadAsync(new ConsultarDisponibilidadDto(ambienteId, fecha, horaInicio, horaFin), cancellationToken),
            Ok);

    [HttpPost]
    [Authorize(Roles = Roles.AdministradorOSolicitante)]
    [ProducesResponseType(typeof(ReservaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear(
        [CuerpoOpcional] CrearReservaDto? dto,
        CancellationToken cancellationToken)
    {
        var solicitud = this.CuerpoOVacio(dto, new CrearReservaDto(null, null, null, null, null));
        return this.Creado(await _reservas.CrearAsync(solicitud, User.ObtenerUsuarioId(), cancellationToken));
    }

    [HttpPost("{id:int}/aprobar")]
    [Authorize(Roles = Roles.Administrador)]
    [ProducesResponseType(typeof(ReservaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Aprobar(int id, CancellationToken cancellationToken) =>
        this.Traducir(await _reservas.AprobarAsync(id, User.ObtenerActor(), cancellationToken), Ok);

    [HttpPost("{id:int}/rechazar")]
    [Authorize(Roles = Roles.Administrador)]
    [ProducesResponseType(typeof(ReservaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Rechazar(int id, CancellationToken cancellationToken) =>
        this.Traducir(await _reservas.RechazarAsync(id, User.ObtenerActor(), cancellationToken), Ok);

    [HttpPost("{id:int}/cancelar")]
    [Authorize(Roles = Roles.AdministradorOSolicitante)]
    [ProducesResponseType(typeof(ReservaDetalleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancelar(int id, CancellationToken cancellationToken) =>
        this.Traducir(await _reservas.CancelarAsync(id, User.ObtenerActor(), cancellationToken), Ok);
}
