using FluentValidation;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.Application.Validators;

/// <summary>Las reglas de contraseña, definidas una sola vez y usadas por los validadores que las necesitan.</summary>
public static class ReglasDeContrasena
{
    /// <summary>Contraseña al iniciar sesión: solo vacía y largo máximo; no se revela la política de las contraseñas nuevas.</summary>
    public const int LongitudMaximaAlIniciarSesion = 128;

    /// <summary>
    /// Política de la contraseña inicial (cierra el hallazgo U2): de 8 a 72 caracteres, con al menos una letra y un número.
    /// El máximo es además el límite técnico de BCrypt (72 bytes).
    /// </summary>
    public const int LongitudMinimaInicial = 8;
    public const int LongitudMaximaInicial = 72;

    public static IRuleBuilderOptions<T, string?> ReglasAlIniciarSesion<T>(this IRuleBuilderInitial<T, string?> regla) =>
        regla
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.ContrasenaVacia)
            .MaximumLength(LongitudMaximaAlIniciarSesion).WithMessage(MensajesValidacion.ContrasenaDemasiadoLarga);

    public static IRuleBuilderOptions<T, string?> ReglasDeContrasenaInicial<T>(this IRuleBuilderInitial<T, string?> regla) =>
        regla
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.ContrasenaInicialVacia)
            .MaximumLength(LongitudMaximaInicial).WithMessage(MensajesValidacion.ContrasenaInicialDemasiadoLarga)
            .Must(CumpleLaPolitica).WithMessage(MensajesValidacion.ContrasenaInicialRequisitos);

    private static bool CumpleLaPolitica(string? contrasena) =>
        contrasena is { Length: >= LongitudMinimaInicial }
        && contrasena.Any(char.IsLetter)
        && contrasena.Any(char.IsDigit);
}
