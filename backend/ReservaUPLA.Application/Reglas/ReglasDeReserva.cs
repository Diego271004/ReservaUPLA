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

/// <summary>
/// RN-07 (regla agregada): no se reserva para una fecha anterior a hoy. "Hoy" es la fecha de Lima (UTC-5, sin
/// horario de verano), la misma que ve el usuario en el calendario.
/// </summary>
public sealed class ReglaFechaNoPasada : IReglaReserva
{
    private static readonly TimeSpan DesfaseDeLima = TimeSpan.FromHours(-5);

    private readonly TimeProvider _reloj;

    public ReglaFechaNoPasada(TimeProvider reloj)
    {
        _reloj = reloj;
    }

    public Task<ViolacionDeRegla?> EvaluarAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken)
    {
        var hoy = DateOnly.FromDateTime(_reloj.GetUtcNow().ToOffset(DesfaseDeLima).DateTime);
        ViolacionDeRegla? violacion = reserva.Fecha >= hoy
            ? null
            : ViolacionDeRegla.EnCampo(CamposFormulario.Fecha, MensajesValidacion.FechaPasada);
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
