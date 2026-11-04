using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Security;

/// <summary>
/// Emite el JWT de sesión (HMAC-SHA256). Los claims llevan nombre corto para que GET /api/auth/me
/// responda sin consultar la base de datos; el rol viaja en el claim "rol".
/// </summary>
public sealed class JwtTokenGenerator : ITokenGenerator
{
    public const string ClaimRol = "rol";

    private readonly JwtOptions _opciones;
    private readonly TimeProvider _reloj;
    private readonly SigningCredentials _credenciales;

    public JwtTokenGenerator(IOptions<JwtOptions> opciones, TimeProvider reloj)
    {
        _opciones = opciones.Value;
        _reloj = reloj;
        _credenciales = new SigningCredentials(_opciones.ObtenerClaveFirma(), SecurityAlgorithms.HmacSha256);
    }

    public (string token, DateTime expiraEn) Generar(Usuario usuario)
    {
        ArgumentNullException.ThrowIfNull(usuario);

        // El claim exp tiene precisión de segundos: se trunca para que expiraEn coincida.
        var ahora = TruncarASegundos(_reloj.GetUtcNow().UtcDateTime);
        var expiraEn = ahora.AddMinutes(_opciones.MinutosExpiracion);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Correo),
            new(JwtRegisteredClaimNames.Name, usuario.NombreCompleto),
            new(ClaimRol, usuario.Rol.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _opciones.Issuer,
            audience: _opciones.Audience,
            claims: claims,
            notBefore: ahora,
            expires: expiraEn,
            signingCredentials: _credenciales);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiraEn);
    }

    private static DateTime TruncarASegundos(DateTime fecha) =>
        new(fecha.Ticks - fecha.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);
}
