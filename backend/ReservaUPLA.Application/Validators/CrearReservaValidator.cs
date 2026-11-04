using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Reglas de entrada de la reserva: RN-02 (obligatorios), RN-03 (fin posterior al inicio) y RN-04 (07:00 a 22:00).
/// Las reglas que consultan datos (RN-01, ambiente en mantenimiento) llegan en la Fase 6 como IReglaReserva.
/// </summary>
public sealed class CrearReservaValidator : AbstractValidator<CrearReservaDto>
{
    public const int LongitudMaximaMotivo = 300;

    public CrearReservaValidator()
    {
        RuleFor(x => x.AmbienteId)
            .NotNull().WithMessage(MensajesValidacion.AmbienteVacio)
            .OverridePropertyName(CamposFormulario.AmbienteId);

        RuleFor(x => x.Fecha)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.FechaVacia)
            .Must(fecha => HorarioReserva.TryFecha(fecha, out _)).WithMessage(MensajesValidacion.FechaFormatoInvalido)
            .OverridePropertyName(CamposFormulario.Fecha);

        RuleFor(x => x.HoraInicio)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.HoraInicioVacia)
            .Must(hora => HorarioReserva.TryHora(hora, out _)).WithMessage(MensajesValidacion.HoraInicioVacia)
            .Must(EstaDentroDelHorario).WithMessage(MensajesValidacion.HoraFueraDeHorario)
            .OverridePropertyName(CamposFormulario.HoraInicio);

        RuleFor(x => x.HoraFin)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.HoraFinVacia)
            .Must(hora => HorarioReserva.TryHora(hora, out _)).WithMessage(MensajesValidacion.HoraFinVacia)
            .Must(EstaDentroDelHorario).WithMessage(MensajesValidacion.HoraFueraDeHorario)
            .Must((dto, horaFin) => EsPosteriorAlInicio(dto.HoraInicio, horaFin))
                .WithMessage(MensajesValidacion.HoraFinNoPosterior)
            .OverridePropertyName(CamposFormulario.HoraFin);

        RuleFor(x => x.Motivo)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.MotivoVacio)
            .MaximumLength(LongitudMaximaMotivo).WithMessage(MensajesValidacion.MotivoDemasiadoLargo)
            .OverridePropertyName(CamposFormulario.Motivo);
    }

    private static bool EstaDentroDelHorario(string? texto) =>
        HorarioReserva.TryHora(texto, out var hora) && HorarioReserva.EstaDentroDelHorario(hora);

    // Si el inicio no es una hora válida el error ya está en su propio campo: aquí no se duplica.
    private static bool EsPosteriorAlInicio(string? horaInicio, string? horaFin) =>
        !HorarioReserva.TryHora(horaInicio, out var inicio)
        || !HorarioReserva.TryHora(horaFin, out var fin)
        || fin > inicio;
}
