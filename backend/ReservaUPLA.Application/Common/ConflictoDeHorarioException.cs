namespace ReservaUPLA.Application.Common;

/// <summary>
/// La base de datos rechazó guardar porque se cruzaría con una reserva Aprobada del mismo ambiente
/// (restricción de exclusión, SQLSTATE 23P01). Es la última barrera de RN-01: dos aprobaciones simultáneas
/// pasan la comprobación del servicio y solo una sobrevive aquí. El repositorio la lanza; el servicio la
/// convierte en el mensaje de conflicto, nunca en un error 500.
/// </summary>
public sealed class ConflictoDeHorarioException : Exception
{
    public ConflictoDeHorarioException(Exception causa) : base(MensajesValidacion.ConflictoDeHorarioSinDetalle, causa)
    {
    }
}
