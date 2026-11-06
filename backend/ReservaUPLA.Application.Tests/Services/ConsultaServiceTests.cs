using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

/// <summary>Lista de Reservas, Dashboard y Mi ambiente: qué consulta arma cada rol y cómo se validan los filtros.</summary>
public class ConsultaServiceTests
{
    private readonly ReservaFixture _escenario = new();

    private static ConsultaReservasDto SinFiltros() => new(null, null, null, null, null);

    // ---------------------------------------------------------------- Listado: qué ve cada rol
    [Theory]
    [InlineData(RolUsuario.Administrador, null, null)]
    [InlineData(RolUsuario.Solicitante, 7, null)]
    [InlineData(RolUsuario.Responsable, null, 7)]
    public async Task Listar_aplica_el_alcance_del_rol(RolUsuario rol, int? usuarioEsperado, int? responsableEsperado)
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ListarAsync(new ActorDto(7, rol), SinFiltros(), CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var filtro = _escenario.Reservas.UltimoFiltro!;
        Assert.Equal(usuarioEsperado, filtro.UsuarioId);
        Assert.Equal(responsableEsperado, filtro.ResponsableId);
    }

    [Fact]
    public async Task Listar_sin_filtros_pide_la_pagina_1_de_10_ordenada_por_fecha()
    {
        await _escenario.CrearServicioDeConsulta().ListarAsync(_escenario.Administrador, SinFiltros(), CancellationToken.None);

        var filtro = _escenario.Reservas.UltimoFiltro!;
        Assert.Equal(1, filtro.Pagina);
        Assert.Equal(10, filtro.Tamano);
        Assert.Equal(OrdenReservas.PorFecha, filtro.Orden);
        Assert.Null(filtro.Estado);
        Assert.Null(filtro.AmbienteId);
        Assert.Null(filtro.Desde);
        Assert.Null(filtro.Hasta);
    }

    [Fact]
    public async Task Listar_traduce_cada_filtro()
    {
        var consulta = new ConsultaReservasDto("Aprobada", 3, "2030-01-02", "2030-01-31", 2);

        await _escenario.CrearServicioDeConsulta().ListarAsync(_escenario.Administrador, consulta, CancellationToken.None);

        var filtro = _escenario.Reservas.UltimoFiltro!;
        Assert.Equal(EstadoReserva.Aprobada, filtro.Estado);
        Assert.Equal(3, filtro.AmbienteId);
        Assert.Equal(new DateOnly(2030, 1, 2), filtro.Desde);
        Assert.Equal(new DateOnly(2030, 1, 31), filtro.Hasta);
        Assert.Equal(2, filtro.Pagina);
    }

    [Fact]
    public async Task Listar_devuelve_lo_que_responde_el_repositorio_con_su_total()
    {
        _escenario.Reservas.PaginaARetornar = new PaginaDeReservasDto(new List<ReservaDto>(), 23, 3, 10);

        var resultado = await _escenario.CrearServicioDeConsulta().ListarAsync(_escenario.Administrador, SinFiltros(), CancellationToken.None);

        Assert.Equal(23, resultado.Valor!.Total);
        Assert.Equal(3, resultado.Valor.Pagina);
    }

    // ---------------------------------------------------------------- Listado: filtros inválidos (400, sin consultar la base)
    [Theory]
    [InlineData("Vencida")]
    [InlineData("pendiente ")]
    public async Task Listar_con_un_estado_que_no_existe_da_400_en_estado(string estado)
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ListarAsync(_escenario.Administrador, SinFiltros() with { Estado = estado }, CancellationToken.None);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.EstadoFiltroInvalido, resultado.Errores[CamposFormulario.Estado][0]);
        Assert.Empty(_escenario.Reservas.Filtros);
    }

    [Theory]
    [InlineData("05/11/2026")]
    [InlineData("mañana")]
    public async Task Listar_con_fechas_mal_escritas_da_400_en_cada_campo(string fecha)
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ListarAsync(_escenario.Administrador, SinFiltros() with { Desde = fecha, Hasta = fecha }, CancellationToken.None);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.FechaFormatoInvalido, resultado.Errores[CamposFormulario.Desde][0]);
        Assert.Equal(MensajesValidacion.FechaFormatoInvalido, resultado.Errores[CamposFormulario.Hasta][0]);
    }

    [Fact]
    public async Task Listar_con_la_fecha_final_anterior_a_la_inicial_da_400_en_hasta()
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ListarAsync(_escenario.Administrador, SinFiltros() with { Desde = "2030-02-10", Hasta = "2030-02-09" }, CancellationToken.None);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.RangoDeFechasInvalido, resultado.Errores[CamposFormulario.Hasta][0]);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public async Task Listar_con_una_pagina_menor_que_1_da_400_en_pagina(int pagina)
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ListarAsync(_escenario.Administrador, SinFiltros() with { Pagina = pagina }, CancellationToken.None);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.PaginaInvalida, resultado.Errores[CamposFormulario.Pagina][0]);
    }

    // ---------------------------------------------------------------- Dashboard
    [Fact]
    public async Task Dashboard_arma_indicadores_ambientes_mas_utilizados_y_las_5_pendientes_mas_antiguas()
    {
        _escenario.Reservas.IndicadoresARetornar = new IndicadoresDto(48, 7, 31, 10);
        _escenario.Reservas.MasUtilizadosARetornar.Add(new AmbienteUsoDto(1, "Laboratorio de Cómputo 2", 14));
        _escenario.Reservas.MasUtilizadosARetornar.Add(new AmbienteUsoDto(2, "Auditorio Principal", 14));
        _escenario.Reservas.PaginaARetornar = new PaginaDeReservasDto(new List<ReservaDto>(), 7, 1, 5);

        var dashboard = await _escenario.CrearServicioDeConsulta().ObtenerDashboardAsync(new ActorDto(1, RolUsuario.Administrador), CancellationToken.None);

        Assert.Equal(new IndicadoresDto(48, 7, 31, 10), dashboard.Indicadores);
        Assert.Equal(["Laboratorio de Cómputo 2", "Auditorio Principal"], dashboard.AmbientesMasUtilizados.Select(a => a.Nombre));
        Assert.Equal(7, dashboard.PendientesMasAntiguas.Total);
        var filtroPendiente = Assert.Single(_escenario.Reservas.Filtros, filtro => filtro.Estado == EstadoReserva.Pendiente);
        Assert.Equal(OrdenReservas.PorAntiguedad, filtroPendiente.Orden);
        Assert.Equal(5, filtroPendiente.Tamano);
        Assert.Equal(1, filtroPendiente.Pagina);
        Assert.Null(filtroPendiente.UsuarioId);
        var filtroAprobadoHoy = Assert.Single(_escenario.Reservas.Filtros, filtro => filtro.Estado == EstadoReserva.Aprobada);
        Assert.Equal(1000, filtroAprobadoHoy.Tamano);
        Assert.Equal([(int?)null], _escenario.Reservas.AmbientesContados);
    }

    [Fact]
    public async Task Dashboard_solicitante_no_consulta_reservas_ajenas()
    {
        var dashboard = await _escenario.CrearServicioDeConsulta().ObtenerDashboardAsync(new ActorDto(42, RolUsuario.Solicitante), CancellationToken.None);

        Assert.NotNull(dashboard.InicioSolicitante);
        Assert.All(_escenario.Reservas.Filtros, filtro => Assert.Equal(42, filtro.UsuarioId));
        Assert.All(_escenario.Reservas.Filtros, filtro => Assert.Null(filtro.ResponsableId));
    }

    [Fact]
    public async Task Dashboard_responsable_no_consulta_ambientes_ajenos()
    {
        var dashboard = await _escenario.CrearServicioDeConsulta().ObtenerDashboardAsync(new ActorDto(77, RolUsuario.Responsable), CancellationToken.None);

        Assert.NotNull(dashboard.InicioResponsable);
        Assert.All(_escenario.Reservas.Filtros, filtro => Assert.Equal(77, filtro.ResponsableId));
        Assert.All(_escenario.Reservas.Filtros, filtro => Assert.Null(filtro.UsuarioId));
    }

    // ---------------------------------------------------------------- Mi ambiente
    [Fact]
    public async Task MiAmbiente_sin_elegir_muestra_el_primero_por_nombre_con_sus_indicadores_y_reservas()
    {
        _escenario.Reservas.IndicadoresARetornar = new IndicadoresDto(5, 1, 3, 1);

        var resultado = await _escenario.CrearServicioDeConsulta()
            .ObtenerMiAmbienteAsync(_escenario.Responsable.UsuarioId, null, null, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal("Laboratorio de Cómputo 2", resultado.Valor!.Ambiente!.Nombre);
        Assert.Equal(["Laboratorio de Cómputo 2", "Sala de Reuniones A"], resultado.Valor.Ambientes.Select(a => a.Nombre));
        Assert.Equal(new IndicadoresDto(5, 1, 3, 1), resultado.Valor.Indicadores);
        Assert.Equal([(int?)ReservaFixture.Laboratorio], _escenario.Reservas.AmbientesContados);
        var filtro = Assert.Single(_escenario.Reservas.Filtros);
        Assert.Equal(ReservaFixture.Laboratorio, filtro.AmbienteId);
        Assert.Equal(1, filtro.Pagina);
    }

    [Fact]
    public async Task MiAmbiente_permite_elegir_otro_de_sus_ambientes()
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ObtenerMiAmbienteAsync(_escenario.Responsable.UsuarioId, ReservaFixture.EnMantenimiento, 2, CancellationToken.None);

        Assert.Equal("Sala de Reuniones A", resultado.Valor!.Ambiente!.Nombre);
        Assert.Equal(ReservaFixture.EnMantenimiento, _escenario.Reservas.UltimoFiltro!.AmbienteId);
        Assert.Equal(2, _escenario.Reservas.UltimoFiltro.Pagina);
    }

    [Fact]
    public async Task MiAmbiente_de_un_ambiente_ajeno_da_NoEncontrado_y_no_consulta_nada()
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ObtenerMiAmbienteAsync(_escenario.Responsable.UsuarioId, ReservaFixture.Auditorio, null, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, resultado.Estado);
        Assert.Empty(_escenario.Reservas.Filtros);
        Assert.Empty(_escenario.Reservas.AmbientesContados);
    }

    [Fact]
    public async Task MiAmbiente_de_un_responsable_sin_ambientes_responde_vacio_sin_error()
    {
        var sinAmbientes = _escenario.Usuarios.Agregar("sin.ambiente@upla.edu.pe", RolUsuario.Responsable);

        var resultado = await _escenario.CrearServicioDeConsulta()
            .ObtenerMiAmbienteAsync(sinAmbientes.Id, null, null, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Null(resultado.Valor!.Ambiente);
        Assert.Empty(resultado.Valor.Ambientes);
        Assert.Equal(new IndicadoresDto(0, 0, 0, 0), resultado.Valor.Indicadores);
        Assert.Empty(resultado.Valor.Reservas.Elementos);
    }

    [Fact]
    public async Task MiAmbiente_con_una_pagina_menor_que_1_da_400()
    {
        var resultado = await _escenario.CrearServicioDeConsulta()
            .ObtenerMiAmbienteAsync(_escenario.Responsable.UsuarioId, null, 0, CancellationToken.None);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.PaginaInvalida, resultado.Errores[CamposFormulario.Pagina][0]);
    }

    [Fact]
    public async Task Disponibilidad_solicitante_oculta_motivo_y_nombre_de_reservas_ajenas()
    {
        _escenario.Reservas.PaginaARetornar = new PaginaDeReservasDto(
            [
                new ReservaDto(10, ReservaFixture.Laboratorio, "Laboratorio de Cómputo 2", _escenario.Solicitante.UsuarioId,
                    "Ana Torres", "2030-05-20", "10:00", "12:00", "Motivo propio", "Aprobada"),
                new ReservaDto(11, ReservaFixture.Laboratorio, "Laboratorio de Cómputo 2", _escenario.OtraSolicitante.UsuarioId,
                    "Luis Quispe", "2030-05-20", "12:00", "13:00", "Motivo ajeno", "Pendiente"),
            ], 2, 1, 1000);

        var resultado = await _escenario.CrearServicioDeConsulta().ObtenerDisponibilidadDiaAsync(
            _escenario.Solicitante, "2030-05-20", CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var laboratorio = resultado.Valor!.Ambientes.Single(a => a.Id == ReservaFixture.Laboratorio);
        Assert.Equal("Ana Torres", laboratorio.Bloques[0].SolicitanteNombre);
        Assert.Equal("Motivo propio", laboratorio.Bloques[0].Motivo);
        Assert.True(laboratorio.Bloques[0].Propia);
        Assert.Null(laboratorio.Bloques[1].SolicitanteNombre);
        Assert.Null(laboratorio.Bloques[1].Motivo);
        Assert.False(laboratorio.Bloques[1].Propia);
    }

    [Fact]
    public async Task Disponibilidad_responsable_consulta_solo_sus_ambientes()
    {
        var resultado = await _escenario.CrearServicioDeConsulta().ObtenerDisponibilidadDiaAsync(
            _escenario.Responsable, "2030-05-20", CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(
            ["Laboratorio de Cómputo 2", "Sala de Reuniones A"],
            resultado.Valor!.Ambientes.Select(a => a.Nombre));
        Assert.Equal(_escenario.Responsable.UsuarioId, _escenario.Reservas.UltimoFiltro!.ResponsableId);
    }
}
