using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

/// <summary>Cualquier usuario con sesión lista los ambientes (la Solicitante los necesita para reservar); solo el Administrador los crea.</summary>
[ApiController]
[Route("api/ambientes")]
[Authorize]
public sealed class AmbientesController : ControllerBase
{
    private readonly IAmbienteService _ambientes;

    public AmbientesController(IAmbienteService ambientes)
    {
        _ambientes = ambientes;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AmbienteDto>>> Listar(CancellationToken cancellationToken) =>
        Ok(await _ambientes.ListarAsync(cancellationToken));

    [HttpPost]
    [Authorize(Roles = Roles.Administrador)]
    [ProducesResponseType(typeof(AmbienteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<IActionResult> Crear(
        [CuerpoOpcional] CrearAmbienteDto? dto,
        CancellationToken cancellationToken)
    {
        var solicitud = this.CuerpoOVacio(dto, new CrearAmbienteDto(null, null, null, null, null, null));
        return this.Creado(await _ambientes.CrearAsync(solicitud, cancellationToken));
    }
}
