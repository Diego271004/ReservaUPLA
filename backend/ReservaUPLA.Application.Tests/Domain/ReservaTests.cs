using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Domain.Exceptions;

namespace ReservaUPLA.Application.Tests.Domain;

/// <summary>Transiciones de estado de la reserva (docs/01-analisis.md, sección 5) y RN-06.</summary>
public class ReservaTests
{
    private static readonly DateTimeOffset Ahora = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);
    private const int Solicitante = 2;
    private const int Administrador = 1;

    private static Reserva NuevaPendiente() =>
        Reserva.Crear(new DateOnly(2026, 11, 5), new TimeOnly(10, 0), new TimeOnly(12, 0), "Práctica", Solicitante, 7, Ahora);

    /// <summary>Lleva una reserva nueva al estado indicado usando solo las transiciones permitidas.</summary>
    private static Reserva EnEstado(EstadoReserva estado)
    {
        var reserva = NuevaPendiente();
        switch (estado)
        {
            case EstadoReserva.Aprobada:
                reserva.Aprobar(Administrador, Ahora);
                break;
            case EstadoReserva.Rechazada:
                reserva.Rechazar(Administrador, Ahora);
                break;
            case EstadoReserva.Cancelada:
                reserva.Cancelar(Solicitante, Ahora);
                break;
        }
        return reserva;
    }

    [Fact]
    public void Crear_deja_la_reserva_Pendiente_con_su_primer_evento_de_historial()
    {
        var reserva = NuevaPendiente();

        Assert.Equal(EstadoReserva.Pendiente, reserva.Estado);
        Assert.Equal(7, reserva.AmbienteId);
        Assert.Equal(Solicitante, reserva.UsuarioId);
        var evento = Assert.Single(reserva.Historial);
        Assert.Null(evento.EstadoAnterior);
        Assert.Equal(EstadoReserva.Pendiente, evento.EstadoNuevo);
        Assert.Equal(Solicitante, evento.UsuarioId);
        Assert.Equal(Ahora, evento.Fecha);
    }

    [Theory]
    [InlineData(EstadoReserva.Pendiente, EstadoReserva.Aprobada)]
    [InlineData(EstadoReserva.Pendiente, EstadoReserva.Rechazada)]
    [InlineData(EstadoReserva.Pendiente, EstadoReserva.Cancelada)]
    [InlineData(EstadoReserva.Aprobada, EstadoReserva.Cancelada)]
    public void Las_transiciones_permitidas_cambian_el_estado_y_agregan_un_evento(EstadoReserva desde, EstadoReserva hacia)
    {
        var reserva = EnEstado(desde);
        var eventosAntes = reserva.Historial.Count;

        Transicionar(reserva, hacia, Administrador);

        Assert.Equal(hacia, reserva.Estado);
        Assert.Equal(eventosAntes + 1, reserva.Historial.Count);
        var evento = reserva.Historial.Last();
        Assert.Equal(desde, evento.EstadoAnterior);
        Assert.Equal(hacia, evento.EstadoNuevo);
        Assert.Equal(Administrador, evento.UsuarioId);
        Assert.Equal(Ahora, evento.Fecha);
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada, EstadoReserva.Aprobada, MensajesDominio.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Rechazada, EstadoReserva.Rechazada, MensajesDominio.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Rechazada, EstadoReserva.Cancelada, MensajesDominio.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, EstadoReserva.Aprobada, MensajesDominio.ReservaCanceladaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, EstadoReserva.Rechazada, MensajesDominio.ReservaCanceladaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, EstadoReserva.Cancelada, MensajesDominio.ReservaCanceladaNoSeModifica)]
    public void RN06_los_estados_finales_no_admiten_ninguna_transicion(EstadoReserva desde, EstadoReserva intento, string mensaje)
    {
        var reserva = EnEstado(desde);
        var eventosAntes = reserva.Historial.Count;

        var error = Assert.Throws<DomainException>(() => Transicionar(reserva, intento, Administrador));

        Assert.Equal(mensaje, error.Message);
        Assert.Equal(desde, reserva.Estado);
        Assert.Equal(eventosAntes, reserva.Historial.Count);
    }

    [Theory]
    [InlineData(EstadoReserva.Aprobada)]
    public void Una_reserva_Aprobada_no_se_aprueba_ni_se_rechaza_otra_vez(EstadoReserva estado)
    {
        var reserva = EnEstado(estado);

        var alAprobar = Assert.Throws<DomainException>(() => reserva.Aprobar(Administrador, Ahora));
        var alRechazar = Assert.Throws<DomainException>(() => reserva.Rechazar(Administrador, Ahora));

        Assert.Equal(MensajesDominio.SoloPendienteSeApruebaORechaza, alAprobar.Message);
        Assert.Equal(MensajesDominio.SoloPendienteSeApruebaORechaza, alRechazar.Message);
        Assert.Equal(EstadoReserva.Aprobada, reserva.Estado);
    }

    [Fact]
    public void El_historial_conserva_el_orden_de_los_eventos()
    {
        var reserva = NuevaPendiente();
        reserva.Aprobar(Administrador, Ahora.AddMinutes(5));
        reserva.Cancelar(Solicitante, Ahora.AddMinutes(10));

        Assert.Equal(
            [EstadoReserva.Pendiente, EstadoReserva.Aprobada, EstadoReserva.Cancelada],
            reserva.Historial.Select(evento => evento.EstadoNuevo).ToArray());
    }

    private static void Transicionar(Reserva reserva, EstadoReserva hacia, int usuarioId)
    {
        switch (hacia)
        {
            case EstadoReserva.Aprobada:
                reserva.Aprobar(usuarioId, Ahora);
                break;
            case EstadoReserva.Rechazada:
                reserva.Rechazar(usuarioId, Ahora);
                break;
            case EstadoReserva.Cancelada:
                reserva.Cancelar(usuarioId, Ahora);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(hacia));
        }
    }
}
