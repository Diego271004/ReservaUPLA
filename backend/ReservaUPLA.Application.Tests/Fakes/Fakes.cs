using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Fakes;

/// <summary>Repositorio en memoria: busca por coincidencia exacta, como el índice único de la base.</summary>
public sealed class FakeUsuarioRepository : IUsuarioRepository
{
    public List<Usuario> Usuarios { get; } = new();

    public Usuario Agregar(string correo, RolUsuario rol = RolUsuario.Solicitante, bool activo = true, string hash = "fake-hash:Clave#123")
    {
        var usuario = new Usuario
        {
            Id = Usuarios.Count + 1,
            NombreCompleto = "Persona " + (Usuarios.Count + 1),
            Correo = correo,
            Rol = rol,
            Activo = activo,
            ContrasenaHash = hash,
        };
        Usuarios.Add(usuario);
        return usuario;
    }

    public Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken) =>
        Task.FromResult(Usuarios.FirstOrDefault(usuario => usuario.Correo == correo));

    public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        Task.FromResult(Usuarios.FirstOrDefault(usuario => usuario.Id == id));

    public Task<IReadOnlyList<Usuario>> ObtenerPorIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<Usuario>>(Usuarios.Where(usuario => ids.Contains(usuario.Id)).ToList());

    public Task<IReadOnlyList<Usuario>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<Usuario>>(Usuarios.Where(usuario => rol is null || usuario.Rol == rol).ToList());

    public Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken)
    {
        usuario.Id = Usuarios.Count + 1;
        Usuarios.Add(usuario);
        return Task.CompletedTask;
    }
}

public sealed class FakeAmbienteRepository : IAmbienteRepository
{
    public List<Ambiente> Ambientes { get; } = new();

    public Ambiente Agregar(string nombre, int? responsableId = null, EstadoAmbiente estado = EstadoAmbiente.Disponible)
    {
        var ambiente = new Ambiente
        {
            Id = Ambientes.Count + 1,
            Nombre = nombre,
            Tipo = TipoAmbiente.Laboratorio,
            Capacidad = 30,
            Ubicacion = "Pabellón A",
            Estado = estado,
            ResponsableId = responsableId,
        };
        Ambientes.Add(ambiente);
        return ambiente;
    }

    public Task<Ambiente?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        Task.FromResult(Ambientes.FirstOrDefault(ambiente => ambiente.Id == id));

    public Task<IReadOnlyList<Ambiente>> ListarAsync(CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<Ambiente>>(Ambientes.ToList());

    public Task<bool> ExisteNombreAsync(string nombre, CancellationToken cancellationToken) =>
        Task.FromResult(Ambientes.Any(ambiente => string.Equals(ambiente.Nombre, nombre, StringComparison.OrdinalIgnoreCase)));

    public Task AgregarAsync(Ambiente ambiente, CancellationToken cancellationToken)
    {
        ambiente.Id = Ambientes.Count + 1;
        Ambientes.Add(ambiente);
        return Task.CompletedTask;
    }
}

/// <summary>
/// Repositorio de reservas en memoria. Imita lo que hace la base: si al guardar se cruzan dos reservas Aprobadas del
/// mismo ambiente (la restricción de exclusión de RN-01), lanza <see cref="ConflictoDeHorarioException"/>.
/// </summary>
public sealed class FakeReservaRepository : IReservaRepository
{
    public List<Reserva> Reservas { get; } = new();
    public FiltroReservas? UltimoFiltro { get; private set; }
    public int Guardados { get; private set; }

    /// <summary>Se ejecuta justo antes de guardar: permite simular que otra aprobación se coló entre la comprobación y el guardado.</summary>
    public Action? AntesDeGuardar { get; set; }

    public Reserva Agregar(
        int ambienteId,
        string inicio,
        string fin,
        EstadoReserva estado = EstadoReserva.Pendiente,
        int usuarioId = 1,
        string fecha = "2026-11-05")
    {
        var reserva = Reserva.Crear(
            DateOnly.Parse(fecha), TimeOnly.Parse(inicio), TimeOnly.Parse(fin), "Motivo", usuarioId, ambienteId,
            new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.Zero));
        reserva.Id = Reservas.Count + 1;
        if (estado == EstadoReserva.Aprobada)
        {
            reserva.Aprobar(1, new DateTimeOffset(2026, 11, 3, 10, 0, 0, TimeSpan.Zero));
        }
        else if (estado == EstadoReserva.Rechazada)
        {
            reserva.Rechazar(1, new DateTimeOffset(2026, 11, 3, 10, 0, 0, TimeSpan.Zero));
        }
        else if (estado == EstadoReserva.Cancelada)
        {
            reserva.Cancelar(usuarioId, new DateTimeOffset(2026, 11, 3, 10, 0, 0, TimeSpan.Zero));
        }
        Reservas.Add(reserva);
        return reserva;
    }

    public Task<Reserva?> ObtenerConHistorialAsync(int id, CancellationToken cancellationToken) =>
        Task.FromResult(Reservas.FirstOrDefault(reserva => reserva.Id == id));

    public Task<IReadOnlyList<ReservaDto>> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken)
    {
        UltimoFiltro = filtro;
        return Task.FromResult<IReadOnlyList<ReservaDto>>(new List<ReservaDto>());
    }

    public Task<Reserva?> BuscarAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, int? excluirReservaId, CancellationToken cancellationToken) =>
        Task.FromResult(Reservas.FirstOrDefault(otra => SeCruzanAprobadas(otra, ambienteId, fecha, horaInicio, horaFin, excluirReservaId)));

    public Task AgregarAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        AntesDeGuardar?.Invoke();
        ExigirSinCruce(reserva);
        reserva.Id = Reservas.Count + 1;
        Reservas.Add(reserva);
        Guardados++;
        return Task.CompletedTask;
    }

    public Task GuardarAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        AntesDeGuardar?.Invoke();
        ExigirSinCruce(reserva);
        Guardados++;
        return Task.CompletedTask;
    }

    private static bool SeCruzanAprobadas(
        Reserva otra, int ambienteId, DateOnly fecha, TimeOnly inicio, TimeOnly fin, int? excluirId) =>
        otra.Estado == EstadoReserva.Aprobada
        && otra.AmbienteId == ambienteId
        && otra.Fecha == fecha
        && otra.Id != excluirId
        && otra.HoraInicio < fin
        && otra.HoraFin > inicio;

    private void ExigirSinCruce(Reserva reserva)
    {
        if (reserva.Estado == EstadoReserva.Aprobada
            && Reservas.Any(otra => !ReferenceEquals(otra, reserva)
                && SeCruzanAprobadas(otra, reserva.AmbienteId, reserva.Fecha, reserva.HoraInicio, reserva.HoraFin, reserva.Id)))
        {
            throw new ConflictoDeHorarioException(new InvalidOperationException("23P01 simulado"));
        }
    }
}

/// <summary>Hasher trivial y determinista que registra cada verificación.</summary>
public sealed class FakePasswordHasher : IPasswordHasher
{
    private const string Prefijo = "fake-hash:";

    public List<string> HashesVerificados { get; } = new();

    public string Hash(string contrasena) => Prefijo + contrasena;

    public bool Verificar(string contrasena, string hash)
    {
        HashesVerificados.Add(hash);
        return hash == Prefijo + contrasena;
    }
}

public sealed class FakeTokenGenerator : ITokenGenerator
{
    public static readonly DateTime Expiracion = new(2026, 11, 3, 13, 0, 0, DateTimeKind.Utc);

    public int Llamadas { get; private set; }

    public (string token, DateTime expiraEn) Generar(Usuario usuario)
    {
        Llamadas++;
        return ($"token-de-{usuario.Correo}", Expiracion);
    }
}

/// <summary>Reloj fijo para que las fechas de los eventos del historial sean predecibles.</summary>
public sealed class FakeTimeProvider : TimeProvider
{
    public static readonly DateTimeOffset Ahora = new(2026, 11, 3, 12, 0, 0, TimeSpan.Zero);

    public override DateTimeOffset GetUtcNow() => Ahora;
}

/// <summary>Regla de negocio de prueba para comprobar el punto de extensión.</summary>
public sealed class FakeReglaReserva : IReglaReserva
{
    private readonly ViolacionDeRegla? _violacion;

    public FakeReglaReserva(ViolacionDeRegla? violacion)
    {
        _violacion = violacion;
    }

    public Task<ViolacionDeRegla?> EvaluarAsync(Reserva reserva, Ambiente ambiente, CancellationToken cancellationToken) =>
        Task.FromResult(_violacion);
}
