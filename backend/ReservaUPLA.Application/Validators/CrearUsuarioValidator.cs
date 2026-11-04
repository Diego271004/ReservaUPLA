using FluentValidation;
using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>Reglas del registro de usuarios. Espera el correo normalizado y el nombre sin espacios sobrantes.</summary>
public sealed class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    public const int LongitudMaximaNombre = 120;

    public CrearUsuarioValidator(IOptions<OpcionesAutenticacion> opciones)
    {
        var dominio = ReglasCorreo.DominioNormalizado(opciones.Value);

        RuleFor(x => x.NombreCompleto)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.NombreCompletoVacio)
            .MaximumLength(LongitudMaximaNombre).WithMessage(MensajesValidacion.NombreCompletoDemasiadoLargo)
            .OverridePropertyName(CamposFormulario.NombreCompleto);

        RuleFor(x => x.Correo)
            .ReglasDeCorreoInstitucional(dominio, MensajesValidacion.CorreoUsuarioVacio)
            .OverridePropertyName(CamposFormulario.Correo);

        RuleFor(x => x.Rol)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.RolVacio)
            .Must(rol => TextosDominio.TryRol(rol, out _)).WithMessage(MensajesValidacion.RolInvalido)
            .OverridePropertyName(CamposFormulario.Rol);

        RuleFor(x => x.Contrasena)
            .ReglasDeContrasenaInicial()
            .OverridePropertyName(CamposFormulario.Contrasena);
    }
}
