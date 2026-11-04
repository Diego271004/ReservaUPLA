using FluentValidation;
using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>Reglas del registro de usuarios. Espera el correo normalizado y el nombre sin espacios sobrantes.</summary>
public sealed class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    public const int LongitudMaximaNombre = 120;

    // Política de la contraseña inicial (cierra el hallazgo U2): de 8 a 72 caracteres, con al menos una letra y un número.
    // El máximo es además el límite técnico de BCrypt (72 bytes).
    public const int LongitudMinimaContrasena = 8;
    public const int LongitudMaximaContrasena = 72;

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
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.ContrasenaInicialVacia)
            .MaximumLength(LongitudMaximaContrasena).WithMessage(MensajesValidacion.ContrasenaInicialDemasiadoLarga)
            .Must(CumpleLaPolitica).WithMessage(MensajesValidacion.ContrasenaInicialRequisitos)
            .OverridePropertyName(CamposFormulario.Contrasena);
    }

    private static bool CumpleLaPolitica(string? contrasena) =>
        contrasena is { Length: >= LongitudMinimaContrasena }
        && contrasena.Any(char.IsLetter)
        && contrasena.Any(char.IsDigit);
}
