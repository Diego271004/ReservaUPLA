using FluentValidation;
using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Reglas de entrada del login. Espera el correo ya normalizado. Cada campo muestra solo su primer error.
/// No valida la política de la contraseña (eso revelaría las reglas de las contraseñas nuevas).
/// </summary>
public sealed class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator(IOptions<OpcionesAutenticacion> opciones)
    {
        var dominio = ReglasCorreo.DominioNormalizado(opciones.Value);

        RuleFor(x => x.Correo)
            .ReglasDeCorreoInstitucional(dominio, MensajesValidacion.CorreoVacio)
            .OverridePropertyName(CamposFormulario.Correo);

        RuleFor(x => x.Contrasena)
            .ReglasAlIniciarSesion()
            .OverridePropertyName(CamposFormulario.Contrasena);
    }
}
