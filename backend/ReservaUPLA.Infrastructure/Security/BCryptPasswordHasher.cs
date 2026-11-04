using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.Infrastructure.Security;

/// <summary>
/// Hash de contraseñas con BCrypt (costo 11). Verifica también los hashes $2a$ que genera pgcrypto
/// con crypt(..., gen_salt('bf', 11)) en database/05_datos_prueba.sql.
/// </summary>
public sealed class BCryptPasswordHasher : IPasswordHasher
{
    public const int FactorTrabajo = 11;

    public string Hash(string contrasena) => BCrypt.Net.BCrypt.HashPassword(contrasena, FactorTrabajo);

    public bool Verificar(string contrasena, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(contrasena, hash);
        }
        catch (Exception ex) when (ex is BCrypt.Net.SaltParseException or ArgumentException)
        {
            // Un hash dañado en la base se trata como credenciales inválidas, nunca como error 500.
            return false;
        }
    }
}
