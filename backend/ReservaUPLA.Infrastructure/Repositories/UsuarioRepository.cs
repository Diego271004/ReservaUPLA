using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

public sealed class UsuarioRepository : IUsuarioRepository
{
    private readonly ReservaUPLADbContext _contexto;

    public UsuarioRepository(ReservaUPLADbContext contexto)
    {
        _contexto = contexto;
    }

    public Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken) =>
        _contexto.Usuarios.AsNoTracking().FirstOrDefaultAsync(usuario => usuario.Correo == correo, cancellationToken);

    public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        _contexto.Usuarios.AsNoTracking().FirstOrDefaultAsync(usuario => usuario.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Usuario>> ObtenerPorIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken)
    {
        var lista = ids.Distinct().ToList();
        return await _contexto.Usuarios.AsNoTracking().Where(usuario => lista.Contains(usuario.Id)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Usuario>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken)
    {
        var consulta = _contexto.Usuarios.AsNoTracking();
        if (rol is { } rolFiltrado)
        {
            consulta = consulta.Where(usuario => usuario.Rol == rolFiltrado);
        }

        return await consulta.OrderBy(usuario => usuario.NombreCompleto).ToListAsync(cancellationToken);
    }

    public async Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        _contexto.Usuarios.Add(usuario);
        await _contexto.SaveChangesAsync(cancellationToken);
    }
}
