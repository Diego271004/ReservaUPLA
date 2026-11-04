using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.API.Tests;

public class LoginEndpointTests
{
    private const string Ruta = "/api/auth/login";

    private static async Task<JsonElement> Leer(HttpResponseMessage respuesta) =>
        (await respuesta.Content.ReadFromJsonAsync<JsonElement>());

    [Fact]
    public async Task Cuerpo_vacio_devuelve_400_con_errores_por_campo()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente().PostAsync(Ruta, content: null);

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        Assert.Equal("application/problem+json", respuesta.Content.Headers.ContentType?.MediaType);
        var errores = (await Leer(respuesta)).GetProperty("errors");
        Assert.Equal(MensajesValidacion.CorreoVacio, errores.GetProperty("correo")[0].GetString());
        Assert.Equal(MensajesValidacion.ContrasenaVacia, errores.GetProperty("contrasena")[0].GetString());
    }

    [Fact]
    public async Task Credenciales_correctas_devuelven_200_con_token_nombre_y_rol()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente().PostAsJsonAsync(Ruta, new { correo = "Carla.Rojas@upla.edu.pe ", contrasena = ApiFactory.Clave });

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var cuerpo = await Leer(respuesta);
        Assert.False(string.IsNullOrWhiteSpace(cuerpo.GetProperty("token").GetString()));
        Assert.Equal(api.Administrador.NombreCompleto, cuerpo.GetProperty("nombreCompleto").GetString());
        Assert.Equal("Administrador", cuerpo.GetProperty("rol").GetString());
        Assert.Equal(api.Administrador.Id, cuerpo.GetProperty("usuarioId").GetInt32());
    }

    [Theory]
    [InlineData("carla.rojas@upla.edu.pe", "clave-erronea")]
    [InlineData("nadie@upla.edu.pe", ApiFactory.Clave)]
    [InlineData("luis.quispe@upla.edu.pe", ApiFactory.Clave)] // usuario inactivo
    public async Task Contrasena_erronea_usuario_inexistente_o_inactivo_dan_401_con_el_mismo_mensaje(string correo, string contrasena)
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente().PostAsJsonAsync(Ruta, new { correo, contrasena });

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        Assert.Equal(MensajesValidacion.CredencialesInvalidas, (await Leer(respuesta)).GetProperty("mensaje").GetString());
    }

    [Fact]
    public async Task El_sexto_intento_en_un_minuto_devuelve_429_con_su_mensaje()
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente();

        for (var intento = 1; intento <= 5; intento++)
        {
            var permitido = await cliente.PostAsJsonAsync(Ruta, new { correo = "carla.rojas@upla.edu.pe", contrasena = "mal" });
            Assert.Equal(HttpStatusCode.Unauthorized, permitido.StatusCode);
        }

        var bloqueado = await cliente.PostAsJsonAsync(Ruta, new { correo = "carla.rojas@upla.edu.pe", contrasena = "mal" });

        Assert.Equal(HttpStatusCode.TooManyRequests, bloqueado.StatusCode);
        Assert.Equal(MensajesValidacion.DemasiadosIntentos, (await Leer(bloqueado)).GetProperty("mensaje").GetString());
        Assert.Equal("60", bloqueado.Headers.GetValues("Retry-After").Single());
    }
}
