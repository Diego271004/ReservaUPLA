using System.Net.Http.Headers;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.API.Tests;

/// <summary>
/// Levanta la API en memoria con configuración de prueba y repositorios en memoria (sin base de datos).
/// - Entorno "Testing": en Development la API cargaría los user-secrets reales del equipo.
/// - El rate limiter particiona por IP y en TestServer todas las peticiones comparten partición:
///   cada prueba crea su propia instancia para no superar los 5 logins por minuto sin querer.
/// - Los tokens de las pruebas de autorización se emiten con el generador real, sin pasar por el login.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string Clave = "Clave#123";
    public const string OrigenPermitido = "http://localhost:5180";

    private readonly string _claveJwt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    private readonly IUsuarioRepository? _usuariosPropios;

    public FakeUsuarioRepository Usuarios { get; } = new();
    public FakeAmbienteRepository Ambientes { get; } = new();
    public FakeReservaRepository Reservas { get; } = new();

    public Usuario Administrador { get; }
    public Usuario Solicitante { get; }
    public Usuario Responsable { get; }
    public Usuario Inactivo { get; }

    public ApiFactory(IUsuarioRepository? usuariosPropios = null)
    {
        _usuariosPropios = usuariosPropios;
        var hash = new BCryptPasswordHasher().Hash(Clave);
        Administrador = Usuarios.Agregar("carla.rojas@upla.edu.pe", RolUsuario.Administrador, hash: hash);
        Solicitante = Usuarios.Agregar("ana.torres@upla.edu.pe", RolUsuario.Solicitante, hash: hash);
        Responsable = Usuarios.Agregar("mario.huaman@upla.edu.pe", RolUsuario.Responsable, hash: hash);
        Inactivo = Usuarios.Agregar("luis.quispe@upla.edu.pe", RolUsuario.Solicitante, activo: false, hash: hash);
        Ambientes.Agregar("Laboratorio de Cómputo 2", Responsable.Id);
        Ambientes.Agregar("Sala de Reuniones A", Responsable.Id, EstadoAmbiente.EnMantenimiento);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:ReservaUPLADB",
            "Host=servidor-inexistente;Database=ReservaUPLATest;Username=prueba;Password=prueba");
        builder.UseSetting("Jwt:Key", _claveJwt);
        builder.UseSetting("Jwt:Issuer", "ReservaUPLA.API");
        builder.UseSetting("Jwt:Audience", "ReservaUPLA.Frontend");
        builder.UseSetting("Jwt:MinutosExpiracion", "60");
        builder.UseSetting("Autenticacion:DominioInstitucional", "upla.edu.pe");
        builder.UseSetting("Cors:OrigenesPermitidos:0", OrigenPermitido);

        // Sin registros en la salida de las pruebas (el 500 provocado es esperado).
        builder.ConfigureLogging(registro => registro.ClearProviders());

        builder.ConfigureTestServices(servicios =>
        {
            servicios.RemoveAll<IUsuarioRepository>();
            servicios.RemoveAll<IAmbienteRepository>();
            servicios.RemoveAll<IReservaRepository>();
            servicios.AddSingleton(_usuariosPropios ?? Usuarios);
            servicios.AddSingleton<IUsuarioRepository>(proveedor => _usuariosPropios ?? Usuarios);
            servicios.AddSingleton<IAmbienteRepository>(Ambientes);
            servicios.AddSingleton<IReservaRepository>(Reservas);
        });
    }

    /// <summary>Cliente con el token de <paramref name="usuario"/>, o sin sesión si es null.</summary>
    public HttpClient CrearCliente(Usuario? usuario = null)
    {
        var cliente = CreateClient();
        if (usuario is not null)
        {
            var (token, _) = Services.GetRequiredService<ITokenGenerator>().Generar(usuario);
            cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        return cliente;
    }
}
