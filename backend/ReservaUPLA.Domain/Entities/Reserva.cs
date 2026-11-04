using ReservaUPLA.Domain.Enums;

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
}
