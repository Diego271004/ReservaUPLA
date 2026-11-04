using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

/// <summary>Detalle de una reserva (quién puede verla) y consulta de disponibilidad.</summary>
public class ReservaConsultaTests
{
    private readonly ReservaFixture _escenario = new();

    private int ReservaDeAna(int ambiente = ReservaFixture.Laboratorio) =>
        _escenario.Reservas.Agregar(ambiente, "10:00", "12:00", EstadoReserva.Pendiente, _escenario.Solicitante.UsuarioId).Id;

    // ===================================================================== Detalle

    [Fact]
    public async Task El_Administrador_ve_cualquier_reserva_con_su_historial_y_los_nombres()
    {
        var id = _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada, _escenario.Solicitante.UsuarioId).Id;

        var resultado = await _escenario.CrearServicio().ObtenerAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var detalle = resultado.Valor!;
        Assert.Equal("Laboratorio de Cómputo 2", detalle.Reserva.AmbienteNombre);
        Assert.Equal("Persona 2", detalle.Reserva.SolicitanteNombre);
        Assert.Equal("Aprobada", detalle.Reserva.Estado);
        Assert.Equal(["Pendiente", "Aprobada"], detalle.Historial.Select(evento => evento.EstadoNuevo).ToArray());
        Assert.Equal(["Persona 2", "Persona 1"], detalle.Historial.Select(evento => evento.UsuarioNombre).ToArray());
    }

    [Fact]
    public async Task La_solicitante_ve_su_reserva_y_la_responsable_del_ambiente_tambien()
    {
        var id = ReservaDeAna();

        var propia = await _escenario.CrearServicio().ObtenerAsync(id, _escenario.Solicitante, CancellationToken.None);
        var delAmbiente = await _escenario.CrearServicio().ObtenerAsync(id, _escenario.Responsable, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, propia.Estado);
        Assert.Equal(EstadoOperacion.Exitoso, delAmbiente.Estado);
    }

    [Fact]
    public async Task Quien_no_puede_ver_una_reserva_recibe_NoEncontrado_y_no_se_revela_que_existe()
    {
        var id = ReservaDeAna(ReservaFixture.Laboratorio);

        var otraSolicitante = await _escenario.CrearServicio().ObtenerAsync(id, _escenario.OtraSolicitante, CancellationToken.None);
        var otroResponsable = await _escenario.CrearServicio().ObtenerAsync(id, _escenario.OtroResponsable, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, otraSolicitante.Estado);
        Assert.Equal(EstadoOperacion.NoEncontrado, otroResponsable.Estado);
    }

    [Fact]
    public async Task Una_reserva_que_no_existe_da_NoEncontrado()
    {
        var resultado = await _escenario.CrearServicio().ObtenerAsync(99, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, resultado.Estado);
    }

    // ===================================================================== Disponibilidad

    private Task<ResultadoOperacion<DisponibilidadDto>> Consultar(
        int? ambiente = ReservaFixture.Laboratorio, string? fecha = "2026-11-05", string? inicio = "10:00", string? fin = "12:00") =>
        _escenario.CrearServicio().ConsultarDisponibilidadAsync(new ConsultarDisponibilidadDto(ambiente, fecha, inicio, fin), CancellationToken.None);

    [Fact]
    public async Task Sin_reservas_aprobadas_el_ambiente_esta_disponible()
    {
        var resultado = await Consultar();

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.True(resultado.Valor!.Disponible);
        Assert.Equal("Disponible: no hay reservas aprobadas en ese horario", resultado.Valor.Mensaje);
    }

    [Fact]
    public async Task Las_reservas_Pendientes_no_ocupan_el_ambiente()
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Pendiente);

        var resultado = await Consultar();

        Assert.True(resultado.Valor!.Disponible);
    }

    [Fact]
    public async Task Con_una_Aprobada_que_se_cruza_avisa_la_hora_ocupada_como_en_la_pantalla_04e()
    {
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada);

        var resultado = await Consultar(inicio: "11:00", fin: "13:00");

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.False(resultado.Valor!.Disponible);
        Assert.Equal(
            "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.",
            resultado.Valor.Mensaje);
    }

    [Fact]
    public async Task Un_ambiente_en_mantenimiento_no_esta_disponible()
    {
        var resultado = await Consultar(ambiente: ReservaFixture.EnMantenimiento);

        Assert.False(resultado.Valor!.Disponible);
        Assert.Equal(MensajesValidacion.AmbienteEnMantenimiento, resultado.Valor.Mensaje);
    }

    [Fact]
    public async Task Datos_incompletos_o_invalidos_devuelven_errores_por_campo()
    {
        var vacios = await Consultar(ambiente: null, fecha: "", inicio: "", fin: "");
        var rn03 = await Consultar(inicio: "12:00", fin: "10:00");
        var rn04 = await Consultar(inicio: "06:00", fin: "08:00");

        Assert.Equal(EstadoOperacion.DatosInvalidos, vacios.Estado);
        Assert.Equal(MensajesValidacion.AmbienteVacio, vacios.Errores[CamposFormulario.AmbienteId][0]);
        Assert.Equal(MensajesValidacion.FechaVacia, vacios.Errores[CamposFormulario.Fecha][0]);
        Assert.Equal(MensajesValidacion.HoraInicioVacia, vacios.Errores[CamposFormulario.HoraInicio][0]);
        Assert.Equal(MensajesValidacion.HoraFinVacia, vacios.Errores[CamposFormulario.HoraFin][0]);
        Assert.Equal(MensajesValidacion.HoraFinNoPosterior, rn03.Errores[CamposFormulario.HoraFin][0]);
        Assert.Equal(MensajesValidacion.HoraFueraDeHorario, rn04.Errores[CamposFormulario.HoraInicio][0]);
    }

    [Fact]
    public async Task Un_ambiente_inexistente_devuelve_error_en_el_ambiente()
    {
        var resultado = await Consultar(ambiente: 99);

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.AmbienteInexistente, resultado.Errores[CamposFormulario.AmbienteId][0]);
    }
}
