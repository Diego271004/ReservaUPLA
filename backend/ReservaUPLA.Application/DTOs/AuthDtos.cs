namespace ReservaUPLA.Application.DTOs;

/// <summary>Los campos son anulables para que un cuerpo vacío llegue al validador y reciba mensajes propios.</summary>
public sealed record LoginRequestDto(string? Correo, string? Contrasena);

public sealed record LoginResponseDto(string Token, string NombreCompleto, string Rol, DateTime ExpiraEn);

/// <summary>Datos de la sesión actual, tomados del token.</summary>
public sealed record PerfilDto(int Id, string NombreCompleto, string Correo, string Rol);
