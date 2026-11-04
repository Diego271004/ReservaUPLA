using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

/// <summary>Aprobar, rechazar y cancelar: RN-05 (solo el Administrador decide), RN-06 (estados finales) y RN-01 al aprobar.</summary>
public class ReservaCambioDeEstadoTests
{
    private readonly ReservaFixture _escenario = new();

    private int Pendiente(string inicio = "10:00", string fin = "12:00", int ambiente = ReservaFixture.Laboratorio) =>
        _escenario.Reservas.Agregar(ambiente, inicio, fin, EstadoReserva.Pendiente, _escenario.Solicitante.UsuarioId).Id;

    private int Aprobada(string inicio = "10:00", string fin = "12:00") =>
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, inicio, fin, EstadoReserva.Aprobada, _escenario.OtraSolicitante.UsuarioId).Id;

    private int EnEstado(EstadoReserva estado) =>
        _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "14:00", "16:00", estado, _escenario.Solicitante.UsuarioId).Id;

    private EstadoReserva EstadoDe(int id) => _escenario.Reservas.Reservas.Single(reserva => reserva.Id == id).Estado;

    private int EventosDe(int id) => _escenario.Reservas.Reservas.Single(reserva => reserva.Id == id).Historial.Count;

    // ===================================================================== Aprobar

    [Fact]
    public async Task El_Administrador_aprueba_una_reserva_Pendiente_y_queda_el_evento_en_el_historial()
    {
        var id = Pendiente();

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(EstadoReserva.Aprobada, EstadoDe(id));
        Assert.Equal("Aprobada", resultado.Valor!.Reserva.Estado);
        Assert.Equal(1, _escenario.Reservas.Guardados);

        var historial = resultado.Valor.Historial;
        Assert.Equal(2, historial.Count);
        Assert.Equal("Pendiente", historial[0].EstadoNuevo);
        Assert.Equal("Pendiente", historial[1].EstadoAnterior);
        Assert.Equal("Aprobada", historial[1].EstadoNuevo);
        Assert.Equal("Persona 1", historial[1].UsuarioNombre); // la Administradora
        Assert.Equal(FakeTimeProvider.Ahora, historial[1].Fecha);
    }

    [Theory]
    [InlineData(RolUsuario.Solicitante)]
    [InlineData(RolUsuario.Responsable)]
    public async Task RN05_quien_no_es_Administrador_no_puede_aprobar(RolUsuario rol)
    {
        var id = Pendiente();
        var actor = rol == RolUsuario.Solicitante ? _escenario.Solicitante : _escenario.Responsable;

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, actor, CancellationToken.None);

        Assert.Equal(EstadoOperacion.SinPermiso, resultado.Estado);
        Assert.Equal(EstadoReserva.Pendiente, EstadoDe(id));
        Assert.Equal(1, EventosDe(id));
        Assert.Equal(0, _escenario.Reservas.Guardados);
    }

    [Fact]
    public async Task Aprobar_una_reserva_que_no_existe_da_NoEncontrado()
    {
        var resultado = await _escenario.CrearServicio().AprobarAsync(99, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, resultado.Estado);
    }

    [Fact]
    public async Task RN01_no_se_aprueba_una_reserva_que_se_cruza_con_otra_Aprobada()
    {
        Aprobada("10:00", "12:00");
        var id = Pendiente("11:00", "13:00");

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(
            "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.",
            resultado.Mensaje);
        Assert.Equal(EstadoReserva.Pendiente, EstadoDe(id));
        Assert.Equal(1, EventosDe(id));
        Assert.Equal(0, _escenario.Reservas.Guardados);
    }

    [Fact]
    public async Task RN01_aprobar_una_reserva_no_choca_con_ella_misma_ni_con_otras_Pendientes()
    {
        Pendiente("10:00", "12:00");
        var id = Pendiente("10:30", "11:30");

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
    }

    [Fact]
    public async Task RN01_si_la_base_rechaza_el_cruce_al_guardar_el_resultado_es_el_mismo_conflicto_y_no_un_error()
    {
        // Dos aprobaciones simultáneas: la comprobación del servicio pasa en ambas y la base rechaza la segunda (23P01).
        var id = Pendiente("11:00", "13:00");
        _escenario.Reservas.AntesDeGuardar = () =>
        {
            _escenario.Reservas.AntesDeGuardar = null;
            _escenario.Reservas.Agregar(ReservaFixture.Laboratorio, "10:00", "12:00", EstadoReserva.Aprobada);
        };

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(
            "Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00. Elige otro horario u otro ambiente.",
            resultado.Mensaje);
    }

    [Fact]
    public async Task RN01_si_la_base_rechaza_y_no_se_encuentra_la_otra_reserva_se_usa_el_mensaje_sin_hora()
    {
        var id = Pendiente("11:00", "13:00");
        _escenario.Reservas.AntesDeGuardar = () => throw new ConflictoDeHorarioException(new InvalidOperationException("23P01"));

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(MensajesValidacion.ConflictoDeHorarioSinDetalle, resultado.Mensaje);
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada, MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, MensajesValidacion.ReservaCanceladaNoSeModifica)]
    [InlineData(EstadoReserva.Aprobada, MensajesValidacion.SoloPendienteSeApruebaORechaza)]
    public async Task RN06_aprobar_una_reserva_que_ya_no_esta_Pendiente_da_conflicto_con_el_mensaje_del_dominio(
        EstadoReserva estado, string mensaje)
    {
        var id = EnEstado(estado);

        var resultado = await _escenario.CrearServicio().AprobarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(mensaje, resultado.Mensaje);
        Assert.Equal(estado, EstadoDe(id));
    }

    // ===================================================================== Rechazar

    [Fact]
    public async Task El_Administrador_rechaza_una_reserva_Pendiente_y_queda_el_evento_en_el_historial()
    {
        var id = Pendiente();

        var resultado = await _escenario.CrearServicio().RechazarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(EstadoReserva.Rechazada, EstadoDe(id));
        Assert.Equal("Rechazada", resultado.Valor!.Historial.Last().EstadoNuevo);
        Assert.Equal(2, EventosDe(id));
    }

    [Theory]
    [InlineData(RolUsuario.Solicitante)]
    [InlineData(RolUsuario.Responsable)]
    public async Task RN05_quien_no_es_Administrador_no_puede_rechazar(RolUsuario rol)
    {
        var id = Pendiente();
        var actor = rol == RolUsuario.Solicitante ? _escenario.Solicitante : _escenario.Responsable;

        var resultado = await _escenario.CrearServicio().RechazarAsync(id, actor, CancellationToken.None);

        Assert.Equal(EstadoOperacion.SinPermiso, resultado.Estado);
        Assert.Equal(EstadoReserva.Pendiente, EstadoDe(id));
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada, MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, MensajesValidacion.ReservaCanceladaNoSeModifica)]
    [InlineData(EstadoReserva.Aprobada, MensajesValidacion.SoloPendienteSeApruebaORechaza)]
    public async Task RN06_rechazar_una_reserva_que_ya_no_esta_Pendiente_da_conflicto(EstadoReserva estado, string mensaje)
    {
        var id = EnEstado(estado);

        var resultado = await _escenario.CrearServicio().RechazarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(mensaje, resultado.Mensaje);
        Assert.Equal(estado, EstadoDe(id));
    }

    [Fact]
    public async Task Rechazar_una_reserva_que_no_existe_da_NoEncontrado()
    {
        var resultado = await _escenario.CrearServicio().RechazarAsync(99, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, resultado.Estado);
    }

    // ===================================================================== Cancelar

    [Theory]
    [InlineData(EstadoReserva.Pendiente)]
    [InlineData(EstadoReserva.Aprobada)]
    public async Task El_solicitante_dueño_cancela_su_reserva_Pendiente_o_Aprobada(EstadoReserva estado)
    {
        var id = EnEstado(estado);

        var resultado = await _escenario.CrearServicio().CancelarAsync(id, _escenario.Solicitante, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(EstadoReserva.Cancelada, EstadoDe(id));
        var ultimo = resultado.Valor!.Historial.Last();
        Assert.Equal(estado.ToString(), ultimo.EstadoAnterior);
        Assert.Equal("Cancelada", ultimo.EstadoNuevo);
    }

    [Fact]
    public async Task El_Administrador_puede_cancelar_cualquier_reserva_Pendiente_o_Aprobada()
    {
        var id = EnEstado(EstadoReserva.Aprobada);

        var resultado = await _escenario.CrearServicio().CancelarAsync(id, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Equal(EstadoReserva.Cancelada, EstadoDe(id));
    }

    [Fact]
    public async Task Otra_solicitante_no_puede_cancelar_una_reserva_ajena()
    {
        var id = Pendiente();

        var resultado = await _escenario.CrearServicio().CancelarAsync(id, _escenario.OtraSolicitante, CancellationToken.None);

        Assert.Equal(EstadoOperacion.SinPermiso, resultado.Estado);
        Assert.Equal(EstadoReserva.Pendiente, EstadoDe(id));
    }

    [Fact]
    public async Task La_Responsable_no_cancela_reservas()
    {
        var id = Pendiente();

        var resultado = await _escenario.CrearServicio().CancelarAsync(id, _escenario.Responsable, CancellationToken.None);

        Assert.Equal(EstadoOperacion.SinPermiso, resultado.Estado);
    }

    [Theory]
    [InlineData(EstadoReserva.Rechazada, MensajesValidacion.ReservaRechazadaNoSeModifica)]
    [InlineData(EstadoReserva.Cancelada, MensajesValidacion.ReservaCanceladaNoSeModifica)]
    public async Task RN06_cancelar_una_reserva_en_estado_final_da_conflicto(EstadoReserva estado, string mensaje)
    {
        var id = EnEstado(estado);

        var resultado = await _escenario.CrearServicio().CancelarAsync(id, _escenario.Solicitante, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, resultado.Estado);
        Assert.Equal(mensaje, resultado.Mensaje);
        Assert.Equal(estado, EstadoDe(id));
    }

    [Fact]
    public async Task Cancelar_una_reserva_que_no_existe_da_NoEncontrado()
    {
        var resultado = await _escenario.CrearServicio().CancelarAsync(99, _escenario.Solicitante, CancellationToken.None);

        Assert.Equal(EstadoOperacion.NoEncontrado, resultado.Estado);
    }

    [Fact]
    public async Task Cancelar_libera_el_horario_para_aprobar_otra_reserva()
    {
        var aprobada = Aprobada("10:00", "12:00");
        var pendiente = Pendiente("11:00", "13:00");
        var servicio = _escenario.CrearServicio();

        var antes = await servicio.AprobarAsync(pendiente, _escenario.Administrador, CancellationToken.None);
        await servicio.CancelarAsync(aprobada, _escenario.Administrador, CancellationToken.None);
        var despues = await servicio.AprobarAsync(pendiente, _escenario.Administrador, CancellationToken.None);

        Assert.Equal(EstadoOperacion.Conflicto, antes.Estado);
        Assert.Equal(EstadoOperacion.Exitoso, despues.Estado);
    }
}
