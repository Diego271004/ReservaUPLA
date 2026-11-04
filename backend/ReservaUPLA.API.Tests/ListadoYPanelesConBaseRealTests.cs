using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Tests.BaseDeDatos;

namespace ReservaUPLA.API.Tests;

/// <summary>
/// Salida de datos con la API completa y la base real: el listado de Reservas por rol y por filtro, el Dashboard y Mi ambiente.
/// Cada indicador se compara con una consulta SQL directa a la base (prueba de coherencia): si no coinciden, es un defecto.
/// Se omite si no hay base de datos de pruebas (ver BaseDeDatosDePruebas). Van en una colección sin paralelismo porque
/// comparan totales de toda la base y otras pruebas insertan y borran datos.
/// </summary>
[Collection("BaseReal")]
public class ListadoYPanelesConBaseRealTests
{
    private const string Aprobada = "Aprobada";
    private const string Pendiente = "Pendiente";
    private const string Rechazada = "Rechazada";
    private const string Cancelada = "Cancelada";

    private static async Task<JsonElement> Leer(HttpResponseMessage respuesta)
    {
        Assert.Equal(HttpStatusCode.OK, respuesta.StatusCode);
        return await respuesta.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static List<int> Ids(JsonElement pagina) =>
        pagina.GetProperty("elementos").EnumerateArray().Select(e => e.GetProperty("id").GetInt32()).ToList();

    private static async Task<JsonElement> Listar(HttpClient cliente, string consulta = "") =>
        await Leer(await cliente.GetAsync($"/api/reservas{consulta}"));

    /// <summary>Un escenario con un administrador (el de la semilla), dos solicitantes, dos responsables y tres ambientes.</summary>
    private sealed class Escenario
    {
        public required int AdministradorId { get; init; }
        public required int Ana { get; init; }
        public required int Luis { get; init; }
        public required int Mario { get; init; }
        public required int Rosa { get; init; }
        public required int AmbienteA { get; init; } // de Mario
        public required int AmbienteB { get; init; } // de Mario
        public required int AmbienteC { get; init; } // de Rosa

        public static async Task<Escenario> CrearAsync(DatosDePrueba datos)
        {
            await datos.InicializarAsync();
            var ana = await datos.CrearUsuarioAsync("Solicitante");
            var luis = await datos.CrearUsuarioAsync("Solicitante");
            var mario = await datos.CrearUsuarioAsync("Responsable");
            var rosa = await datos.CrearUsuarioAsync("Responsable");
            var a = await datos.CrearAmbienteAsync(mario);
            var b = await datos.CrearAmbienteAsync(mario);
            var c = await datos.CrearAmbienteAsync(rosa);

            // A y B empatan con 3 Aprobadas (más que cualquier ambiente de la semilla); A tiene los cuatro estados.
            foreach (var (ambiente, hora) in new[] { (a, "08:00"), (a, "10:00"), (a, "12:00"), (b, "08:00"), (b, "10:00"), (b, "12:00") })
            {
                var fin = $"{int.Parse(hora[..2]) + 1:00}:00";
                await datos.CrearReservaAsync(ambiente, ana, "2031-05-10", hora, fin, Aprobada);
            }
            await datos.CrearReservaAsync(a, ana, "2031-05-11", "08:00", "09:00", Pendiente, creadaHaceMinutos: 500);
            await datos.CrearReservaAsync(a, luis, "2031-05-11", "09:00", "10:00", Pendiente, creadaHaceMinutos: 400);
            await datos.CrearReservaAsync(a, luis, "2031-05-12", "08:00", "09:00", Rechazada);
            await datos.CrearReservaAsync(a, ana, "2031-05-13", "08:00", "09:00", Cancelada);
            await datos.CrearReservaAsync(b, luis, "2031-05-11", "08:00", "09:00", Pendiente, creadaHaceMinutos: 300);
            await datos.CrearReservaAsync(c, luis, "2031-05-10", "08:00", "09:00", Aprobada);
            await datos.CrearReservaAsync(c, ana, "2031-05-14", "08:00", "09:00", Pendiente, creadaHaceMinutos: 200);

            return new Escenario { AdministradorId = datos.AdministradorId, Ana = ana, Luis = luis, Mario = mario, Rosa = rosa, AmbienteA = a, AmbienteB = b, AmbienteC = c };
        }
    }

    // ======================================================================== Listado: cada rol ve lo suyo
    [FactConBaseDeDatos]
    public async Task El_Administrador_ve_todas_las_reservas_y_el_total_coincide_con_la_base()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);

        var pagina = await Listar(admin);

        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas"), pagina.GetProperty("total").GetInt32());
        Assert.Equal(10, pagina.GetProperty("elementos").GetArrayLength());
        Assert.Equal(1, pagina.GetProperty("pagina").GetInt32());
        Assert.Equal(10, pagina.GetProperty("tamano").GetInt32());
    }

    [FactConBaseDeDatos]
    public async Task El_Solicitante_solo_ve_las_suyas_y_las_ajenas_no_aparecen_ni_dan_500()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var ana = api.ClienteDe(e.Ana, RolUsuario.Solicitante);

        var suyas = await datos.ConsultarAsync("SELECT id FROM reservas WHERE usuario_id = @u ORDER BY fecha, hora_inicio, id", ("u", e.Ana));
        var pagina = await Listar(ana);

        Assert.Equal(suyas.Count, pagina.GetProperty("total").GetInt32());
        Assert.Equal(suyas.Select(f => (int)f[0]!).Take(10), Ids(pagina));

        // Pide explícitamente un ambiente donde solo hay reservas de otros: no aparece nada y no es un error.
        var ajenas = await datos.ConsultarAsync("SELECT id FROM reservas WHERE usuario_id = @u AND ambiente_id = @a", ("u", e.Luis), ("a", e.AmbienteC));
        Assert.NotEmpty(ajenas);
        var delAmbienteC = await Listar(ana, $"?ambienteId={e.AmbienteC}");
        Assert.Empty(Ids(delAmbienteC).Intersect(ajenas.Select(f => (int)f[0]!)));
        Assert.All(delAmbienteC.GetProperty("elementos").EnumerateArray(), r => Assert.Equal(e.Ana, r.GetProperty("usuarioId").GetInt32()));
    }

    [FactConBaseDeDatos]
    public async Task El_Responsable_solo_ve_las_reservas_de_sus_ambientes()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var mario = api.ClienteDe(e.Mario, RolUsuario.Responsable);

        var esperadas = await datos.ContarSqlAsync(
            "SELECT count(*)::int FROM reservas r JOIN ambientes a ON a.id = r.ambiente_id WHERE a.responsable_id = @m", ("m", e.Mario));
        var pagina = await Listar(mario);
        Assert.Equal(esperadas, pagina.GetProperty("total").GetInt32());
        Assert.All(pagina.GetProperty("elementos").EnumerateArray(),
            r => Assert.Contains(r.GetProperty("ambienteId").GetInt32(), new[] { e.AmbienteA, e.AmbienteB }));

        // El ambiente de otra responsable existe y tiene reservas, pero para Mario no hay nada (200 vacío, no 403 ni 500).
        var delAmbienteC = await Listar(mario, $"?ambienteId={e.AmbienteC}");
        Assert.Equal(0, delAmbienteC.GetProperty("total").GetInt32());
        Assert.Empty(Ids(delAmbienteC));
    }

    // ======================================================================== Listado: cada filtro, orden y paginación
    [FactConBaseDeDatos]
    public async Task Cada_filtro_coincide_con_la_base()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);

        foreach (var estado in new[] { Pendiente, Aprobada, Rechazada, Cancelada })
        {
            var enAmbienteA = await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE estado = @s AND ambiente_id = @a", ("s", estado), ("a", e.AmbienteA));
            var pagina = await Listar(admin, $"?estado={estado}&ambienteId={e.AmbienteA}");
            Assert.Equal(enAmbienteA, pagina.GetProperty("total").GetInt32());
            Assert.All(pagina.GetProperty("elementos").EnumerateArray(), r => Assert.Equal(estado, r.GetProperty("estado").GetString()));
        }

        var porAmbiente = await Listar(admin, $"?ambienteId={e.AmbienteB}");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a", ("a", e.AmbienteB)), porAmbiente.GetProperty("total").GetInt32());

        var desde = await Listar(admin, $"?ambienteId={e.AmbienteA}&desde=2031-05-11");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND fecha >= '2031-05-11'", ("a", e.AmbienteA)), desde.GetProperty("total").GetInt32());

        var hasta = await Listar(admin, $"?ambienteId={e.AmbienteA}&hasta=2031-05-11");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND fecha <= '2031-05-11'", ("a", e.AmbienteA)), hasta.GetProperty("total").GetInt32());

        var rango = await Listar(admin, $"?ambienteId={e.AmbienteA}&desde=2031-05-11&hasta=2031-05-12");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND fecha BETWEEN '2031-05-11' AND '2031-05-12'", ("a", e.AmbienteA)), rango.GetProperty("total").GetInt32());

        var combinado = await Listar(admin, $"?estado={Pendiente}&ambienteId={e.AmbienteA}&desde=2031-05-11&hasta=2031-05-11");
        Assert.Equal(2, combinado.GetProperty("total").GetInt32());
    }

    [FactConBaseDeDatos]
    public async Task El_listado_va_ordenado_por_fecha_y_paginado_de_10_en_10_con_el_total()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        var ambiente = await datos.CrearAmbienteAsync();
        // 12 reservas Pendientes en días distintos (se insertan desordenadas a propósito).
        foreach (var dia in new[] { 20, 5, 17, 9, 28, 2, 14, 23, 11, 26, 7, 19 })
        {
            await datos.CrearReservaAsync(ambiente, e.Ana, $"2032-01-{dia:00}", "09:00", "10:00", Pendiente);
        }
        using var api = new ApiConBaseReal();
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);

        var primera = await Listar(admin, $"?ambienteId={ambiente}");
        var segunda = await Listar(admin, $"?ambienteId={ambiente}&pagina=2");
        var tercera = await Listar(admin, $"?ambienteId={ambiente}&pagina=3");

        Assert.Equal(12, primera.GetProperty("total").GetInt32());
        Assert.Equal(10, primera.GetProperty("elementos").GetArrayLength());
        Assert.Equal(2, segunda.GetProperty("elementos").GetArrayLength());
        Assert.Equal(2, segunda.GetProperty("pagina").GetInt32());
        Assert.Equal(0, tercera.GetProperty("elementos").GetArrayLength());
        Assert.Equal(12, tercera.GetProperty("total").GetInt32());

        var fechas = primera.GetProperty("elementos").EnumerateArray().Concat(segunda.GetProperty("elementos").EnumerateArray())
            .Select(r => r.GetProperty("fecha").GetString()).ToList();
        Assert.Equal(fechas.OrderBy(f => f, StringComparer.Ordinal), fechas);
    }

    [FactConBaseDeDatos]
    public async Task Los_filtros_mal_escritos_dan_400_por_campo_y_nunca_500()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);

        var respuesta = await admin.GetAsync("/api/reservas?estado=Vencida&desde=05/11/2026&hasta=2031-01-01&pagina=0");

        Assert.Equal(HttpStatusCode.BadRequest, respuesta.StatusCode);
        var errores = (await respuesta.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Elige un estado de la lista.", errores.GetProperty("estado")[0].GetString());
        Assert.Equal("Ingresa la fecha con el formato dd/mm/aaaa.", errores.GetProperty("desde")[0].GetString());
        Assert.Equal("La página debe ser 1 o mayor.", errores.GetProperty("pagina")[0].GetString());
    }

    // ======================================================================== Dashboard: coherencia con la base
    [FactConBaseDeDatos]
    public async Task Dashboard_cada_indicador_coincide_con_una_consulta_SQL_directa_incluido_el_empate()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);

        var dashboard = await Leer(await admin.GetAsync("/api/dashboard"));

        // Indicadores
        var indicadores = dashboard.GetProperty("indicadores");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas"), indicadores.GetProperty("total").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE estado = 'Pendiente'"), indicadores.GetProperty("pendientes").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE estado = 'Aprobada'"), indicadores.GetProperty("aprobadas").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE estado = 'Rechazada'"), indicadores.GetProperty("rechazadas").GetInt32());

        // Ambiente más utilizado: el de más reservas Aprobadas y, en empate, todos los empatados.
        var esperados = await datos.ConsultarAsync(
            @"SELECT a.nombre, count(*)::int
              FROM reservas r JOIN ambientes a ON a.id = r.ambiente_id
              WHERE r.estado = 'Aprobada'
              GROUP BY a.id, a.nombre
              HAVING count(*) = (SELECT max(n) FROM (SELECT count(*) AS n FROM reservas WHERE estado = 'Aprobada' GROUP BY ambiente_id) t)
              ORDER BY a.nombre");
        Assert.True(esperados.Count >= 2, "los datos de la prueba deben producir un empate");
        var recibidos = dashboard.GetProperty("ambientesMasUtilizados").EnumerateArray()
            .Select(a => (a.GetProperty("nombre").GetString(), a.GetProperty("reservasAprobadas").GetInt32())).ToList();
        Assert.Equal(esperados.Select(f => ((string?)f[0], (int)f[1]!)), recibidos);

        // Las 5 pendientes más antiguas (por fecha de creación) y el total de pendientes para «Mostrando 5 de N».
        var antiguas = await datos.ConsultarAsync("SELECT id FROM reservas WHERE estado = 'Pendiente' ORDER BY fecha_creacion, id LIMIT 5");
        var pendientes = dashboard.GetProperty("pendientesMasAntiguas");
        Assert.Equal(antiguas.Select(f => (int)f[0]!), Ids(pendientes));
        Assert.Equal(indicadores.GetProperty("pendientes").GetInt32(), pendientes.GetProperty("total").GetInt32());
        Assert.Equal(5, pendientes.GetProperty("tamano").GetInt32());
    }

    // ======================================================================== Mi ambiente: coherencia con la base
    [FactConBaseDeDatos]
    public async Task MiAmbiente_indicadores_y_reservas_son_solo_las_de_su_ambiente_y_coinciden_con_la_base()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var mario = api.ClienteDe(e.Mario, RolUsuario.Responsable);

        var panel = await Leer(await mario.GetAsync("/api/mi-ambiente"));

        // Sin elegir: el primero por nombre de sus dos ambientes (zz-prueba-…-0 antes que …-1).
        Assert.Equal(e.AmbienteA, panel.GetProperty("ambiente").GetProperty("id").GetInt32());
        Assert.Equal(2, panel.GetProperty("ambientes").GetArrayLength());
        var indicadores = panel.GetProperty("indicadores");
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a", ("a", e.AmbienteA)), indicadores.GetProperty("total").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND estado = 'Pendiente'", ("a", e.AmbienteA)), indicadores.GetProperty("pendientes").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND estado = 'Aprobada'", ("a", e.AmbienteA)), indicadores.GetProperty("aprobadas").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND estado = 'Rechazada'", ("a", e.AmbienteA)), indicadores.GetProperty("rechazadas").GetInt32());
        var reservas = panel.GetProperty("reservas");
        Assert.Equal(indicadores.GetProperty("total").GetInt32(), reservas.GetProperty("total").GetInt32());
        Assert.All(reservas.GetProperty("elementos").EnumerateArray(), r => Assert.Equal(e.AmbienteA, r.GetProperty("ambienteId").GetInt32()));

        // Elige su otro ambiente.
        var delB = await Leer(await mario.GetAsync($"/api/mi-ambiente?ambienteId={e.AmbienteB}"));
        Assert.Equal(e.AmbienteB, delB.GetProperty("ambiente").GetProperty("id").GetInt32());
        Assert.Equal(await datos.ContarSqlAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a", ("a", e.AmbienteB)), delB.GetProperty("indicadores").GetProperty("total").GetInt32());

        // El de otra responsable: 404 (no se revela), no 500.
        var ajeno = await mario.GetAsync($"/api/mi-ambiente?ambienteId={e.AmbienteC}");
        Assert.Equal(HttpStatusCode.NotFound, ajeno.StatusCode);
    }

    [FactConBaseDeDatos]
    public async Task Los_paneles_estan_cerrados_a_los_demas_roles()
    {
        await using var datos = new DatosDePrueba();
        var e = await Escenario.CrearAsync(datos);
        using var api = new ApiConBaseReal();
        using var ana = api.ClienteDe(e.Ana, RolUsuario.Solicitante);
        using var mario = api.ClienteDe(e.Mario, RolUsuario.Responsable);
        using var admin = api.ClienteDe(e.AdministradorId, RolUsuario.Administrador);
        using var anonimo = api.CreateClient();

        Assert.Equal(HttpStatusCode.Forbidden, (await ana.GetAsync("/api/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await mario.GetAsync("/api/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ana.GetAsync("/api/mi-ambiente")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await admin.GetAsync("/api/mi-ambiente")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonimo.GetAsync("/api/reservas")).StatusCode);
    }
}
