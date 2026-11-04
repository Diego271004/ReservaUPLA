using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.API.Controllers;

[ApiController]
[Route("api/salud")]
public class SaludController : ControllerBase
{
    private readonly IComprobadorSalud _comprobadorSalud;

    public SaludController(IComprobadorSalud comprobadorSalud)
    {
        _comprobadorSalud = comprobadorSalud;
    }

    [HttpGet]
    public async Task<IActionResult> Obtener(CancellationToken cancellationToken)
    {
        var baseDeDatosDisponible = await _comprobadorSalud.BaseDeDatosDisponibleAsync(cancellationToken);
        if (!baseDeDatosDisponible)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { estado = "Sin conexión", baseDeDatos = "No disponible" });
        }

        return Ok(new { estado = "Disponible", baseDeDatos = "Conectada" });
    }
}
