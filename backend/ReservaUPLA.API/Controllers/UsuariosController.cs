using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Controllers;

/// <summary>Registro y listado de usuarios. Solo el Administrador (403 para los demás roles).</summary>
[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = Roles.Administrador)]
public sealed class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarios;

    public UsuariosController(IUsuarioService usuarios)
    {
        _usuarios = usuarios;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> Listar([FromQuery] string? rol, CancellationToken cancellationToken)
    {
        RolUsuario? filtro = null;
        if (!string.IsNullOrEmpty(rol))
        {
            if (!Enum.TryParse<RolUsuario>(rol, out var rolFiltrado) || !Enum.IsDefined(rolFiltrado))
            {
                return BadRequest();
            }
            filtro = rolFiltrado;
        }

        return Ok(await _usuarios.ListarAsync(filtro, cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<IActionResult> Crear(
        [CuerpoOpcional] CrearUsuarioDto? dto,
        CancellationToken cancellationToken)
    {
        var solicitud = this.CuerpoOVacio(dto, new CrearUsuarioDto(null, null, null, null, null));
        return this.Creado(await _usuarios.CrearAsync(solicitud, cancellationToken));
    }
}
