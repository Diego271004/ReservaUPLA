using System.Text.RegularExpressions;
using FluentValidation;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.Application.Validators;

/// <summary>Reglas del correo institucional compartidas por el login y el registro de usuarios.</summary>
public static class ReglasCorreo
{
    public const int LongitudMaximaCorreo = 254;

    // Misma expresión que validators.js del frontend.
    private static readonly Regex FormatoCorreo = new(
        @"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$",
        RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    public static string DominioNormalizado(OpcionesAutenticacion opciones) =>
        opciones.DominioInstitucional.Trim().TrimStart('@').ToLowerInvariant();

    public static IRuleBuilderOptions<T, string?> ReglasDeCorreoInstitucional<T>(
        this IRuleBuilderInitial<T, string?> regla, string dominio, string mensajeVacio)
    {
        var sufijo = "@" + dominio;
        return regla
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(mensajeVacio)
            .MaximumLength(LongitudMaximaCorreo).WithMessage(MensajesValidacion.CorreoDemasiadoLargo)
            .Matches(FormatoCorreo).WithMessage(MensajesValidacion.CorreoFormatoInvalido)
            .Must(correo => correo!.EndsWith(sufijo, StringComparison.Ordinal))
                .WithMessage(MensajesValidacion.CorreoDominioNoInstitucional(dominio));
    }
}
