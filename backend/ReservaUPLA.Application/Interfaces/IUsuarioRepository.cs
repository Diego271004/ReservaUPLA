using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Interfaces;

public interface IUsuarioRepository
{
    /// <summary>Busca por coincidencia exacta con el correo ya normalizado (como el índice único de la base).</summary>
    Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken);
    Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Usuario>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken);

    /// <summary>Guarda el usuario y completa su Id.</summary>
    Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken);
}
