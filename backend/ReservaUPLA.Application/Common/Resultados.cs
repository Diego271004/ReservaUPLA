using FluentValidation.Results;
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
    DatosInvalidos, // 400: errores por campo
    NoEncontrado, // 404
    SinPermiso, // 403
    Conflicto // 409: regla de negocio (RN-01, RN-06); lleva el mensaje para el usuario
}

/// <summary>Resultado de un caso de uso. La API solo lo traduce a HTTP; las decisiones de negocio ya están tomadas aquí.</summary>
public sealed class ResultadoOperacion<T>
{
    private static readonly IReadOnlyDictionary<string, string[]> SinErrores = new Dictionary<string, string[]>();

    public EstadoOperacion Estado { get; }
    public T? Valor { get; }
    public IReadOnlyDictionary<string, string[]> Errores { get; }
    public string? Mensaje { get; }

    private ResultadoOperacion(
        EstadoOperacion estado, T? valor, IReadOnlyDictionary<string, string[]> errores, string? mensaje)
    {
        Estado = estado;
        Valor = valor;
        Errores = errores;
        Mensaje = mensaje;
    }

    public static ResultadoOperacion<T> Exitoso(T valor) => new(EstadoOperacion.Exitoso, valor, SinErrores, null);

    public static ResultadoOperacion<T> DatosInvalidos(IReadOnlyDictionary<string, string[]> errores) =>
        new(EstadoOperacion.DatosInvalidos, default, errores, null);

    public static ResultadoOperacion<T> DatosInvalidos(string campo, string mensaje) =>
        DatosInvalidos(new Dictionary<string, string[]> { [campo] = [mensaje] });

    /// <summary>El resultado 400 con los errores por campo si la validación falló; null si los datos son válidos.</summary>
    public static ResultadoOperacion<T>? SiNoEsValido(ValidationResult validacion) =>
        validacion.IsValid ? null : DatosInvalidos(validacion.Errors.AgruparPorCampo());

    public static ResultadoOperacion<T> NoEncontrado() => new(EstadoOperacion.NoEncontrado, default, SinErrores, null);

    public static ResultadoOperacion<T> SinPermiso() => new(EstadoOperacion.SinPermiso, default, SinErrores, null);

    public static ResultadoOperacion<T> Conflicto(string mensaje) =>
        new(EstadoOperacion.Conflicto, default, SinErrores, mensaje);
}
