using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Salida de datos (RF-05 y RF-08): la lista de Reservas con filtros y páginas, el Dashboard del Administrador y Mi ambiente
/// del Responsable. Solo lee: no cambia ninguna reserva. El alcance de cada rol se aplica aquí, no en la pantalla.
/// </summary>
public sealed class ConsultaService : IConsultaService
{
    public const int TamanoDePagina = 10;
    public const int PendientesDelDashboard = 5;
    /// <summary>Cuántos cambios de estado recientes muestra el dashboard del Administrador.</summary>
    public const int ActividadRecienteDelDashboard = 6;

    private readonly IValidator<ConsultaReservasDto> _validador;
    private readonly IReservaRepository _reservas;
    private readonly IAmbienteRepository _ambientes;

    public ConsultaService(IValidator<ConsultaReservasDto> validador, IReservaRepository reservas, IAmbienteRepository ambientes)
    {
        _validador = validador;
        _reservas = reservas;
        _ambientes = ambientes;
    }

    public async Task<ResultadoOperacion<PaginaDeReservasDto>> ListarAsync(
        ActorDto actor, ConsultaReservasDto consulta, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(consulta);

        if (ResultadoOperacion<PaginaDeReservasDto>.SiNoEsValido(await _validador.ValidateAsync(consulta, cancellationToken)) is { } invalido)
        {
            return invalido;
        }

        var filtro = new FiltroReservas(
            UsuarioId: actor.Rol == RolUsuario.Solicitante ? actor.UsuarioId : null,
            ResponsableId: actor.Rol == RolUsuario.Responsable ? actor.UsuarioId : null,
            Estado: consulta.Estado is null ? null : Enum.Parse<EstadoReserva>(consulta.Estado),
            AmbienteId: consulta.AmbienteId,
            Desde: Fecha(consulta.Desde),
            Hasta: Fecha(consulta.Hasta),
            Pagina: consulta.Pagina ?? 1,
            Tamano: TamanoDePagina);

        return ResultadoOperacion<PaginaDeReservasDto>.Exitoso(await _reservas.ListarAsync(filtro, cancellationToken));
    }

    /// <summary>Las reservas que siguen vigentes (aprobadas o pendientes); una cancelada o rechazada ya no ocupa el ambiente.</summary>
    private static List<ReservaDto> Vigentes(IEnumerable<ReservaDto> reservas) =>
        reservas.Where(r => r.Estado is "Aprobada" or "Pendiente").ToList();

    public async Task<DashboardDto> ObtenerDashboardAsync(ActorDto actor, CancellationToken cancellationToken)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-5));

        if (actor.Rol == RolUsuario.Solicitante)
        {
            var solicitudes = await _reservas.ListarAsync(
                new FiltroReservas(UsuarioId: actor.UsuarioId, Desde: hoy, Pagina: 1, Tamano: 1000, Orden: OrdenReservas.PorFecha),
                cancellationToken);
            var resumen = new List<IndicadorEstadoDto>();
            foreach (var estado in new[] { EstadoReserva.Pendiente, EstadoReserva.Aprobada, EstadoReserva.Rechazada, EstadoReserva.Cancelada })
            {
                var pagina = await _reservas.ListarAsync(
                    new FiltroReservas(UsuarioId: actor.UsuarioId, Estado: estado, Pagina: 1, Tamano: 1),
                    cancellationToken);
                resumen.Add(new IndicadorEstadoDto(estado.ToString(), pagina.Total));
            }
            // La «próxima reserva» es la más cercana que sigue vigente: primero la aprobada, y si no hay, la pendiente.
            // Una cancelada o rechazada no es una reserva próxima.
            var proxima = solicitudes.Elementos.FirstOrDefault(r => r.Estado == "Aprobada")
                ?? solicitudes.Elementos.FirstOrDefault(r => r.Estado == "Pendiente");
            var inicioSolicitante = new InicioSolicitanteDto(proxima, solicitudes.Elementos.ToList(), resumen);
            return new DashboardDto(
                new IndicadoresDto(solicitudes.Total, resumen.FirstOrDefault(x => x.Estado == "Pendiente")?.Total ?? 0,
                    resumen.FirstOrDefault(x => x.Estado == "Aprobada")?.Total ?? 0,
                    resumen.FirstOrDefault(x => x.Estado == "Rechazada")?.Total ?? 0),
                [], new PaginaDeReservasDto([], 0, 1, 5), [], [], [], inicioSolicitante, null);
        }

        if (actor.Rol == RolUsuario.Responsable)
        {
            var propios = await _ambientes.ListarPorResponsableAsync(actor.UsuarioId, cancellationToken);
            var hoyReservas = await _reservas.ListarAsync(
                new FiltroReservas(ResponsableId: actor.UsuarioId, Desde: hoy, Hasta: hoy, Pagina: 1, Tamano: 1000),
                cancellationToken);
            var proximas = await _reservas.ListarAsync(
                new FiltroReservas(ResponsableId: actor.UsuarioId, Desde: hoy.AddDays(1), Pagina: 1, Tamano: 1000),
                cancellationToken);
            var resumenes = propios.Select(ADto).ToList();
            // Las listas de «Hoy» y «Próximas» son lo que el Responsable tiene por delante: solo reservas vigentes (aprobadas o pendientes).
            // Las canceladas y rechazadas no ocupan el ambiente; los indicadores de abajo siguen contando todos los estados.
            var inicioResponsable = new InicioResponsableDto(resumenes, Vigentes(hoyReservas.Elementos), Vigentes(proximas.Elementos));
            return new DashboardDto(new IndicadoresDto(hoyReservas.Total + proximas.Total, hoyReservas.Elementos.Count(r => r.Estado == "Pendiente"), hoyReservas.Elementos.Count(r => r.Estado == "Aprobada") + proximas.Elementos.Count(r => r.Estado == "Aprobada"), hoyReservas.Elementos.Count(r => r.Estado == "Rechazada") + proximas.Elementos.Count(r => r.Estado == "Rechazada")), [], new PaginaDeReservasDto([], 0, 1, 5), [], [], [], null, inicioResponsable);
        }

        var indicadores = await _reservas.ContarAsync(null, cancellationToken);
        var masUtilizados = await _reservas.AmbientesMasUtilizadosAsync(cancellationToken);
        var usoPorAmbiente = await _reservas.UsoPorAmbienteAsync(cancellationToken);
        var actividad = await _reservas.ActividadRecienteAsync(ActividadRecienteDelDashboard, cancellationToken);
        var pendientes = await _reservas.ListarAsync(
            new FiltroReservas(Estado: EstadoReserva.Pendiente, Pagina: 1, Tamano: PendientesDelDashboard, Orden: OrdenReservas.PorAntiguedad),
            cancellationToken);

        var ambientes = await _ambientes.ListarAsync(cancellationToken);
        var estadosPorAmbiente = ambientes.ToDictionary(ambiente => ambiente.Id, ambiente => ambiente);
        var decisiones = new List<SolicitudDecisionDto>();
        foreach (var reserva in pendientes.Elementos)
        {
            var ambiente = estadosPorAmbiente.GetValueOrDefault(reserva.AmbienteId);
            Reserva? choque = null;
            if (DateOnly.TryParse(reserva.Fecha, out var fecha)
                && TimeOnly.TryParse(reserva.HoraInicio, out var inicio)
                && TimeOnly.TryParse(reserva.HoraFin, out var fin))
            {
                choque = await _reservas.BuscarAprobadaQueSeCruzaAsync(
                    reserva.AmbienteId, fecha, inicio, fin, reserva.Id, cancellationToken);
            }
            decisiones.Add(new SolicitudDecisionDto(reserva, choque is not null, ambiente?.Estado == EstadoAmbiente.EnMantenimiento));
        }

        var aprobadasHoy = await _reservas.ListarAsync(
            new FiltroReservas(Estado: EstadoReserva.Aprobada, Desde: hoy, Hasta: hoy, Pagina: 1, Tamano: 1000),
            cancellationToken);
        var agenda = ambientes
            .OrderBy(ambiente => ambiente.Nombre)
            .Select(ambiente => new AgendaAmbienteDto(ambiente.Id, ambiente.Nombre, TextosDominio.ATexto(ambiente.Estado), aprobadasHoy.Elementos.Where(reserva => reserva.AmbienteId == ambiente.Id).ToList()))
            .ToList();

        return new DashboardDto(indicadores, masUtilizados, pendientes, decisiones, agenda, usoPorAmbiente, null, null, actividad);
    }

    public async Task<ResultadoOperacion<MiAmbienteDto>> ObtenerMiAmbienteAsync(
        int responsableId, int? ambienteId, int? pagina, CancellationToken cancellationToken)
    {
        var validacion = await _validador.ValidateAsync(new ConsultaReservasDto(null, null, null, null, pagina), cancellationToken);
        if (ResultadoOperacion<MiAmbienteDto>.SiNoEsValido(validacion) is { } invalido)
        {
            return invalido;
        }

        var propios = await _ambientes.ListarPorResponsableAsync(responsableId, cancellationToken);
        var resumenes = propios.Select(ADto).ToList();

        // Sin ambientes a cargo: la pantalla lo dice, no es un error.
        if (propios.Count == 0)
        {
            return ResultadoOperacion<MiAmbienteDto>.Exitoso(new MiAmbienteDto(
                null, resumenes, new IndicadoresDto(0, 0, 0, 0), new PaginaDeReservasDto([], 0, 1, TamanoDePagina)));
        }

        // Un ambiente que no es suyo no existe para él (no se revela que está ahí).
        var elegido = ambienteId is null ? propios[0] : propios.FirstOrDefault(ambiente => ambiente.Id == ambienteId);
        if (elegido is null)
        {
            return ResultadoOperacion<MiAmbienteDto>.NoEncontrado();
        }

        var indicadores = await _reservas.ContarAsync(elegido.Id, cancellationToken);
        var reservas = await _reservas.ListarAsync(
            new FiltroReservas(AmbienteId: elegido.Id, Pagina: pagina ?? 1, Tamano: TamanoDePagina), cancellationToken);

        return ResultadoOperacion<MiAmbienteDto>.Exitoso(new MiAmbienteDto(ADto(elegido), resumenes, indicadores, reservas));
    }

    public async Task<ResultadoOperacion<DisponibilidadDiaDto>> ObtenerDisponibilidadDiaAsync(
        ActorDto actor, string fecha, CancellationToken cancellationToken)
    {
        if (!DateOnly.TryParseExact(fecha, "yyyy-MM-dd", out var dia))
        {
            return ResultadoOperacion<DisponibilidadDiaDto>.DatosInvalidos("fecha", "Ingresa una fecha válida.");
        }

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-5));
        IReadOnlyList<Ambiente> ambientes;
        if (actor.Rol == RolUsuario.Responsable)
        {
            ambientes = await _ambientes.ListarPorResponsableAsync(actor.UsuarioId, cancellationToken);
        }
        else
        {
            ambientes = await _ambientes.ListarAsync(cancellationToken);
        }

        var reservas = await _reservas.ListarAsync(
            new FiltroReservas(
                UsuarioId: actor.Rol == RolUsuario.Solicitante ? null : null,
                ResponsableId: actor.Rol == RolUsuario.Responsable ? actor.UsuarioId : null,
                Desde: dia,
                Hasta: dia,
                Pagina: 1,
                Tamano: 1000,
                Orden: OrdenReservas.PorFecha),
            cancellationToken);

        var porAmbiente = reservas.Elementos
            .Where(reserva => reserva.Estado == "Pendiente" || reserva.Estado == "Aprobada")
            .GroupBy(reserva => reserva.AmbienteId)
            .ToDictionary(grupo => grupo.Key, grupo => grupo.ToList());

        var salida = ambientes
            .OrderBy(ambiente => ambiente.Nombre)
            .Select(ambiente =>
            {
                var bloques = porAmbiente.TryGetValue(ambiente.Id, out var propias)
                    ? propias.Select(reserva =>
                    {
                        var propia = actor.Rol != RolUsuario.Solicitante || reserva.UsuarioId == actor.UsuarioId;
                        var esResponsable = actor.Rol == RolUsuario.Responsable;
                        return new BloqueDisponibilidadDto(
                            reserva.Id,
                            reserva.HoraInicio,
                            reserva.HoraFin,
                            reserva.Estado,
                            propia || esResponsable || actor.Rol == RolUsuario.Administrador ? reserva.SolicitanteNombre : null,
                            propia || actor.Rol == RolUsuario.Administrador ? reserva.Motivo : null,
                            propia);
                    }).ToList()
                    : new List<BloqueDisponibilidadDto>();
                return new DisponibilidadDiaAmbienteDto(
                    ambiente.Id,
                    ambiente.Nombre,
                    TextosDominio.ATexto(ambiente.Estado),
                    bloques);
            }).ToList();

        return ResultadoOperacion<DisponibilidadDiaDto>.Exitoso(
            new DisponibilidadDiaDto(fecha, dia < hoy, salida));
    }

    private static DateOnly? Fecha(string? texto) => HorarioReserva.TryFecha(texto, out var fecha) ? fecha : null;

    private static AmbienteResumenDto ADto(Ambiente ambiente) =>
        new(ambiente.Id, ambiente.Nombre, ambiente.Ubicacion, ambiente.Capacidad, TextosDominio.ATexto(ambiente.Estado));
}
