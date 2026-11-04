using FluentValidation;
using ReservaUPLA.Application.DTOs;

namespace ReservaUPLA.Application.Validators;

/// <summary>Reglas de entrada de la consulta de disponibilidad: las mismas de la reserva sin el motivo (RN-02, RN-03, RN-04).</summary>
public sealed class ConsultarDisponibilidadValidator : AbstractValidator<ConsultarDisponibilidadDto>
{
    public ConsultarDisponibilidadValidator()
    {
        this.ReglasDeAmbiente(dto => dto.AmbienteId);
        this.ReglasDeFecha(dto => dto.Fecha);
        this.ReglasDeHoras(dto => dto.HoraInicio, dto => dto.HoraFin);
    }
}
