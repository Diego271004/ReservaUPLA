using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Pantallas de solo lectura con indicadores: el Dashboard por rol (RF-08) y Mi ambiente (solo Responsable).
/// Controlador delgado: delega en <see cref="IConsultaService"/>.
/// </summary>
[ApiController]
[Authorize]
public sealed class PanelesController : ControllerBase
{
    private readonly IConsultaService _consultas;

    public PanelesController(IConsultaService consultas)
    {
        _consultas = consultas;
    }

    /// <summary>Indicadores, ambiente más utilizado (todos los empatados) y las 5 pendientes más antiguas con el total de pendientes.</summary>
    [HttpGet("api/dashboard")]
    [Authorize(Roles = Roles.Administrador + "," + Roles.Solicitante + "," + Roles.Responsable)]
    [ProducesResponseType(typeof(DashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardDto>> Dashboard(CancellationToken cancellationToken) =>
        Ok(await _consultas.ObtenerDashboardAsync(User.ObtenerActor(), cancellationToken));

    [HttpGet("api/mi-ambiente")]
    [Authorize(Roles = Roles.Responsable)]
    [ProducesResponseType(typeof(MiAmbienteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MiAmbiente(
        [FromQuery] int? ambienteId,
        [FromQuery] int? pagina,
        CancellationToken cancellationToken) =>
        this.Traducir(await _consultas.ObtenerMiAmbienteAsync(User.ObtenerUsuarioId(), ambienteId, pagina, cancellationToken), Ok);
}
