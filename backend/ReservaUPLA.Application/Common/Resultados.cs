using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Common;

public enum EstadoAutenticacion
{
    Exitoso,
    CredencialesInvalidas,
    DatosInvalidos
}

/// <summary>Resultado del inicio de sesión. La API solo lo traduce a HTTP (200 / 401 / 400).</summary>
public sealed class ResultadoAutenticacion
{
    private static readonly IReadOnlyDictionary<string, string[]> SinErrores = new Dictionary<string, string[]>();

    public EstadoAutenticacion Estado { get; }
    public LoginResponseDto? Respuesta { get; }
    public string? Mensaje { get; }

    /// <summary>Errores por campo (clave: <see cref="CamposFormulario"/>). Vacío salvo en DatosInvalidos.</summary>
    public IReadOnlyDictionary<string, string[]> Errores { get; }

    private ResultadoAutenticacion(
        EstadoAutenticacion estado,
        LoginResponseDto? respuesta,
        string? mensaje,
        IReadOnlyDictionary<string, string[]> errores)
    {
        Estado = estado;
        Respuesta = respuesta;
        Mensaje = mensaje;
        Errores = errores;
    }

    public static ResultadoAutenticacion Exitoso(LoginResponseDto respuesta) =>
        new(EstadoAutenticacion.Exitoso, respuesta, null, SinErrores);

    /// <summary>Mismo resultado para usuario inexistente, inactivo o contraseña errónea.</summary>
    public static ResultadoAutenticacion CredencialesInvalidas() =>
        new(EstadoAutenticacion.CredencialesInvalidas, null, MensajesValidacion.CredencialesInvalidas, SinErrores);

    public static ResultadoAutenticacion DatosInvalidos(IReadOnlyDictionary<string, string[]> errores) =>
        new(EstadoAutenticacion.DatosInvalidos, null, null, errores);
}

public enum EstadoOperacion
{
    Exitoso,
    DatosInvalidos
}

/// <summary>Resultado de un caso de uso que crea o consulta datos; los errores se agrupan por campo.</summary>
public sealed class ResultadoOperacion<T>
{
    private static readonly IReadOnlyDictionary<string, string[]> SinErrores = new Dictionary<string, string[]>();

    public EstadoOperacion Estado { get; }
    public T? Valor { get; }
    public IReadOnlyDictionary<string, string[]> Errores { get; }

    private ResultadoOperacion(EstadoOperacion estado, T? valor, IReadOnlyDictionary<string, string[]> errores)
    {
        Estado = estado;
        Valor = valor;
        Errores = errores;
    }

    public static ResultadoOperacion<T> Exitoso(T valor) => new(EstadoOperacion.Exitoso, valor, SinErrores);

    public static ResultadoOperacion<T> DatosInvalidos(IReadOnlyDictionary<string, string[]> errores) =>
        new(EstadoOperacion.DatosInvalidos, default, errores);

    public static ResultadoOperacion<T> DatosInvalidos(string campo, string mensaje) =>
        DatosInvalidos(new Dictionary<string, string[]> { [campo] = [mensaje] });
}
