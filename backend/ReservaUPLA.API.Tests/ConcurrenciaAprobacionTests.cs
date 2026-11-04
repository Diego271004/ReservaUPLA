using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Tests.BaseDeDatos;

namespace ReservaUPLA.API.Tests;

/// <summary>
/// RN-01 con la API completa y la base real: dos aprobaciones SIMULTÁNEAS de reservas que se cruzan. Una responde 200 y la
/// otra 409 con el mensaje de conflicto (no 500), y la base queda con una sola reserva Aprobada. Se repite varias veces
/// porque el resultado depende del instante en que llegan las peticiones: unas veces la segunda ya ve a la primera
/// Aprobada (comprobación del servicio) y otras ambas pasan esa comprobación y decide la restricción de exclusión (23P01).
/// Se omite si no hay base de datos de pruebas (ver BaseDeDatosDePruebas).
/// </summary>
[Collection("BaseReal")]
public class ConcurrenciaAprobacionTests
{
    private const int Repeticiones = 25;

    [FactConBaseDeDatos]
    public async Task RN01_dos_aprobaciones_simultaneas_que_se_cruzan_dan_un_200_y_un_409_y_una_sola_Aprobada()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        using var api = new ApiConBaseReal();
        using var cliente = api.ClienteDeAdministrador(datos.AdministradorId);

        for (var vuelta = 1; vuelta <= Repeticiones; vuelta++)
        {
            var ambiente = await datos.CrearAmbienteAsync();
            var fecha = $"2031-03-{vuelta:00}";
            var primera = await datos.CrearReservaPendienteAsync(ambiente, fecha, "10:00", "12:00");
            var segunda = await datos.CrearReservaPendienteAsync(ambiente, fecha, "11:00", "13:00");

            // Las dos peticiones esperan la misma señal de salida para llegar lo más juntas posible.
            var salida = new TaskCompletionSource();
            async Task<HttpResponseMessage> Aprobar(int id)
            {
                await salida.Task;
                return await cliente.PostAsync($"/api/reservas/{id}/aprobar", null);
            }

            var tareaA = Task.Run(() => Aprobar(primera));
            var tareaB = Task.Run(() => Aprobar(segunda));
            salida.SetResult();
            var respuestas = await Task.WhenAll(tareaA, tareaB);

            var codigos = respuestas.Select(r => (int)r.StatusCode).OrderBy(c => c).ToArray();
            Assert.True(codigos.SequenceEqual([200, 409]), $"Vuelta {vuelta}: se esperaba 200 y 409, pero fue {string.Join(" y ", codigos)}.");

            var perdedora = respuestas.Single(r => r.StatusCode == HttpStatusCode.Conflict);
            var mensaje = (await perdedora.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("mensaje").GetString();
            // Con hora ("...aprobada de 10:00 a 12:00") si la ganadora ya confirmó; sin hora si la base abortó la segunda antes.
            Assert.StartsWith("Ese ambiente ya tiene una reserva aprobada", mensaje);
            Assert.EndsWith(" Elige otro horario u otro ambiente.", mensaje);

            Assert.Equal(1, await datos.ContarAprobadasAsync(ambiente));
        }
    }

    [FactConBaseDeDatos]
    public async Task Una_reserva_rechazada_no_se_puede_aprobar_ni_por_la_API_con_la_base_real()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        using var api = new ApiConBaseReal();
        using var cliente = api.ClienteDeAdministrador(datos.AdministradorId);
        var ambiente = await datos.CrearAmbienteAsync();
        var id = await datos.CrearReservaPendienteAsync(ambiente, "2031-04-01", "09:00", "10:00");

        var rechazo = await cliente.PostAsync($"/api/reservas/{id}/rechazar", null);
        var aprobacion = await cliente.PostAsync($"/api/reservas/{id}/aprobar", null);

        Assert.Equal(HttpStatusCode.OK, rechazo.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, aprobacion.StatusCode);
        Assert.Equal("Una reserva rechazada no se puede modificar.", (await aprobacion.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("mensaje").GetString());
        Assert.Equal("Rechazada", await datos.EstadoDeAsync(id));
        Assert.Equal(2, await datos.ContarEventosAsync(id)); // Pendiente y Rechazada; el intento rechazado no dejó nada
    }
}
