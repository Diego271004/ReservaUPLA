using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.API.Tests;

/// <summary>
/// Detalle, disponibilidad y cambios de estado de las reservas por HTTP: 400 con errores por campo, 401, 403, 404 y 409.
/// La API se levanta en memoria con repositorios falsos; la prueba con la base real está en ConcurrenciaAprobacionTests.
/// </summary>
public class ReservasEndpointsTests
{
    private const string ConflictoDe10a12 =
        "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.";

    private static async Task<JsonElement> Leer(HttpResponseMessage respuesta) =>
        await respuesta.Content.ReadFromJsonAsync<JsonElement>();

    private static string RutaDisponibilidad(int ambiente = 1, string fecha = "2026-11-05", string inicio = "10:00", string fin = "12:00") =>
        $"/api/reservas/disponibilidad?ambienteId={ambiente}&fecha={fecha}&horaInicio={inicio}&horaFin={fin}";

    private static object NuevaReserva(int ambiente = 1, string inicio = "10:00", string fin = "12:00") =>
        new { ambienteId = ambiente, fecha = "2026-11-05", horaInicio = inicio, horaFin = fin, motivo = "Práctica" };

    // ======================================================================== GET /api/reservas/{id}

    [Fact]
    public async Task El_Administrador_ve_el_detalle_con_el_historial()
    {
        using var api = new ApiFactory();
        var id = api.Reservas.Agregar(1, "10:00", "12:00", EstadoReserva.Aprobada, api.Solicitante.Id).Id;

        var respuesta = await api.CrearCliente(api.Administrador).GetAsync($"/api/reservas/{id}");

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var cuerpo = await Leer(respuesta);
        Assert.Equal("Aprobada", cuerpo.GetProperty("reserva").GetProperty("estado").GetString());
        Assert.Equal("Laboratorio de Cómputo 2", cuerpo.GetProperty("reserva").GetProperty("ambienteNombre").GetString());
        Assert.Equal(2, cuerpo.GetProperty("historial").GetArrayLength());
    }

    [Fact]
    public async Task Una_reserva_ajena_o_inexistente_da_404_igual_para_no_revelar_que_existe()
    {
        using var api = new ApiFactory();
        var id = api.Reservas.Agregar(1, "10:00", "12:00", usuarioId: api.Administrador.Id).Id;

        var ajena = await api.CrearCliente(api.Solicitante).GetAsync($"/api/reservas/{id}");
        var inexistente = await api.CrearCliente(api.Administrador).GetAsync("/api/reservas/999");

        Assert.Equal(HttpStatusCode.NotFound, ajena.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, inexistente.StatusCode);
        Assert.Equal("application/problem+json", inexistente.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Sin_sesion_el_detalle_da_401()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente().GetAsync("/api/reservas/1");

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }

    // ======================================================================== GET disponibilidad

    [Fact]
    public async Task Disponibilidad_libre_devuelve_disponible_con_el_mensaje_verde()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Solicitante).GetAsync(RutaDisponibilidad());

        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        var cuerpo = await Leer(respuesta);
        Assert.True(cuerpo.GetProperty("disponible").GetBoolean());
        Assert.Equal("Disponible: no hay reservas aprobadas en ese horario", cuerpo.GetProperty("mensaje").GetString());
    }

    [Fact]
    public async Task RN01_disponibilidad_con_una_Aprobada_que_se_cruza_avisa_la_hora()
    {
        using var api = new ApiFactory();
        api.Reservas.Agregar(1, "10:00", "12:00", EstadoReserva.Aprobada);

        var respuesta = await api.CrearCliente(api.Solicitante).GetAsync(RutaDisponibilidad(inicio: "11:00", fin: "13:00"));

        var cuerpo = await Leer(respuesta);
        Assert.False(cuerpo.GetProperty("disponible").GetBoolean());
        Assert.Equal(ConflictoDe10a12, cuerpo.GetProperty("mensaje").GetString());
    }

    [Fact]
    public async Task Disponibilidad_con_datos_invalidos_da_400_con_errores_por_campo()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Solicitante).GetAsync("/api/reservas/disponibilidad?horaInicio=12:00&horaFin=10:00");

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var errores = (await Leer(respuesta)).GetProperty("errors");
        Assert.Equal(MensajesValidacion.AmbienteVacio, errores.GetProperty("ambienteId")[0].GetString());
        Assert.Equal(MensajesValidacion.FechaVacia, errores.GetProperty("fecha")[0].GetString());
        Assert.Equal(MensajesValidacion.HoraFinNoPosterior, errores.GetProperty("horaFin")[0].GetString());
    }

    [Fact]
    public async Task La_Responsable_no_consulta_disponibilidad_para_reservar_y_sin_sesion_da_401()
    {
        using var api = new ApiFactory();

        var responsable = await api.CrearCliente(api.Responsable).GetAsync(RutaDisponibilidad());
        var anonimo = await api.CrearCliente().GetAsync(RutaDisponibilidad());

        Assert.Equal(HttpStatusCode.Forbidden, responsable.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonimo.StatusCode);
    }

    // ======================================================================== POST /api/reservas (reglas al registrar)

    [Fact]
    public async Task Reservar_en_un_ambiente_en_mantenimiento_da_400_en_el_ambiente()
    {
        using var api = new ApiFactory();

        var respuesta = await api.CrearCliente(api.Solicitante).PostAsJsonAsync("/api/reservas", NuevaReserva(ambiente: 2));

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var errores = (await Leer(respuesta)).GetProperty("errors");
        Assert.Equal(MensajesValidacion.AmbienteEnMantenimiento, errores.GetProperty("ambienteId")[0].GetString());
        Assert.Empty(api.Reservas.Reservas);
    }

    [Fact]
    public async Task RN01_registrar_una_reserva_que_se_cruza_con_una_Aprobada_da_409_con_la_hora()
    {
        using var api = new ApiFactory();
        api.Reservas.Agregar(1, "10:00", "12:00", EstadoReserva.Aprobada);

        var respuesta = await api.CrearCliente(api.Solicitante).PostAsJsonAsync("/api/reservas", NuevaReserva(inicio: "11:00", fin: "13:00"));

        Assert.Equal(HttpStatusCode.Conflict, respuesta.StatusCode);
        Assert.Equal(ConflictoDe10a12, (await Leer(respuesta)).GetProperty("mensaje").GetString());
        Assert.Single(api.Reservas.Reservas);
    }

    // ======================================================================== Aprobar / rechazar (RN-05)

    [Fact]
    public async Task El_Administrador_aprueba_y_rechaza_reservas_Pendientes()
    {
        using var api = new ApiFactory();
        var paraAprobar = api.Reservas.Agregar(1, "10:00", "12:00", usuarioId: api.Solicitante.Id).Id;
        var paraRechazar = api.Reservas.Agregar(1, "14:00", "16:00", usuarioId: api.Solicitante.Id).Id;
        var cliente = api.CrearCliente(api.Administrador);

        var aprobada = await cliente.PostAsync($"/api/reservas/{paraAprobar}/aprobar", null);
        var rechazada = await cliente.PostAsync($"/api/reservas/{paraRechazar}/rechazar", null);

        Assert.Equal(HttpStatusCode.OK, aprobada.StatusCode);
        Assert.Equal("Aprobada", (await Leer(aprobada)).GetProperty("reserva").GetProperty("estado").GetString());
        Assert.Equal(HttpStatusCode.OK, rechazada.StatusCode);
        Assert.Equal("Rechazada", (await Leer(rechazada)).GetProperty("reserva").GetProperty("estado").GetString());
    }

    [Theory]
    [InlineData("aprobar", "solicitante")]
    [InlineData("aprobar", "responsable")]
    [InlineData("rechazar", "solicitante")]
    [InlineData("rechazar", "responsable")]
    public async Task RN05_solo_el_Administrador_aprueba_o_rechaza_los_demas_reciben_403(string accion, string rol)
    {
        using var api = new ApiFactory();
        var id = api.Reservas.Agregar(1, "10:00", "12:00", usuarioId: api.Solicitante.Id).Id;
        var cliente = api.CrearCliente(rol == "solicitante" ? api.Solicitante : api.Responsable);

        var respuesta = await cliente.PostAsync($"/api/reservas/{id}/{accion}", null);

        Assert.Equal(HttpStatusCode.Forbidden, respuesta.StatusCode);
        Assert.Equal(EstadoReserva.Pendiente, api.Reservas.Reservas.Single().Estado);
    }

    [Theory]
    [InlineData("aprobar")]
    [InlineData("rechazar")]
    [InlineData("cancelar")]
    public async Task Cambiar_el_estado_sin_sesion_da_401_y_de_una_reserva_inexistente_da_404(string accion)
    {
        using var api = new ApiFactory();

        var sinSesion = await api.CrearCliente().PostAsync($"/api/reservas/1/{accion}", null);
        var inexistente = await api.CrearCliente(api.Administrador).PostAsync($"/api/reservas/999/{accion}", null);

        Assert.Equal(HttpStatusCode.Unauthorized, sinSesion.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, inexistente.StatusCode);
    }

    [Fact]
    public async Task RN01_aprobar_una_reserva_que_se_cruza_con_otra_Aprobada_da_409_con_la_hora()
    {
        using var api = new ApiFactory();
        api.Reservas.Agregar(1, "10:00", "12:00", EstadoReserva.Aprobada);
        var id = api.Reservas.Agregar(1, "11:00", "13:00", usuarioId: api.Solicitante.Id).Id;

        var respuesta = await api.CrearCliente(api.Administrador).PostAsync($"/api/reservas/{id}/aprobar", null);

        Assert.Equal(HttpStatusCode.Conflict, respuesta.StatusCode);
        Assert.Equal(ConflictoDe10a12, (await Leer(respuesta)).GetProperty("mensaje").GetString());
        Assert.Equal(EstadoReserva.Pendiente, api.Reservas.Reservas.Last().Estado);
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada, "aprobar", MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Rechazada, "rechazar", MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Rechazada, "cancelar", MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, "aprobar", MensajesValidacion.ReservaCanceladaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, "cancelar", MensajesValidacion.ReservaCanceladaNoSeModifica)]
    public async Task RN06_modificar_una_reserva_Rechazada_o_Cancelada_da_409_con_el_mensaje(
        EstadoReserva estado, string accion, string mensaje)
    {
        using var api = new ApiFactory();
        var id = api.Reservas.Agregar(1, "10:00", "12:00", estado, api.Solicitante.Id).Id;

        var respuesta = await api.CrearCliente(api.Administrador).PostAsync($"/api/reservas/{id}/{accion}", null);

        Assert.Equal(HttpStatusCode.Conflict, respuesta.StatusCode);
        Assert.Equal(mensaje, (await Leer(respuesta)).GetProperty("mensaje").GetString());
        Assert.Equal(estado, api.Reservas.Reservas.Single().Estado);
    }

    // ======================================================================== Cancelar

    [Fact]
    public async Task El_solicitante_dueño_y_el_Administrador_cancelan_la_otra_solicitante_y_la_Responsable_reciben_403()
    {
        using var api = new ApiFactory();
        var propia = api.Reservas.Agregar(1, "10:00", "12:00", usuarioId: api.Solicitante.Id).Id;
        var deOtra = api.Reservas.Agregar(1, "14:00", "16:00", usuarioId: api.Solicitante.Id).Id;

        var otraSolicitante = await api.CrearCliente(api.Inactivo).PostAsync($"/api/reservas/{propia}/cancelar", null);
        var responsable = await api.CrearCliente(api.Responsable).PostAsync($"/api/reservas/{propia}/cancelar", null);
        var dueña = await api.CrearCliente(api.Solicitante).PostAsync($"/api/reservas/{propia}/cancelar", null);
        var administrador = await api.CrearCliente(api.Administrador).PostAsync($"/api/reservas/{deOtra}/cancelar", null);

        Assert.Equal(HttpStatusCode.Forbidden, otraSolicitante.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, responsable.StatusCode);
        Assert.Equal(HttpStatusCode.OK, dueña.StatusCode);
        Assert.Equal("Cancelada", (await Leer(dueña)).GetProperty("reserva").GetProperty("estado").GetString());
        Assert.Equal(HttpStatusCode.OK, administrador.StatusCode);
    }
}
