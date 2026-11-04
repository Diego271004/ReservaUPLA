using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ReservaUPLA.Application.Common;

namespace ReservaUPLA.API.Tests;

/// <summary>Autorización por rol (RN-05 y permisos de la Fase 5): 401 sin sesión, 403 con otro rol.</summary>
public class AutorizacionTests
{
    private static readonly object UsuarioValido = new
    {
        nombreCompleto = "Rosa Chávez",
        correo = "rosa.chavez@upla.edu.pe",
        rol = "Responsable",
        activo = true,
        contrasena = "Clave#123",
    };

    private static readonly object AmbienteValido = new
    {
        nombre = "Auditorio Principal",
        tipo = "Auditorio",
        capacidad = 200,
        ubicacion = "Pabellón B",
        estado = "Disponible",
        responsableId = (int?)null,
    };

    private static readonly object ReservaValida = new
    {
        ambienteId = 1,
        fecha = "2026-11-05",
        horaInicio = "10:00",
        horaFin = "12:00",
        motivo = "Práctica de programación",
    };

    [Theory]
    [InlineData("/api/auth/me")]
    [InlineData("/api/usuarios")]
    [InlineData("/api/ambientes")]
    [InlineData("/api/reservas")]
    public async Task Sin_sesion_los_endpoints_protegidos_devuelven_401(string ruta)
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente().GetAsync(ruta);

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Fact]
    public async Task Me_devuelve_los_datos_de_la_sesion()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Solicitante).GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var cuerpo = await respuesta.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("ana.torres@upla.edu.pe", cuerpo.GetProperty("correo").GetString());
        Assert.Equal("Solicitante", cuerpo.GetProperty("rol").GetString());
    }

    [Fact]
    public async Task Un_token_con_la_firma_alterada_devuelve_401()
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente(api.Administrador);
        var token = cliente.DefaultRequestHeaders.Authorization!.Parameter!;
        cliente.DefaultRequestHeaders.Authorization = new("Bearer", token[..^3] + "abc");

        var respuesta = await cliente.GetAsync("/api/usuarios");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    [Theory]
    [InlineData("solicitante")]
    [InlineData("responsable")]
    public async Task Los_usuarios_solo_los_gestiona_el_Administrador_y_el_403_es_ProblemDetails(string rol)
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente(rol == "solicitante" ? api.Solicitante : api.Responsable);

        var listar = await cliente.GetAsync("/api/usuarios");
        var crear = await cliente.PostAsJsonAsync("/api/usuarios", UsuarioValido);

        Assert.Equal(HttpStatusCode.Forbidden, listar.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, crear.StatusCode);
        Assert.Equal("application/problem+json", listar.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain(api.Usuarios.Usuarios, usuario => usuario.Correo == "rosa.chavez@upla.edu.pe");
    }

    [Fact]
    public async Task El_Administrador_registra_y_lista_usuarios()
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente(api.Administrador);

        var crear = await cliente.PostAsJsonAsync("/api/usuarios", UsuarioValido);
        var listar = await cliente.GetFromJsonAsync<JsonElement>("/api/usuarios?rol=Responsable");

        Assert.Equal(HttpStatusCode.Created, crear.StatusCode);
        Assert.Equal(2, listar.GetArrayLength());
        Assert.Contains(api.Usuarios.Usuarios, usuario => usuario.Correo == "rosa.chavez@upla.edu.pe");
        Assert.DoesNotContain("Clave#123", await crear.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Un_rol_invalido_en_el_filtro_devuelve_400()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Administrador).GetAsync("/api/usuarios?rol=Dios");

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
    }

    [Fact]
    public async Task Un_usuario_invalido_devuelve_400_con_errores_por_campo_y_un_correo_repetido_su_mensaje()
    {
        using var api = new ApiFactory();
        var cliente = api.CrearCliente(api.Administrador);

        var vacio = await cliente.PostAsync("/api/usuarios", content: null);
        var repetido = await cliente.PostAsJsonAsync("/api/usuarios", new
        {
            nombreCompleto = "Otra Ana",
            correo = "ANA.TORRES@upla.edu.pe",
            rol = "Solicitante",
            activo = true,
            contrasena = "Clave#123",
        });

        Assert.Equal(HttpStatusCode.BadRequest, vacio.StatusCode);
        var erroresVacio = (await vacio.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(MensajesValidacion.NombreCompletoVacio, erroresVacio.GetProperty("nombreCompleto")[0].GetString());
        Assert.Equal(HttpStatusCode.BadRequest, repetido.StatusCode);
        var erroresRepetido = (await repetido.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(MensajesValidacion.CorreoYaRegistrado, erroresRepetido.GetProperty("correo")[0].GetString());
    }

    [Fact]
    public async Task Cualquier_usuario_con_sesion_lista_ambientes_pero_solo_el_Administrador_los_crea()
    {
        using var api = new ApiFactory();

        var lista = await api.CrearCliente(api.Solicitante).GetAsync("/api/ambientes");
        var soloAdministrador = await api.CrearCliente(api.Solicitante).PostAsJsonAsync("/api/ambientes", AmbienteValido);
        var creado = await api.CrearCliente(api.Administrador).PostAsJsonAsync("/api/ambientes", AmbienteValido);

        Assert.Equal(HttpStatusCode.OK, lista.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, soloAdministrador.StatusCode);
        Assert.Equal(HttpStatusCode.Created, creado.StatusCode);
    }

    [Fact]
    public async Task Un_ambiente_repetido_devuelve_400_con_su_mensaje()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Administrador).PostAsJsonAsync("/api/ambientes", new
        {
            nombre = "laboratorio de cómputo 2",
            tipo = "Laboratorio",
            capacidad = 30,
            ubicacion = "Pabellón A",
            estado = "Disponible",
        });

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var errores = (await respuesta.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(MensajesValidacion.NombreAmbienteDuplicado, errores.GetProperty("nombre")[0].GetString());
    }

    [Fact]
    public async Task La_Responsable_no_crea_reservas_y_la_Solicitante_y_el_Administrador_si()
    {
        using var api = new ApiFactory();

        var responsable = await api.CrearCliente(api.Responsable).PostAsJsonAsync("/api/reservas", ReservaValida);
        var solicitante = await api.CrearCliente(api.Solicitante).PostAsJsonAsync("/api/reservas", ReservaValida);
        var administrador = await api.CrearCliente(api.Administrador).PostAsJsonAsync("/api/reservas", ReservaValida);

        Assert.Equal(HttpStatusCode.Forbidden, responsable.StatusCode);
        Assert.Equal(HttpStatusCode.Created, solicitante.StatusCode);
        Assert.Equal(HttpStatusCode.Created, administrador.StatusCode);
        Assert.Equal(2, api.Reservas.Reservas.Count);
        Assert.Equal(api.Solicitante.Id, api.Reservas.Reservas[0].UsuarioId);
    }

    [Fact]
    public async Task Una_reserva_con_horas_invalidas_devuelve_400_con_el_mensaje_de_RN03()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Solicitante).PostAsJsonAsync("/api/reservas", new
        {
            ambienteId = 1,
            fecha = "2026-11-05",
            horaInicio = "12:00",
            horaFin = "10:00",
            motivo = "Práctica",
        });

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var errores = (await respuesta.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(MensajesValidacion.HoraFinNoPosterior, errores.GetProperty("horaFin")[0].GetString());
    }

    [Fact]
    public async Task Listar_reservas_pasa_el_filtro_segun_el_rol_del_token()
    {
        using var api = new ApiFactory();

        await api.CrearCliente(api.Solicitante).GetAsync("/api/reservas");
        Assert.Equal(api.Solicitante.Id, api.Reservas.UltimoFiltro!.UsuarioId);

        await api.CrearCliente(api.Responsable).GetAsync("/api/reservas");
        Assert.Equal(api.Responsable.Id, api.Reservas.UltimoFiltro!.ResponsableId);

        await api.CrearCliente(api.Administrador).GetAsync("/api/reservas");
        Assert.Null(api.Reservas.UltimoFiltro!.UsuarioId);
        Assert.Null(api.Reservas.UltimoFiltro.ResponsableId);
    }
}
