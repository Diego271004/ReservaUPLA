using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Persistence;
using ReservaUPLA.Infrastructure.Repositories;

namespace ReservaUPLA.Infrastructure.Tests.BaseDeDatos;

/// <summary>
/// RN-01 en la última barrera: la restricción de exclusión de PostgreSQL (SQLSTATE 23P01), con la base real y el rol de la
/// aplicación. Dos aprobaciones que el servicio no pudo distinguir (cada una vio al otro como Pendiente) se guardan en
/// contextos distintos: la segunda se traduce a <see cref="ConflictoDeHorarioException"/>, nunca a un error 500.
/// </summary>
public class ReservaRepositorioConBaseRealTests
{
    private static ReservaUPLADbContext NuevoContexto() =>
        new(new DbContextOptionsBuilder<ReservaUPLADbContext>().UseNpgsql(VariablesDeBaseDeDatos.ObtenerApp()).Options);

    [FactConBaseDeDatos]
    public async Task RN01_la_base_rechaza_la_segunda_aprobacion_que_se_cruza_y_se_traduce_a_conflicto()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        var ambiente = await datos.CrearAmbienteAsync();
        var primera = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-15", "10:00", "12:00");
        var segunda = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-15", "11:00", "13:00");

        await using var contextoA = NuevoContexto();
        await using var contextoB = NuevoContexto();
        var repositorioA = new ReservaRepository(contextoA);
        var repositorioB = new ReservaRepository(contextoB);
        var reservaA = (await repositorioA.ObtenerConHistorialAsync(primera, default))!;
        var reservaB = (await repositorioB.ObtenerConHistorialAsync(segunda, default))!;

        // Las dos se cargaron como Pendientes y ninguna ve a la otra Aprobada: ambas "pasan" la comprobación del servicio.
        reservaA.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow);
        reservaB.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow);

        await repositorioA.GuardarAsync(reservaA, default);
        await Assert.ThrowsAsync<ConflictoDeHorarioException>(() => repositorioB.GuardarAsync(reservaB, default));

        Assert.Equal(1, await datos.ContarAprobadasAsync(ambiente));
        Assert.Equal("Aprobada", await datos.EstadoDeAsync(primera));
        Assert.Equal("Pendiente", await datos.EstadoDeAsync(segunda));
    }

    [FactConBaseDeDatos]
    public async Task La_aprobacion_rechazada_no_deja_el_evento_de_historial_porque_el_cambio_y_el_evento_van_juntos()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        var ambiente = await datos.CrearAmbienteAsync();
        var primera = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-16", "10:00", "12:00");
        var segunda = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-16", "10:30", "11:30");

        await using var contextoA = NuevoContexto();
        await using var contextoB = NuevoContexto();
        var repositorioA = new ReservaRepository(contextoA);
        var repositorioB = new ReservaRepository(contextoB);
        var reservaA = (await repositorioA.ObtenerConHistorialAsync(primera, default))!;
        var reservaB = (await repositorioB.ObtenerConHistorialAsync(segunda, default))!;
        reservaA.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow);
        reservaB.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow);

        await repositorioA.GuardarAsync(reservaA, default);
        await Assert.ThrowsAsync<ConflictoDeHorarioException>(() => repositorioB.GuardarAsync(reservaB, default));

        Assert.Equal(2, await datos.ContarEventosAsync(primera)); // Pendiente y Aprobada
        Assert.Equal(1, await datos.ContarEventosAsync(segunda)); // solo el Pendiente original: nada quedó a medias
    }

    [FactConBaseDeDatos]
    public async Task Una_reserva_nueva_se_guarda_con_su_primer_evento_en_la_misma_operacion()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        var ambiente = await datos.CrearAmbienteAsync();

        await using var contexto = NuevoContexto();
        var repositorio = new ReservaRepository(contexto);
        var reserva = Domain.Entities.Reserva.Crear(
            new DateOnly(2030, 1, 17), new TimeOnly(9, 0), new TimeOnly(10, 0), "Registro", datos.SolicitanteId, ambiente, DateTimeOffset.UtcNow);

        await repositorio.AgregarAsync(reserva, default);

        Assert.True(reserva.Id > 0);
        Assert.Equal("Pendiente", await datos.EstadoDeAsync(reserva.Id));
        Assert.Equal(1, await datos.ContarEventosAsync(reserva.Id));
    }

    [FactConBaseDeDatos]
    public async Task Buscar_una_Aprobada_que_se_cruza_ignora_la_propia_reserva_y_los_horarios_que_solo_se_tocan()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        var ambiente = await datos.CrearAmbienteAsync();
        var id = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-18", "10:00", "12:00");
        await using var contextoA = NuevoContexto();
        var repositorio = new ReservaRepository(contextoA);
        var reserva = (await repositorio.ObtenerConHistorialAsync(id, default))!;
        reserva.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow);
        await repositorio.GuardarAsync(reserva, default);

        await using var consulta = NuevoContexto();
        var repo = new ReservaRepository(consulta);
        var fecha = new DateOnly(2030, 1, 18);

        var solapa = await repo.BuscarAprobadaQueSeCruzaAsync(ambiente, fecha, new TimeOnly(11, 0), new TimeOnly(13, 0), null, default);
        var propia = await repo.BuscarAprobadaQueSeCruzaAsync(ambiente, fecha, new TimeOnly(10, 0), new TimeOnly(12, 0), id, default);
        var contigua = await repo.BuscarAprobadaQueSeCruzaAsync(ambiente, fecha, new TimeOnly(12, 0), new TimeOnly(14, 0), null, default);

        Assert.Equal(id, solapa?.Id);
        Assert.Null(propia);
        Assert.Null(contigua);
        Assert.Equal(EstadoReserva.Aprobada, solapa!.Estado);
    }

    [FactConBaseDeDatos]
    public async Task La_actividad_reciente_trae_primero_el_cambio_mas_nuevo_con_quien_lo_hizo_y_respeta_el_limite()
    {
        await using var datos = new DatosDePrueba();
        await datos.InicializarAsync();
        var ambiente = await datos.CrearAmbienteAsync();
        var id = await datos.CrearReservaPendienteAsync(ambiente, "2030-01-19", "10:00", "12:00");
        await using var contextoA = NuevoContexto();
        var repositorioA = new ReservaRepository(contextoA);
        var reserva = (await repositorioA.ObtenerConHistorialAsync(id, default))!;
        reserva.Aprobar(datos.AdministradorId, DateTimeOffset.UtcNow.AddMinutes(5));
        await repositorioA.GuardarAsync(reserva, default);

        await using var consulta = NuevoContexto();
        var repo = new ReservaRepository(consulta);

        var ultimo = await repo.ActividadRecienteAsync(1, default);
        var dos = await repo.ActividadRecienteAsync(2, default);

        var evento = Assert.Single(ultimo);
        Assert.Equal(id, evento.ReservaId);
        Assert.Equal("Pendiente", evento.EstadoAnterior);
        Assert.Equal("Aprobada", evento.EstadoNuevo);
        Assert.Equal("Carla Rojas", evento.UsuarioNombre);
        Assert.Equal("Ana Torres", evento.SolicitanteNombre);
        Assert.Equal("2030-01-19", evento.FechaReserva);
        Assert.Equal("10:00", evento.HoraInicio);
        // Lo más nuevo primero: la aprobación va antes que la solicitud original.
        Assert.Equal(["Aprobada", "Pendiente"], dos.Take(2).Select(e => e.EstadoNuevo));
        Assert.True(dos.Count <= 2);
    }
}
