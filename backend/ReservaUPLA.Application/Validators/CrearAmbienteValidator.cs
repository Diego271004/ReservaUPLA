using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>Reglas del registro de ambientes. Espera los textos sin espacios sobrantes.</summary>
public sealed class CrearAmbienteValidator : AbstractValidator<CrearAmbienteDto>
{
    public const int LongitudMaximaNombre = 120;
    public const int LongitudMaximaUbicacion = 160;
    public const int CapacidadMaxima = 5000;

    public CrearAmbienteValidator()
    {
        RuleFor(x => x.Nombre)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.NombreAmbienteVacio)
            .MaximumLength(LongitudMaximaNombre).WithMessage(MensajesValidacion.NombreAmbienteDemasiadoLargo)
            .OverridePropertyName(CamposFormulario.Nombre);

        RuleFor(x => x.Tipo)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.TipoVacio)
            .Must(tipo => TextosDominio.TryTipo(tipo, out _)).WithMessage(MensajesValidacion.TipoInvalido)
            .OverridePropertyName(CamposFormulario.Tipo);

        RuleFor(x => x.Capacidad)
            .Cascade(CascadeMode.Stop)
            .NotNull().WithMessage(MensajesValidacion.CapacidadVacia)
            .Must(capacidad => capacidad is > 0 and <= CapacidadMaxima).WithMessage(MensajesValidacion.CapacidadInvalida)
            .OverridePropertyName(CamposFormulario.Capacidad);

        RuleFor(x => x.Ubicacion)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.UbicacionVacia)
            .MaximumLength(LongitudMaximaUbicacion).WithMessage(MensajesValidacion.UbicacionDemasiadoLarga)
            .OverridePropertyName(CamposFormulario.Ubicacion);

        RuleFor(x => x.Estado)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.EstadoAmbienteVacio)
            .Must(estado => TextosDominio.TryEstadoAmbiente(estado, out _)).WithMessage(MensajesValidacion.EstadoAmbienteInvalido)
            .OverridePropertyName(CamposFormulario.Estado);
    }
}
