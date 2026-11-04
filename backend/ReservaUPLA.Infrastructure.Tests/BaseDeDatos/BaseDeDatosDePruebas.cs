using Npgsql;
using Xunit;

namespace ReservaUPLA.Infrastructure.Tests.BaseDeDatos;

/// <summary>
/// Pruebas con la base real (PostgreSQL con los scripts de database/ ya aplicados). Se omiten si no están estas variables:
///   RESERVAUPLA_PRUEBAS_BD_ADMIN  cadena de conexión con permiso para insertar y borrar (por ejemplo, postgres)
///   RESERVAUPLA_PRUEBAS_BD_APP    cadena de conexión del rol reservaupla_app (la que usa la aplicación)
/// Cada prueba crea sus propios datos con nombres únicos y los borra al terminar.
/// </summary>
public static class VariablesDeBaseDeDatos
{
    public const string Admin = "RESERVAUPLA_PRUEBAS_BD_ADMIN";
    public const string App = "RESERVAUPLA_PRUEBAS_BD_APP";

    public static string? ObtenerAdmin() => Environment.GetEnvironmentVariable(Admin);
    public static string? ObtenerApp() => Environment.GetEnvironmentVariable(App);
}

/// <summary>[Fact] que se omite (y lo dice) cuando no hay base de datos de pruebas configurada.</summary>
public sealed class FactConBaseDeDatosAttribute : FactAttribute
{
    public FactConBaseDeDatosAttribute()
    {
        if (string.IsNullOrWhiteSpace(VariablesDeBaseDeDatos.ObtenerAdmin()) || string.IsNullOrWhiteSpace(VariablesDeBaseDeDatos.ObtenerApp()))
        {
            Skip = $"Defina {VariablesDeBaseDeDatos.Admin} y {VariablesDeBaseDeDatos.App} para ejecutar las pruebas con la base real.";
        }
    }
}

/// <summary>Datos de prueba creados y borrados con la conexión de administración.</summary>
public sealed class DatosDePrueba : IAsyncDisposable
{
    private readonly NpgsqlDataSource _admin = NpgsqlDataSource.Create(VariablesDeBaseDeDatos.ObtenerAdmin()!);
    private readonly string _sufijo = Guid.NewGuid().ToString("N")[..8];
    private readonly List<int> _ambientes = new();

    public int AdministradorId { get; private set; }
    public int SolicitanteId { get; private set; }

    public async Task InicializarAsync()
    {
        AdministradorId = await EscalarAsync("SELECT id FROM usuarios WHERE correo = 'carla.rojas@upla.edu.pe'");
        SolicitanteId = await EscalarAsync("SELECT id FROM usuarios WHERE correo = 'ana.torres@upla.edu.pe'");
    }

    public async Task<int> CrearAmbienteAsync()
    {
        var id = await EscalarAsync(
            "INSERT INTO ambientes (nombre, tipo, capacidad, ubicacion) VALUES (@nombre, 'Sala', 10, 'Prueba') RETURNING id",
            ("nombre", $"zz-prueba-{_sufijo}-{_ambientes.Count}"));
        _ambientes.Add(id);
        return id;
    }

    /// <summary>Una reserva Pendiente con su primer evento de historial, como la deja la aplicación.</summary>
    public async Task<int> CrearReservaPendienteAsync(int ambienteId, string fecha, string inicio, string fin)
    {
        var id = await EscalarAsync(
            @"INSERT INTO reservas (fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id)
              VALUES (@fecha::date, @inicio::time, @fin::time, 'Prueba de concurrencia', 'Pendiente', @usuario, @ambiente) RETURNING id",
            ("fecha", fecha), ("inicio", inicio), ("fin", fin), ("usuario", SolicitanteId), ("ambiente", ambienteId));
        await EjecutarAsync(
            "INSERT INTO historial_reserva (reserva_id, estado_anterior, estado_nuevo, usuario_id) VALUES (@reserva, NULL, 'Pendiente', @usuario)",
            ("reserva", id), ("usuario", SolicitanteId));
        return id;
    }

    public Task<int> ContarAprobadasAsync(int ambienteId) =>
        EscalarAsync("SELECT count(*)::int FROM reservas WHERE ambiente_id = @a AND estado = 'Aprobada'", ("a", ambienteId));

    public Task<string> EstadoDeAsync(int reservaId) => EscalarTextoAsync("SELECT estado FROM reservas WHERE id = @r", ("r", reservaId));

    public Task<int> ContarEventosAsync(int reservaId) =>
        EscalarAsync("SELECT count(*)::int FROM historial_reserva WHERE reserva_id = @r", ("r", reservaId));

    private async Task<int> EscalarAsync(string sql, params (string, object)[] parametros) =>
        Convert.ToInt32(await EjecutarEscalarAsync(sql, parametros));

    private async Task<string> EscalarTextoAsync(string sql, params (string, object)[] parametros) =>
        (string)(await EjecutarEscalarAsync(sql, parametros))!;

    private async Task<object?> EjecutarEscalarAsync(string sql, (string, object)[] parametros)
    {
        await using var comando = _admin.CreateCommand(sql);
        foreach (var (nombre, valor) in parametros)
        {
            comando.Parameters.AddWithValue(nombre, valor);
        }
        return await comando.ExecuteScalarAsync();
    }

    private async Task EjecutarAsync(string sql, params (string, object)[] parametros) => await EjecutarEscalarAsync(sql, parametros);

    public async ValueTask DisposeAsync()
    {
        foreach (var ambienteId in _ambientes)
        {
            await EjecutarAsync(
                "DELETE FROM historial_reserva WHERE reserva_id IN (SELECT id FROM reservas WHERE ambiente_id = @a)", ("a", ambienteId));
            await EjecutarAsync("DELETE FROM reservas WHERE ambiente_id = @a", ("a", ambienteId));
            await EjecutarAsync("DELETE FROM ambientes WHERE id = @a", ("a", ambienteId));
        }
        await _admin.DisposeAsync();
    }
}
