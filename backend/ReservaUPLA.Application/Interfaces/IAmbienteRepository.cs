using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IAmbienteRepository
{
    Task<Ambiente?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Ambiente>> ListarAsync(CancellationToken cancellationToken);
    Task AgregarAsync(Ambiente ambiente, CancellationToken cancellationToken);
}
