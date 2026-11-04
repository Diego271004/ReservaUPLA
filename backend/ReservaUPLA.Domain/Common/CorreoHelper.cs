namespace ReservaUPLA.Domain.Common;

/// <summary>Única fuente de la normalización del correo (igual que la restricción de la base: LOWER(TRIM(correo))).</summary>
public static class CorreoHelper
{
    public static string Normalizar(string? correo) => (correo ?? string.Empty).Trim().ToLowerInvariant();
}
