using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Application.Validators;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

public class ReservaServiceTests
{
    private readonly FakeUsuarioRepository _usuarios = new();
    private readonly FakeAmbienteRepository _ambientes = new();
    private readonly FakeReservaRepository _reservas = new();

    public ReservaServiceTests()
    {
        _usuarios.Agregar("ana.torres@upla.edu.pe");
        _ambientes.Agregar("Laboratorio de Cómputo 2");
    }

    private ReservaService CrearServicio(params IReglaReserva[] reglas) =>
        new(new CrearReservaValidator(), _reservas, _ambientes, _usuarios, reglas);

    private static CrearReservaDto Valida() => new(1, "2026-11-05", "10:00", "12:00", "Práctica de programación");

    private Task<ResultadoOperacion<ReservaDto>> Crear(CrearReservaDto dto, params IReglaReserva[] reglas) =>
        CrearServicio(reglas).CrearAsync(dto, 1, CancellationToken.None);

    [Fact]
    public async Task Campos_vacios_devuelven_un_error_por_campo_RN02()
    {
        var resultado = await Crear(new CrearReservaDto(null, "", "", "", ""));

        Assert.Equal(MensajesValidacion.AmbienteVacio, resultado.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Equal(MensajesValidacion.FechaVacia, resultado.Errores[CamposFormulario.Fecha][0]);
        Assert.Equal(MensajesValidacion.HoraInicioVacia, resultado.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Equal(MensajesValidacion.HoraFinVacia, resultado.Errores[CamposFormulario.HoraFin][0]);
        Assert.Equal(MensajesValidacion.MotivoVacio, resultado.Errores[CamposFormulario.Motivo][0]);
        Assert.Empty(_reservas.Reservas);
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
    public async Task Hora_de_inicio_antes_de_las_0700_se_rechaza_RN04(string inicio, string fin)
    {
        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(MensajesValidacion.HoraFueraDeHorario, resultado.Errores[CamposFormulario.HoraInicio][0]);
    }

    [Theory]
    [InlineData("21:00", "22:30")]
    [InlineData("21:00", "22:01")]
    public async Task Hora_de_fin_despues_de_las_2200_se_rechaza_RN04(string inicio, string fin)
    {
        var resultado = await Crear(Valida() with { HoraInicio = inicio, HoraFin = fin });

        Assert.Equal(MensajesValidacion.HoraFueraDeHorario, resultado.Errores[CamposFormulario.HoraFin][0]);
    }

    [Theory]
    [InlineData("10:00", "10:00")]
    [InlineData("10:00", "09:30")]
    public async Task Hora_de_fin_no_posterior_al_inicio_se_rechaza_RN03(string inicio, string fin)
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

    [Fact]
    public async Task Ambiente_inexistente_se_rechaza()
    {
        var resultado = await Crear(Valida() with { AmbienteId = 99 });

        Assert.Equal(MensajesValidacion.AmbienteInexistente, resultado.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Empty(_reservas.Reservas);
    }

    [Fact]
    public async Task Reserva_valida_queda_Pendiente_a_nombre_de_quien_la_pide()
    {
        var resultado = await Crear(Valida() with { Motivo = "  Práctica de programación " });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var guardada = Assert.Single(_reservas.Reservas);
        Assert.Equal(EstadoReserva.Pendiente, guardada.Estado);
        Assert.Equal(1, guardada.UsuarioId);
        Assert.Equal(new DateOnly(2026, 11, 5), guardada.Fecha);
        Assert.Equal(new TimeOnly(10, 0), guardada.HoraInicio);
        Assert.Equal("Práctica de programación", guardada.Motivo);

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
        var regla = new FakeReglaReserva(new KeyValuePair<string, string>(CamposFormulario.HoraInicio, "Horario ocupado."));

        var resultado = await Crear(Valida(), regla);

        Assert.Equal("Horario ocupado.", resultado.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Empty(_reservas.Reservas);
    }

    [Fact]
    public async Task Punto_de_extension_una_regla_que_no_objeta_deja_guardar()
    {
        var resultado = await Crear(Valida(), new FakeReglaReserva(null));

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Theory]
    [InlineData(RolUsuario.Administrador, null, null)]
    [InlineData(RolUsuario.Solicitante, 7, null)]
    [InlineData(RolUsuario.Responsable, null, 7)]
    public async Task Listar_aplica_el_filtro_del_rol(RolUsuario rol, int? usuarioEsperado, int? responsableEsperado)
    {
        await CrearServicio().ListarAsync(7, rol, CancellationToken.None);

        Assert.Equal(new FiltroReservas(usuarioEsperado, responsableEsperado), _reservas.UltimoFiltro);
    }
}
