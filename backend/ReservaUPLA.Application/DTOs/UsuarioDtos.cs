namespace ReservaUPLA.Application.DTOs;

public sealed record CrearUsuarioDto(
    string? NombreCompleto,
    string? Correo,
    string? Rol,
    bool? Activo,
    string? Contrasena);

public sealed record UsuarioDto(int Id, string NombreCompleto, string Correo, string Rol, bool Activo);
