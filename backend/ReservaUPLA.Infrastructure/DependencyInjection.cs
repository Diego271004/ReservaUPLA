using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Infrastructure.Persistence;
using ReservaUPLA.Infrastructure.Repositories;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.Infrastructure;

public static class DependencyInjection
{
    public const string NombreCadenaConexion = "ReservaUPLADB";

    /// <summary>
    /// Registra persistencia (EF Core + Npgsql), BCrypt y JWT. Falla al iniciar, con un mensaje claro y
    /// sin mostrar valores, si faltan la cadena de conexión o la clave JWT.
    /// </summary>
    public static IServiceCollection AgregarInfraestructura(this IServiceCollection servicios, IConfiguration configuracion)
    {
        var cadenaConexion = configuracion.GetConnectionString(NombreCadenaConexion);
        if (string.IsNullOrWhiteSpace(cadenaConexion))
        {
            throw new InvalidOperationException(
                $"Falta la configuración 'ConnectionStrings:{NombreCadenaConexion}'. " +
                "Defínela con dotnet user-secrets en el proyecto ReservaUPLA.API (ver README).");
        }

        servicios.AddDbContext<ReservaUPLADbContext>(opciones => opciones.UseNpgsql(cadenaConexion));

        servicios.AddOptions<JwtOptions>()
            .Bind(configuracion.GetSection(JwtOptions.Seccion))
            .Validate(opciones => opciones.ClaveValida(),
                $"Falta 'Jwt:Key' o tiene menos de {JwtOptions.BytesMinimosClave} bytes. " +
                "Defínela con dotnet user-secrets en el proyecto ReservaUPLA.API (ver README).")
            .Validate(opciones => !string.IsNullOrWhiteSpace(opciones.Issuer) && !string.IsNullOrWhiteSpace(opciones.Audience),
                "Faltan 'Jwt:Issuer' o 'Jwt:Audience' en la configuración.")
            .Validate(opciones => opciones.MinutosExpiracion > 0, "'Jwt:MinutosExpiracion' debe ser mayor que 0.")
            .ValidateOnStart();

        servicios.TryAddSingleton(TimeProvider.System);
        servicios.AddScoped<IComprobadorSalud, ComprobadorSalud>();
        servicios.AddScoped<IUsuarioRepository, UsuarioRepository>();
        servicios.AddScoped<IAmbienteRepository, AmbienteRepository>();
        servicios.AddScoped<IReservaRepository, ReservaRepository>();
        servicios.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
        servicios.AddSingleton<ITokenGenerator, JwtTokenGenerator>();

        return servicios;
    }
}
