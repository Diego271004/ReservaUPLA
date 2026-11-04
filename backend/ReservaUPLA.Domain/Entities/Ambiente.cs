using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

public class Ambiente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public TipoAmbiente Tipo { get; set; }
    public int Capacidad { get; set; }
    public string Ubicacion { get; set; } = string.Empty;
    public EstadoAmbiente Estado { get; set; } = EstadoAmbiente.Disponible;
    public int? ResponsableId { get; set; }
}
