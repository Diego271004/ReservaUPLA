using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

/// <summary>Crear y listar reservas: RN-02, RN-03, RN-04, mantenimiento y RN-01 al registrar.</summary>
public class ReservaServiceTests
{
    private readonly ReservaFixture _escenario = new();

    private Task<ResultadoOperacion<ReservaDto>> Crear(CrearReservaDto dto, params IReglaReserva[] reglasExtra) =>
        _escenario.CrearServicio(reglasExtra).CrearAsync(dto, _escenario.Solicitante.UsuarioId, CancellationToken.None);

    private static CrearReservaDto Valida() => ReservaFixture.Solicitud();

    // ---------------------------------------------------------------- RN-02, RN-03, RN-04

    [Fact]
    public async Task RN02_campos_vacios_devuelven_un_error_por_campo()
    {
        var resultado = await Crear(new CrearReservaDto(null, "", "", "", ""));

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.AmbienteVacio, resultado.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Equal(MensajesValidacion.FechaVacia, resultado.Errores[CamposFormulario.Fecha][0]);
        Assert.Equal(MensajesValidacion.HoraInicioVacia, resultado.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Equal(MensajesValidacion.HoraFinVacia, resultado.Errores[CamposFormulario.HoraFin][0]);
        Assert.Equal(MensajesValidacion.MotivoVacio, resultado.Errores[CamposFormulario.Motivo][0]);
        Assert.Empty(_escenario.Reservas.Reservas);
    }

    [Theory]
    [InlineData("05/11/2026")]
    [InlineData("2026-13-45")]
    [InlineData("mañana")]
    public async Task Fecha_que_no_es_aaaa_mm_dd_se_rechaza(string fecha)
    {
        var resultado = await Crear(Valida() with { Fecha = fecha });

        Assert.Equal(MensajesValidacion.FechaFormatoInvalido, resultado.Errores[CamposFormulario.Fecha][0]);
    }

    [Theory]
    [InlineData("06:30", "08:00")]
    [InlineData("06:59", "08:00")]
    public async Task RN04_hora_de_inicio_antes_de_las_0700_se_rechaza(string inicio, string fin)
    {
        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(MensajesValidacion.HoraFueraDeHorario, resultado.Errores[CamposFormulario.HoraInicio][0]);
    }

    [Theory]
    [InlineData("21:00", "22:30")]
    [InlineData("21:00", "22:01")]
    public async Task RN04_hora_de_fin_despues_de_las_2200_se_rechaza(string inicio, string fin)
    {
        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(MensajesValidacion.HoraFueraDeHorario, resultado.Errores[CamposFormulario.HoraFin][0]);
    }

    [Theory]
    [InlineData("10:00", "10:00")]
    [InlineData("10:00", "09:30")]
    public async Task RN03_hora_de_fin_no_posterior_al_inicio_se_rechaza(string inicio, string fin)
    {
        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(MensajesValidacion.HoraFinNoPosterior, resultado.Errores[CamposFormulario.HoraFin][0]);
        Assert.False(resultado.Errores.ContainsKey(CamposFormulario.HoraInicio));
    }

    [Fact]
    public async Task Horas_con_formato_invalido_piden_seleccionar_la_hora()
    {
        var resultado = await Crear(Valida() with { HoraInicio = "10", HoraFin = "las doce" });

        Assert.Equal(MensajesValidacion.HoraInicioVacia, resultado.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Equal(MensajesValidacion.HoraFinVacia, resultado.Errores[CamposFormulario.HoraFin][0]);
    }

    [Fact]
    public async Task Los_limites_exactos_0700_y_2200_son_validos()
    {
        var resultado = await Crear(Valida() with { HoraInicio = "07:00", HoraFin = "22:00" });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Fact]
    public async Task Motivo_de_mas_de_300_caracteres_se_rechaza()
    {
        var resultado = await Crear(Valida() with { Motivo = new string('a', 301) });

        Assert.Equal(MensajesValidacion.MotivoDemasiadoLargo, resultado.Errores[CamposFormulario.Motivo][0]);
    }

    [Theory]
    [InlineData("2026-11-02")]
    [InlineData("2025-01-01")]
    public async Task RN07_una_fecha_anterior_a_hoy_se_rechaza(string fecha)
    {
        var resultado = await Crear(ReservaFixture.Solicitud(fecha: fecha));

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.FechaPasada, resultado.Errores[CamposFormulario.Fecha][0]);
        Assert.Empty(_escenario.Reservas.Reservas);
    }

    [Fact]
    public async Task RN07_la_fecha_de_hoy_es_valida()
    {
        var resultado = await Crear(ReservaFixture.Solicitud(fecha: "2026-11-03"));

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Fact]
    public async Task Ambiente_inexistente_se_rechaza()
    {
        var resultado = await Crear(Valida() with { AmbienteId = 99 });

        Assert.Equal(MensajesValidacion.AmbienteInexistente, resultado.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Empty(_escenario.Reservas.Reservas);
    }

    // ---------------------------------------------------------------- Ambiente en mantenimiento

    [Fact]
    public async Task Un_ambiente_en_mantenimiento_no_admite_reservas_nuevas()
    {
        var resultado = await Crear(Valida() with { AmbienteId = ReservaFixture.EnMantenimiento });

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.AmbienteEnMantenimiento, resultado.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Empty(_escenario.Reservas.Reservas);
    }

    // ---------------------------------------------------------------- RN-01 al registrar

    [Fact]
    public async Task RN01_una_reserva_que_se_cruza_con_una_Aprobada_se_rechaza_con_la_hora_ocupada()
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada, _escenario.OtraSolicitante.UsuarioId);

        var resultado = await Crear(Valida() with { HoraInicio = "11:00", HoraFin = "13:00" });

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(
            "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.",
            resultado.Mensaje);
        Assert.Single(_escenario.Reservas.Reservas);
    }

    [Theory]
    [InlineData("10:00", "12:00")] // mismo horario
    [InlineData("09:00", "10:30")] // cruza el inicio
    [InlineData("10:30", "11:30")] // dentro
    [InlineData("08:00", "14:00")] // contiene
    public async Task RN01_todo_cruce_con_una_Aprobada_es_conflicto(string inicio, string fin)
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada);

        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
    }

    [Theory]
    [InlineData("12:00", "14:00")] // empieza cuando la otra termina
    [InlineData("08:00", "10:00")] // termina cuando la otra empieza
    public async Task RN01_los_horarios_que_solo_se_tocan_no_son_conflicto(string inicio, string fin)
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada);

        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Fact]
    public async Task RN01_las_reservas_Pendientes_pueden_coexistir()
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Pendiente);

        var resultado = await Crear(Valida());

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(2, _escenario.Reservas.Reservas.Count);
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada)]
    [InlineData(EstadoReserva.Cancelada)]
    public async Task RN01_una_reserva_Rechazada_o_Cancelada_no_ocupa_el_ambiente(EstadoReserva estado)
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", estado);

        var resultado = await Crear(Valida());

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Fact]
    public async Task RN01_otro_ambiente_u_otra_fecha_no_es_conflicto()
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada);

        var otroAmbiente = await Crear(Valida() with { AmbienteId = ReservaFixture.Auditorio });
        var otraFecha = await Crear(Valida() with { Fecha = "2026-11-06" });

        Assert.Equal(EstadoOperacion.Exitoso, otroAmbiente.Estado);
        Assert.Equal(EstadoOperacion.Exitoso, otraFecha.Estado);
    }

    // ---------------------------------------------------------------- Registro correcto

    [Fact]
    public async Task Reserva_valida_queda_Pendiente_a_nombre_de_quien_la_pide_con_su_primer_evento()
    {
        var resultado = await Crear(Valida() with { Motivo = "  Práctica de programación " });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var guardada = Assert.Single(_escenario.Reservas.Reservas);
        Assert.Equal(EstadoReserva.Pendiente, guardada.Estado);
        Assert.Equal(_escenario.Solicitante.UsuarioId, guardada.UsuarioId);
        Assert.Equal(new DateOnly(2026, 11, 5), guardada.Fecha);
        Assert.Equal("Práctica de programación", guardada.Motivo);
        var evento = Assert.Single(guardada.Historial);
        Assert.Null(evento.EstadoAnterior);
        Assert.Equal(EstadoReserva.Pendiente, evento.EstadoNuevo);
        Assert.Equal(FakeTimeProvider.Ahora, evento.Fecha);

        var dto = resultado.Valor!;
        Assert.Equal("Pendiente", dto.Estado);
        Assert.Equal("Laboratorio de Cómputo 2", dto.AmbienteNombre);
        Assert.Equal("2026-11-05", dto.Fecha);
        Assert.Equal("10:00", dto.HoraInicio);
        Assert.Equal("12:00", dto.HoraFin);
    }

    [Fact]
    public async Task Punto_de_extension_una_regla_registrada_puede_rechazar_la_reserva()
    {
        var regla = new FakeReglaReserva(ViolacionDeRegla.EnCampo(CamposFormulario.HoraInicio, "Horario ocupado."));

        var resultado = await Crear(Valida(), regla);

        Assert.Equal("Horario ocupado.", resultado.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Empty(_escenario.Reservas.Reservas);
    }

    [Theory]
    [InlineData(RolUsuario.Administrador, null, null)]
    [InlineData(RolUsuario.Solicitante, 7, null)]
    [InlineData(RolUsuario.Responsable, null, 7)]
    public async Task Listar_aplica_el_filtro_del_rol(RolUsuario rol, int? usuarioEsperado, int? responsableEsperado)
    {
        await _escenario.CrearServicio().ListarAsync(7, rol, CancellationToken.None);

        Assert.Equal(new FiltroReservas(usuarioEsperado, responsableEsperado), _escenario.Reservas.UltimoFiltro);
    }
}
