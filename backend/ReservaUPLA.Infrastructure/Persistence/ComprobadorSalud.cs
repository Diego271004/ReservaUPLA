using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Interfaces;

namespace ReservaUPLA.Infrastructure.Persistence;

public class ComprobadorSalud : IComprobadorSalud
{
    private readonly ReservaUPLADbContext _contexto;

    public ComprobadorSalud(ReservaUPLADbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<bool> BaseDeDatosDisponibleAsync(CancellationToken cancellationToken)
    {
        try
        {
            // Consulta real a una tabla: comprueba conexión, esquema y permisos del rol.
            await _contexto.Ambientes.AsNoTracking().AnyAsync(cancellationToken);
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }
}
