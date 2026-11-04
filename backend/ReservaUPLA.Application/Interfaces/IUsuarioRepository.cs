using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken);
    Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken);
}
