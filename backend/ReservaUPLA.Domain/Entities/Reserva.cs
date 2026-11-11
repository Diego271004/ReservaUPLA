using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Domain.Exceptions;

namespace ReservaUPLA.Domain.Entities;

public class Reserva
{
    public int Id { get; set; }
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public EstadoReserva Estado { get; set; } = EstadoReserva.Pendiente;
    public int UsuarioId { get; set; }
    public int AmbienteId { get; set; }
    public DateTimeOffset FechaCreacion { get; set; }

    public List<HistorialReserva> Historial { get; set; } = new();

    public static Reserva Crear(
        DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, string motivo, int usuarioId, int ambienteId, DateTimeOffset ahora)
    {
        var reserva = new Reserva
        {
            Fecha = fecha,
            HoraInicio = horaInicio,
            HoraFin = horaFin,
            Motivo = motivo,
            Estado = EstadoReserva.Pendiente,
            UsuarioId = usuarioId,
            AmbienteId = ambienteId,
        };
        reserva.RegistrarEvento(null, EstadoReserva.Pendiente, usuarioId, ahora);
        return reserva;
    }

    /// <summary>Pendiente → Aprobada. Solo la decide el Administrador (RN-05, lo comprueba el servicio).</summary>
    public void Aprobar(int usuarioId, DateTimeOffset ahora)
    {
        ExigirPendiente();
        CambiarEstado(EstadoReserva.Aprobada, usuarioId, ahora);
    }

    public void Rechazar(int usuarioId, DateTimeOffset ahora)
    {
        ExigirPendiente();
        CambiarEstado(EstadoReserva.Rechazada, usuarioId, ahora);
    }

    public void Cancelar(int usuarioId, DateTimeOffset ahora)
    {
        ExigirNoFinal();
        CambiarEstado(EstadoReserva.Cancelada, usuarioId, ahora);
    }

    // RN-06: Rechazada y Cancelada son estados finales; ninguna operación los modifica.
    private void ExigirNoFinal()
    {
        switch (Estado)
        {
            case EstadoReserva.Rechazada:
                throw new DomainException(MensajesDominio.ReservaRechazadaNoSeModifica);
            case EstadoReserva.Cancelada:
                throw new DomainException(MensajesDominio.ReservaCanceladaNoSeModifica);
        }
    }

    private void ExigirPendiente()
    {
        ExigirNoFinal();
        if (Estado != EstadoReserva.Pendiente)
        {
            throw new DomainException(MensajesDominio.SoloPendienteSeApruebaORechaza);
        }
    }

    private void CambiarEstado(EstadoReserva nuevo, int usuarioId, DateTimeOffset ahora)
    {
        var anterior = Estado;
        Estado = nuevo;
        RegistrarEvento(anterior, nuevo, usuarioId, ahora);
    }

    private void RegistrarEvento(EstadoReserva? anterior, EstadoReserva nuevo, int usuarioId, DateTimeOffset ahora) =>
        Historial.Add(new HistorialReserva
        {
            ReservaId = Id,
            EstadoAnterior = anterior,
            EstadoNuevo = nuevo,
            UsuarioId = usuarioId,
            Fecha = ahora,
        });
}
