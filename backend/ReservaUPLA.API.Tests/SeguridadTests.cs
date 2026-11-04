using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Tests;

public class SeguridadTests
{
    private sealed class RepositorioQueFalla : IUsuarioRepository
    {
        public Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("detalle interno: Host=servidor Password=secreto");

        public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("detalle interno");

        public Task<IReadOnlyList<Usuario>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("detalle interno");

        public Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("detalle interno");
    }

    [Fact]
    public async Task Una_excepcion_no_controlada_devuelve_500_ProblemDetails_sin_detalles_internos()
    {
        using var api = new ApiFactory(new RepositorioQueFalla());

        var respuesta = await api.CrearCliente().PostAsJsonAsync("/api/auth/login",
            new { correo = "carla.rojas@upla.edu.pe", contrasena = "Clave#123" });

        Assert.Equal(HttpStatusCode.InternalServerError, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
        var texto = await respuesta.Content.ReadAsStringAsync();
        Assert.DoesNotContain("servidor", texto);
        Assert.DoesNotContain("secreto", texto);
        Assert.DoesNotContain("InvalidOperationException", texto);
        Assert.Equal(500, JsonDocument.Parse(texto).RootElement.GetProperty("status").GetInt32());
    }

    [Fact]
    public async Task CORS_permite_solo_el_origen_del_frontend()
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente();

        async Task<HttpResponseMessage> Preflight(string origen)
        {
            var peticion = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
            peticion.Headers.Add("Origin", origen);
            peticion.Headers.Add("Access-Control-Request-Method", "POST");
            peticion.Headers.Add("Access-Control-Request-Headers", "content-type");
            return await cliente.SendAsync(peticion);
        }

        var permitido = await Preflight(ApiFactory.OrigenPermitido);
        var ajeno = await Preflight("http://sitio-ajeno.example");

        Assert.Equal(ApiFactory.OrigenPermitido, permitido.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.False(ajeno.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
