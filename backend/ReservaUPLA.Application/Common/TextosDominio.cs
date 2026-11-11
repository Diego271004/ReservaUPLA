using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Common;

/// <summary>
/// Conversión entre los enumerados del dominio y los textos de la API y la base de datos.
/// Es la única fuente de esos textos ("En mantenimiento" lleva espacios, por eso no sirve ToString()).
/// </summary>
public static class TextosDominio
{
    public const string EnMantenimiento = "En mantenimiento";

    public static readonly IReadOnlyList<string> Roles = Enum.GetNames<RolUsuario>();
    public static readonly IReadOnlyList<string> Tipos = Enum.GetNames<TipoAmbiente>();
    public static readonly IReadOnlyList<string> EstadosAmbiente = [nameof(EstadoAmbiente.Disponible), EnMantenimiento];

    public static string ATexto(EstadoAmbiente estado) =>
        estado == EstadoAmbiente.EnMantenimiento ? EnMantenimiento : nameof(EstadoAmbiente.Disponible);

    public static bool TryEstadoAmbiente(string? texto, out EstadoAmbiente estado)
    {
        estado = EstadoAmbiente.Disponible;
        if (texto == nameof(EstadoAmbiente.Disponible))
        {
            return true;
        }
        if (texto == EnMantenimiento)
        {
            estado = EstadoAmbiente.EnMantenimiento;
            return true;
        }
        return false;
    }

    public static bool TryRol(string? texto, out RolUsuario rol) =>
        TryEnum(texto, Roles, out rol);

    public static bool TryTipo(string? texto, out TipoAmbiente tipo) =>
        TryEnum(texto, Tipos, out tipo);

    private static bool TryEnum<T>(string? texto, IReadOnlyList<string> validos, out T valor) where T : struct, Enum
    {
        valor = default;
        return texto is not null && validos.Contains(texto) && Enum.TryParse(texto, out valor);
    }
}
