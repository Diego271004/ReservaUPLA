using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Validators;

/// <summary>
/// Filtros del listado de Reservas. Todos son opcionales; los que llegan deben ser válidos: un estado de la lista,
/// fechas aaaa-mm-dd, una fecha final que no sea anterior a la inicial y una página de 1 en adelante.
/// </summary>
public sealed class ConsultaReservasValidator : AbstractValidator<ConsultaReservasDto>
{
    public ConsultaReservasValidator()
    {
        RuleFor(x => x.Estado)
            .Must(EsUnEstadoDeLaLista).WithMessage(MensajesValidacion.EstadoFiltroInvalido)
            .When(x => x.Estado is not null)
            .OverridePropertyName(CamposFormulario.Estado);

        RuleFor(x => x.Desde)
            .Must(texto => HorarioReserva.TryFecha(texto, out _)).WithMessage(MensajesValidacion.FechaFormatoInvalido)
            .When(x => x.Desde is not null)
            .OverridePropertyName(CamposFormulario.Desde);

        RuleFor(x => x.Hasta)
            .Cascade(CascadeMode.Stop)
            .Must(texto => HorarioReserva.TryFecha(texto, out _)).WithMessage(MensajesValidacion.FechaFormatoInvalido)
            .Must((dto, hasta) => NoEsAnteriorALaInicial(dto.Desde, hasta)).WithMessage(MensajesValidacion.RangoDeFechasInvalido)
            .When(x => x.Hasta is not null)
            .OverridePropertyName(CamposFormulario.Hasta);

        RuleFor(x => x.Pagina)
            .GreaterThanOrEqualTo(1).WithMessage(MensajesValidacion.PaginaInvalida)
            .When(x => x.Pagina is not null)
            .OverridePropertyName(CamposFormulario.Pagina);
    }

    // Se compara con el texto exacto del enumerado: "pendiente " o "Vencida" no son estados.
    private static bool EsUnEstadoDeLaLista(string? texto) =>
        texto is not null && Enum.GetNames<EstadoReserva>().Contains(texto, StringComparer.Ordinal);

    // Si la fecha inicial no es válida el error ya está en su campo: aquí no se duplica.
    private static bool NoEsAnteriorALaInicial(string? desde, string? hasta) =>
        !HorarioReserva.TryFecha(desde, out var inicio)
        || !HorarioReserva.TryFecha(hasta, out var fin)
        || fin >= inicio;
}
