using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>
/// Cada rol lista lo que le corresponde (la regla vive en ReservaService). Solo el Administrador y la Solicitante
/// crean reservas; la Responsable de ambiente solo consulta (403).
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

    [HttpPost]
    [Authorize(Roles = Roles.AdministradorOSolicitante)]
    [ProducesResponseType(typeof(ReservaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<IActionResult> Crear(
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] CrearReservaDto? dto,
        CancellationToken cancellationToken)
    {
        var solicitud = ModelState.IsValid && dto is not null ? dto : new CrearReservaDto(null, null, null, null, null);
        var resultado = await _reservas.CrearAsync(solicitud, User.ObtenerUsuarioId(), cancellationToken);
        return this.Traducir(resultado, reserva => StatusCode(StatusCodes.Status201Created, reserva));
    }
}
