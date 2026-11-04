using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Reglas;

/// <summary>Un ambiente que no está Disponible (por ejemplo, en mantenimiento) no admite reservas nuevas.</summary>
public sealed class ReglaAmbienteDisponible : IReglaReserva
{
    public Task<ViolacionDeRegla?> EvaluarAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken)
    {
        ViolacionDeRegla? violacion = ambiente.Estado == EstadoAmbiente.Disponible
            ? null
            : ViolacionDeRegla.EnCampo(CamposFormulario.AmbienteId, MensajesValidacion.AmbienteEnMantenimiento);
        return Task.FromResult(violacion);
    }
}

/// <summary>RN-01: no puede haber dos reservas Aprobadas del mismo ambiente que se crucen. Las Pendientes sí pueden coexistir.</summary>
public sealed class ReglaSinCruceConAprobadas : IReglaReserva
{
    private readonly ComprobadorDeHorario _comprobador;

    public ReglaSinCruceConAprobadas(ComprobadorDeHorario comprobador)
    {
        _comprobador = comprobador;
    }

    public async Task<ViolacionDeRegla?> EvaluarAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken)
    {
        var mensaje = await _comprobador.MensajeDeConflictoAsync(reserva, cancellationToken);
        return mensaje is null ? null : ViolacionDeRegla.Conflicto(mensaje);
    }
}
