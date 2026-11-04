using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Reglas de entrada de la reserva: RN-02 (obligatorios), RN-03 (fin posterior al inicio) y RN-04 (07:00 a 22:00).
/// Las reglas que consultan datos (RN-01, ambiente en mantenimiento) son <see cref="Interfaces.IReglaReserva"/>.
/// </summary>
public sealed class CrearReservaValidator : AbstractValidator<CrearReservaDto>
{
    public const int LongitudMaximaMotivo = 300;

    public CrearReservaValidator()
    {
        this.ReglasDeAmbiente(dto => dto.AmbienteId);
        this.ReglasDeFecha(dto => dto.Fecha);
        this.ReglasDeHoras(dto => dto.HoraInicio, dto => dto.HoraFin);

        RuleFor(x => x.Motivo)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.MotivoVacio)
            .MaximumLength(LongitudMaximaMotivo).WithMessage(MensajesValidacion.MotivoDemasiadoLargo)
            .OverridePropertyName(CamposFormulario.Motivo);
    }
}
