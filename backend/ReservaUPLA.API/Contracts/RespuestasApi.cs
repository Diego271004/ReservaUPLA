namespace ReservaUPLA.API.Contracts;

/// <summary>Cuerpo de 401 (credenciales) y 429: un único mensaje para mostrar al usuario.</summary>
public sealed record MensajeResponse(string Mensaje);
