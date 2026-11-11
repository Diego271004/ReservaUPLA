using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ReservaUPLA.API.Contracts;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.API.Controllers;

/// <summary>Controlador delgado: delega en <see cref="IAuthService"/> y solo traduce el resultado a HTTP (200 / 400 / 401 / 429).</summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    public const string PoliticaLogin = "login";

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(PoliticaLogin)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)] // la respuesta lleva el token
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(MensajeResponse), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login(
        [CuerpoOpcional] LoginRequestDto? dto,
        CancellationToken cancellationToken)
    {
        var solicitud = this.CuerpoOVacio(dto, new LoginRequestDto(null, null));
        return this.Traducir(await _authService.IniciarSesionAsync(solicitud, cancellationToken));
    }

    [HttpGet("me")]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)] // datos personales
    [ProducesResponseType(typeof(PerfilDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<PerfilDto> Me() =>
        Ok(new PerfilDto(
            User.ObtenerUsuarioId(),
            User.FindFirst(JwtRegisteredClaimNames.Name)?.Value ?? string.Empty,
            User.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? string.Empty,
            User.ObtenerRol().ToString()));
}
