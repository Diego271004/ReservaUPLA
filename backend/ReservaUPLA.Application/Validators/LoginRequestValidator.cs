using FluentValidation;
using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Reglas de entrada del login. Espera el correo ya normalizado. Cada campo muestra solo su primer error.
/// No valida la complejidad de la contraseña: eso revelaría la política (pendiente U2).
/// </summary>
public sealed class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public const int LongitudMaximaContrasena = 128;

    public LoginRequestValidator(IOptions<OpcionesAutenticacion> opciones)
    {
        var dominio = ReglasCorreo.DominioNormalizado(opciones.Value);

        RuleFor(x => x.Correo)
            .ReglasDeCorreoInstitucional(dominio, MensajesValidacion.CorreoVacio)
            .OverridePropertyName(CamposFormulario.Correo);

        RuleFor(x => x.Contrasena)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.ContrasenaVacia)
            .MaximumLength(LongitudMaximaContrasena).WithMessage(MensajesValidacion.ContrasenaDemasiadoLarga)
            .OverridePropertyName(CamposFormulario.Contrasena);
    }
}
