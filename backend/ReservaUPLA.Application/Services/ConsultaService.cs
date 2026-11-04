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

    public async Task<DashboardDto> ObtenerDashboardAsync(CancellationToken cancellationToken)
    {
        var indicadores = await _reservas.ContarAsync(null, cancellationToken);
        var masUtilizados = await _reservas.AmbientesMasUtilizadosAsync(cancellationToken);
        var pendientes = await _reservas.ListarAsync(
            new FiltroReservas(Estado: EstadoReserva.Pendiente, Pagina: 1, Tamano: PendientesDelDashboard, Orden: OrdenReservas.PorAntiguedad),
            cancellationToken);

        return new DashboardDto(indicadores, masUtilizados, pendientes);
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

    private static DateOnly? Fecha(string? texto) => HorarioReserva.TryFecha(texto, out var fecha) ? fecha : null;

    private static AmbienteResumenDto ADto(Ambiente ambiente) =>
        new(ambiente.Id, ambiente.Nombre, ambiente.Ubicacion, ambiente.Capacidad, TextosDominio.ATexto(ambiente.Estado));
}
