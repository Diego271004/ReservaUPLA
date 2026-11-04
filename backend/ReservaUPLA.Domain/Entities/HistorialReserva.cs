using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

public class HistorialReserva
{
    public int Id { get; set; }
    public int ReservaId { get; set; }
    public EstadoReserva? EstadoAnterior { get; set; }
    public EstadoReserva EstadoNuevo { get; set; }
    public int UsuarioId { get; set; }
    public DateTimeOffset Fecha { get; set; }
}
