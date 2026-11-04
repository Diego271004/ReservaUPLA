using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Infrastructure.Persistence;

namespace ReservaUPLA.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AgregarInfraestructura(this IServiceCollection servicios, IConfiguration configuracion)
    {
        var cadenaConexion = configuracion.GetConnectionString("ReservaUPLADB")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'ReservaUPLADB' (use dotnet user-secrets).");

        servicios.AddDbContext<ReservaUPLADbContext>(opciones => opciones.UseNpgsql(cadenaConexion));
        servicios.AddScoped<IComprobadorSalud, ComprobadorSalud>();
        return servicios;
    }
}
