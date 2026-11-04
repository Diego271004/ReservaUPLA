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

    public Ambiente Agregar(string nombre, int? responsableId = null)
    {
        var ambiente = new Ambiente
        {
            Id = Ambientes.Count + 1,
            Nombre = nombre,
            Tipo = TipoAmbiente.Laboratorio,
            Capacidad = 30,
            Ubicacion = "Pabellón A",
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

public sealed class FakeReservaRepository : IReservaRepository
{
    public List<Reserva> Reservas { get; } = new();
    public FiltroReservas? UltimoFiltro { get; private set; }

    public Task<Reserva?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken) =>
        Task.FromResult(Reservas.FirstOrDefault(reserva => reserva.Id == id));

    public Task<IReadOnlyList<ReservaDto>> ListarAsync(FiltroReservas filtro, CancellationToken cancellationToken)
    {
        UltimoFiltro = filtro;
        return Task.FromResult<IReadOnlyList<ReservaDto>>(new List<ReservaDto>());
    }

    public Task<bool> ExisteAprobadaQueSeCruzaAsync(
        int ambienteId, DateOnly fecha, TimeOnly horaInicio, TimeOnly horaFin, CancellationToken cancellationToken) =>
        Task.FromResult(false);

    public Task CrearAsync(Reserva reserva, CancellationToken cancellationToken)
    {
        reserva.Id = Reservas.Count + 1;
        Reservas.Add(reserva);
        return Task.CompletedTask;
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

/// <summary>Regla de negocio de prueba para comprobar el punto de extensión de la Fase 6.</summary>
public sealed class FakeReglaReserva : IReglaReserva
{
    private readonly KeyValuePair<string, string>? _error;

    public FakeReglaReserva(KeyValuePair<string, string>? error)
    {
        _error = error;
    }

    public Task<KeyValuePair<string, string>?> EvaluarAsync(Reserva reserva, CancellationToken cancellationToken) =>
        Task.FromResult(_error);
}
