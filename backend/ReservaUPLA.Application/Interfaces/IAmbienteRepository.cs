using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IAmbienteRepository
{
    Task<Ambiente?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Ambiente>> ListarAsync(CancellationToken cancellationToken);
    Task<bool> ExisteNombreAsync(string nombre, CancellationToken cancellationToken);

    /// <summary>Guarda el ambiente y completa su Id.</summary>
    Task AgregarAsync(Ambiente ambiente, CancellationToken cancellationToken);
}
