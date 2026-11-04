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
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] LoginRequestDto? dto,
        CancellationToken cancellationToken)
    {
        // Cuerpo vacío o JSON mal formado se tratan como campos ausentes: el usuario recibe los mensajes del validador.
        var solicitud = ModelState.IsValid && dto is not null ? dto : new LoginRequestDto(null, null);

        var resultado = await _authService.IniciarSesionAsync(solicitud, cancellationToken);

        return resultado.Estado switch
        {
            EstadoAutenticacion.Exitoso => Ok(resultado.Respuesta),
            EstadoAutenticacion.DatosInvalidos => ControllerBaseExtensions.DatosInvalidos(resultado.Errores),
            EstadoAutenticacion.CredencialesInvalidas => Unauthorized(new MensajeResponse(resultado.Mensaje!)),
            _ => throw new UnreachableException($"Estado de autenticación no contemplado: {resultado.Estado}"),
        };
    }

    [HttpGet("me")]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)] // datos personales
    [ProducesResponseType(typeof(PerfilDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<PerfilDto> Me() =>
        // Datos tomados del token (claims con nombre corto); sin consultar la base.
        Ok(new PerfilDto(
            User.ObtenerUsuarioId(),
            User.FindFirst(JwtRegisteredClaimNames.Name)?.Value ?? string.Empty,
            User.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? string.Empty,
            User.ObtenerRol().ToString()));
}
