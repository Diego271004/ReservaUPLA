using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken);
    Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Usuario>> ObtenerPorIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken);
    Task<IReadOnlyList<Usuario>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken);

    Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken);
}
