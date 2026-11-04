using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Reglas;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Application.Validators;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

/// <summary>
/// Escenario común de las pruebas de reservas: cuatro personas y tres ambientes, con las reglas de negocio reales
/// (mantenimiento y RN-01) y repositorios en memoria.
/// </summary>
public sealed class ReservaFixture
{
    public FakeUsuarioRepository Usuarios { get; } = new();
    public FakeAmbienteRepository Ambientes { get; } = new();
    public FakeReservaRepository Reservas { get; } = new();

    public ActorDto Administrador { get; }
    public ActorDto Solicitante { get; }
    public ActorDto OtraSolicitante { get; }
    public ActorDto Responsable { get; }
    public ActorDto OtroResponsable { get; }

    public const int Laboratorio = 1;
    public const int Auditorio = 2;
    public const int EnMantenimiento = 3;

    public ReservaFixture()
    {
        Administrador = Actor("carla.rojas@upla.edu.pe", RolUsuario.Administrador);
        Solicitante = Actor("ana.torres@upla.edu.pe", RolUsuario.Solicitante);
        OtraSolicitante = Actor("luis.quispe@upla.edu.pe", RolUsuario.Solicitante);
        Responsable = Actor("mario.huaman@upla.edu.pe", RolUsuario.Responsable);
        OtroResponsable = Actor("rosa.chavez@upla.edu.pe", RolUsuario.Responsable);

        Ambientes.Agregar("Laboratorio de Cómputo 2", Responsable.UsuarioId);
        Ambientes.Agregar("Auditorio Principal", OtroResponsable.UsuarioId);
        Ambientes.Agregar("Sala de Reuniones A", Responsable.UsuarioId, EstadoAmbiente.EnMantenimiento);
    }

    private ActorDto Actor(string correo, RolUsuario rol) => new(Usuarios.Agregar(correo, rol).Id, rol);

    public ConsultaService CrearServicioDeConsulta() => new(new ConsultaReservasValidator(), Reservas, Ambientes);

    public ReservaService CrearServicio(params IReglaReserva[] reglasExtra)
    {
        var comprobador = new ComprobadorDeHorario(Reservas);
        var reloj = new FakeTimeProvider();
        IReglaReserva[] reglas =
        [
            new ReglaAmbienteDisponible(),
            new ReglaFechaNoPasada(reloj),
            new ReglaSinCruceConAprobadas(comprobador),
            .. reglasExtra,
        ];
        return new ReservaService(
            new CrearReservaValidator(),
            new ConsultarDisponibilidadValidator(),
            Reservas,
            Ambientes,
            Usuarios,
            reglas,
            comprobador,
            reloj);
    }

    public static CrearReservaDto Solicitud(
        int ambienteId = Laboratorio, string fecha = "2026-11-05", string inicio = "10:00", string fin = "12:00") =>
        new(ambienteId, fecha, inicio, fin, "Práctica de programación");
}
