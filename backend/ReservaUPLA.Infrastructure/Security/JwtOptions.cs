using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ReservaUPLA.Infrastructure.Security;

/// <summary>Configuración del token (sección "Jwt"). La clave solo va en dotnet user-secrets.</summary>
public sealed class JwtOptions
{
    public const string Seccion = "Jwt";

    public const int BytesMinimosClave = 32;

    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public int MinutosExpiracion { get; set; } = 60;

    public SymmetricSecurityKey ObtenerClaveFirma() => new(Encoding.UTF8.GetBytes(Key));

    internal bool ClaveValida() =>
        !string.IsNullOrWhiteSpace(Key) && Encoding.UTF8.GetByteCount(Key) >= BytesMinimosClave;
}
