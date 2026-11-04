using System.Linq.Expressions;
using FluentValidation;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Reglas de los campos que comparten la reserva y la consulta de disponibilidad: RN-02 (obligatorios),
/// RN-03 (fin posterior al inicio) y RN-04 (07:00 a 22:00). Una sola definición para las dos pantallas.
/// </summary>
internal static class ReglasDeCamposDeReserva
{
    public static void ReglasDeAmbiente<T>(this AbstractValidator<T> validador, Expression<Func<T, int?>> ambiente) =>
        validador.RuleFor(ambiente)
            .NotNull().WithMessage(MensajesValidacion.AmbienteVacio)
            .OverridePropertyName(CamposFormulario.AmbienteId);

    public static void ReglasDeFecha<T>(this AbstractValidator<T> validador, Expression<Func<T, string?>> fecha) =>
        validador.RuleFor(fecha)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.FechaVacia)
            .Must(texto => HorarioReserva.TryFecha(texto, out _)).WithMessage(MensajesValidacion.FechaFormatoInvalido)
            .OverridePropertyName(CamposFormulario.Fecha);

    public static void ReglasDeHoras<T>(
        this AbstractValidator<T> validador, Expression<Func<T, string?>> horaInicio, Expression<Func<T, string?>> horaFin)
    {
        var inicioDe = horaInicio.Compile();

        validador.RuleFor(horaInicio)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.HoraInicioVacia)
            .Must(texto => HorarioReserva.TryHora(texto, out _)).WithMessage(MensajesValidacion.HoraInicioVacia)
            .Must(EstaDentroDelHorario).WithMessage(MensajesValidacion.HoraFueraDeHorario)
            .OverridePropertyName(CamposFormulario.HoraInicio);

        validador.RuleFor(horaFin)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(MensajesValidacion.HoraFinVacia)
            .Must(texto => HorarioReserva.TryHora(texto, out _)).WithMessage(MensajesValidacion.HoraFinVacia)
            .Must(EstaDentroDelHorario).WithMessage(MensajesValidacion.HoraFueraDeHorario)
            .Must((dto, fin) => EsPosteriorAlInicio(inicioDe(dto), fin)).WithMessage(MensajesValidacion.HoraFinNoPosterior)
            .OverridePropertyName(CamposFormulario.HoraFin);
    }

    private static bool EstaDentroDelHorario(string? texto) =>
        HorarioReserva.TryHora(texto, out var hora) && HorarioReserva.EstaDentroDelHorario(hora);

    // Si el inicio no es una hora válida el error ya está en su propio campo: aquí no se duplica.
    private static bool EsPosteriorAlInicio(string? horaInicio, string? horaFin) =>
        !HorarioReserva.TryHora(horaInicio, out var inicio)
        || !HorarioReserva.TryHora(horaFin, out var fin)
        || fin > inicio;
}
