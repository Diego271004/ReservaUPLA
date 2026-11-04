namespace ReservaUPLA.Domain.Exceptions;

/// <summary>Una regla del dominio (por ejemplo RN-06) no permite la operación. El mensaje es el que ve el usuario.</summary>
public sealed class DomainException : Exception
{
    public DomainException(string mensaje) : base(mensaje)
    {
    }
}
