namespace ReservaUPLA.Domain.Common;

/// <summary>
/// Mensajes de las reglas del dominio (transiciones de estado, RN-06). MensajesValidacion (Application) los
/// reexpone para que la lista de mensajes de la interfaz siga teniendo una sola fuente.
/// </summary>
public static class MensajesDominio
{
    public const string ReservaRechazadaNoSeModifica = "Una reserva rechazada no se puede modificar.";
    public const string ReservaCanceladaNoSeModifica = "Una reserva cancelada no se puede modificar.";
    public const string SoloPendienteSeApruebaORechaza = "Solo una reserva Pendiente se puede aprobar o rechazar.";
}
