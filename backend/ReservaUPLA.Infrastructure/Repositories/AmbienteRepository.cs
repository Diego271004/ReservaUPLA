using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure.Repositories;

public sealed class AmbienteRepository : IAmbienteRepository
{
    private readonly ReservaUPLADbContext _contexto;

    public AmbienteRepository(ReservaUPLADbContext contexto)
    {
        _contexto = contexto;
    }

    public Task<Ambiente?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        _contexto.Ambientes.AsNoTracking().FirstOrDefaultAsync(ambiente => ambiente.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Ambiente>> ListarAsync(CancellationToken cancellationToken) =>
        await _contexto.Ambientes.AsNoTracking().OrderBy(ambiente => ambiente.Nombre).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Ambiente>> ListarPorResponsableAsync(int responsableId, CancellationToken cancellationToken) =>
        await _contexto.Ambientes.AsNoTracking()
            .Where(ambiente => ambiente.ResponsableId == responsableId)
            .OrderBy(ambiente => ambiente.Nombre)
            .ToListAsync(cancellationToken);

    // Sin distinguir mayúsculas: "Auditorio principal" y "Auditorio Principal" son el mismo ambiente para el usuario.
    public Task<bool> ExisteNombreAsync(string nombre, CancellationToken cancellationToken)
    {
        var nombreMinusculas = nombre.ToLower();
        return _contexto.Ambientes.AnyAsync(ambiente => ambiente.Nombre.ToLower() == nombreMinusculas, cancellationToken);
    }

    public async Task AgregarAsync(Ambiente ambiente, CancellationToken cancellationToken)
    {
        _contexto.Ambientes.Add(ambiente);
        await _contexto.SaveChangesAsync(cancellationToken);
    }
}
