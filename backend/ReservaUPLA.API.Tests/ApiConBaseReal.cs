using System.Net.Http.Headers;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Tests.BaseDeDatos;

namespace ReservaUPLA.API.Tests;

/// <summary>La API completa (JWT, autorización, EF Core) contra la base real de pruebas; ver <see cref="VariablesDeBaseDeDatos"/>.</summary>
public sealed class ApiConBaseReal : WebApplicationFactory<Program>
{
    private readonly string _claveJwt = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing"); // sin los user-secrets del equipo
        builder.UseSetting("ConnectionStrings:ReservaUPLADB", VariablesDeBaseDeDatos.ObtenerApp()!);
        builder.UseSetting("Jwt:Key", _claveJwt);
        builder.UseSetting("Jwt:Issuer", "ReservaUPLA.API");
        builder.UseSetting("Jwt:Audience", "ReservaUPLA.Frontend");
        builder.UseSetting("Jwt:MinutosExpiracion", "60");
        builder.UseSetting("Autenticacion:DominioInstitucional", "upla.edu.pe");
        builder.UseSetting("Cors:OrigenesPermitidos:0", "http://localhost:5180");
        builder.ConfigureLogging(registro => { registro.ClearProviders(); });
    }

    /// <summary>Un cliente HTTP con el token de un usuario que existe en la base (por su id y rol).</summary>
    public HttpClient ClienteDe(int usuarioId, RolUsuario rol)
    {
        var usuario = new Usuario { Id = usuarioId, Correo = $"prueba{usuarioId}@upla.edu.pe", NombreCompleto = "Prueba", Rol = rol };
        var (token, _) = Services.GetRequiredService<ITokenGenerator>().Generar(usuario);
        var cliente = CreateClient();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return cliente;
    }

    public HttpClient ClienteDeAdministrador(int administradorId) => ClienteDe(administradorId, RolUsuario.Administrador);
}
