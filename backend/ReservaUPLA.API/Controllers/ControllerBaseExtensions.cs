using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using ReservaUPLA.API.Contracts;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.API.Controllers;

/// <summary>Nombres de rol para [Authorize(Roles = ...)]: coinciden con los valores del enumerado RolUsuario.</summary>
public static class Roles
{
    public const string Administrador = nameof(RolUsuario.Administrador);
    public const string Solicitante = nameof(RolUsuario.Solicitante);
    public const string Responsable = nameof(RolUsuario.Responsable);
    public const string AdministradorOSolicitante = Administrador + "," + Solicitante;
}

/// <summary>[FromBody] que permite el cuerpo vacío: el controlador lo trata como datos ausentes y recibe los mensajes del validador.</summary>
[AttributeUsage(AttributeTargets.Parameter)]
public sealed class CuerpoOpcionalAttribute : FromBodyAttribute
{
    public CuerpoOpcionalAttribute()
    {
        EmptyBodyBehavior = EmptyBodyBehavior.Allow;
    }
}

public static class ControllerBaseExtensions
{
    private const string TipoBadRequest = "https://tools.ietf.org/html/rfc9110#section-15.5.1";
    private const string TituloDatosInvalidos = "Revisa los datos ingresados.";

    public static int ObtenerUsuarioId(this ClaimsPrincipal usuario) =>
        int.Parse(usuario.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);

    public static RolUsuario ObtenerRol(this ClaimsPrincipal usuario) =>
        Enum.Parse<RolUsuario>(usuario.FindFirst(JwtTokenGenerator.ClaimRol)!.Value);

    /// <summary>400 con ValidationProblemDetails: un arreglo de mensajes por campo (camelCase).</summary>
    public static BadRequestObjectResult DatosInvalidos(IReadOnlyDictionary<string, string[]> errores)
    {
        var problema = new ValidationProblemDetails(errores.ToDictionary(error => error.Key, error => error.Value))
        {
            Type = TipoBadRequest,
            Title = TituloDatosInvalidos,
            Status = StatusCodes.Status400BadRequest,
        };
        return new BadRequestObjectResult(problema) { ContentTypes = { "application/problem+json" } };
    }

    public static ActorDto ObtenerActor(this ClaimsPrincipal usuario) => new(usuario.ObtenerUsuarioId(), usuario.ObtenerRol());

    /// <summary>
    /// Traduce el resultado de un caso de uso: éxito según <paramref name="exito"/>, 400 con los errores por campo,
    /// 403, 404 (ProblemDetails sin cuerpo propio) o 409 con el mensaje de la regla de negocio.
    /// </summary>
    public static IActionResult Traducir<T>(
        this ControllerBase controlador, ResultadoOperacion<T> resultado, Func<T, IActionResult> exito) =>
        resultado.Estado switch
        {
            EstadoOperacion.Exitoso => exito(resultado.Valor!),
            EstadoOperacion.DatosInvalidos => DatosInvalidos(resultado.Errores),
            EstadoOperacion.NoEncontrado => controlador.NotFound(),
            EstadoOperacion.SinPermiso => controlador.StatusCode(StatusCodes.Status403Forbidden),
            EstadoOperacion.Conflicto => controlador.Conflict(new MensajeResponse(resultado.Mensaje!)),
            _ => throw new InvalidOperationException($"Estado de operación no contemplado: {resultado.Estado}"),
        };


    /// <summary>El cuerpo recibido, o <paramref name="vacio"/> (todos los campos ausentes) si no llegó o tenía un JSON mal formado.</summary>
    public static T CuerpoOVacio<T>(this ControllerBase controlador, T? dto, T vacio) where T : class =>
        controlador.ModelState.IsValid && dto is not null ? dto : vacio;

    /// <summary>201 con el recurso creado, o el 400 / 403 / 404 / 409 que corresponda.</summary>
    public static IActionResult Creado<T>(this ControllerBase controlador, ResultadoOperacion<T> resultado) =>
        controlador.Traducir(resultado, valor => controlador.StatusCode(StatusCodes.Status201Created, valor));

    /// <summary>Traduce el resultado del login: 200 con el token, 400 con errores por campo o 401 con el mensaje genérico.</summary>
    public static IActionResult Traducir(this ControllerBase controlador, ResultadoAutenticacion resultado) =>
        resultado.Estado switch
        {
            EstadoAutenticacion.Exitoso => controlador.Ok(resultado.Respuesta),
            EstadoAutenticacion.DatosInvalidos => DatosInvalidos(resultado.Errores),
            EstadoAutenticacion.CredencialesInvalidas => controlador.Unauthorized(new MensajeResponse(resultado.Mensaje!)),
            _ => throw new UnreachableException($"Estado de autenticación no contemplado: {resultado.Estado}"),
        };
}
