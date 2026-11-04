using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; }
    public bool Activo { get; set; } = true;
    public string ContrasenaHash { get; set; } = string.Empty;
}
