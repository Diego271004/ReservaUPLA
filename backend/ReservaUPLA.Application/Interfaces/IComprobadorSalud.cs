namespace ReservaUPLA.Application.Interfaces;

public interface IComprobadorSalud
{
    Task<bool> BaseDeDatosDisponibleAsync(CancellationToken cancellationToken);
}
