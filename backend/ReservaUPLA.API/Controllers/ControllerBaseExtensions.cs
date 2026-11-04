using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.API.Controllers;

/// <summary>Nombres de rol para [Authorize(Roles = ...)]: coinciden con los valores del enumerado RolUsuario.</summary>
public static class Roles
{
    public const string Administrador = nameof(RolUsuario.Administrador);
    public const string Solicitante = nameof(RolUsuario.Solicitante);
    public const string AdministradorOSolicitante = Administrador + "," + Solicitante;
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

    /// <summary>Traduce el resultado de un caso de uso: éxito según <paramref name="exito"/>, o 400 con los errores por campo.</summary>
    public static IActionResult Traducir<T>(
        this ControllerBase controlador, ResultadoOperacion<T> resultado, Func<T, IActionResult> exito) =>
        resultado.Estado switch
        {
            EstadoOperacion.Exitoso => exito(resultado.Valor!),
            EstadoOperacion.DatosInvalidos => DatosInvalidos(resultado.Errores),
            _ => throw new InvalidOperationException($"Estado de operación no contemplado: {resultado.Estado}"),
        };
}
