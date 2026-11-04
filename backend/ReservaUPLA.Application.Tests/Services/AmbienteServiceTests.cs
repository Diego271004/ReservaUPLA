using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Application.Validators;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

public class AmbienteServiceTests
{
    private readonly FakeUsuarioRepository _usuarios = new();
    private readonly FakeAmbienteRepository _ambientes = new();
    private readonly AmbienteService _servicio;

    public AmbienteServiceTests()
    {
        _servicio = new AmbienteService(new CrearAmbienteValidator(), _ambientes, _usuarios);
    }

    private static CrearAmbienteDto Valido() =>
        new("Auditorio Principal", "Auditorio", 200, "Pabellón B, piso 1", "Disponible", null);

    private Task<ResultadoOperacion<AmbienteDto>> Crear(CrearAmbienteDto dto) => _servicio.CrearAsync(dto, CancellationToken.None);

    [Fact]
    public async Task Campos_vacios_devuelven_un_error_por_campo()
    {
        var resultado = await Crear(new CrearAmbienteDto("", "", null, "", "", null));

        Assert.Equal(MensajesValidacion.NombreAmbienteVacio, resultado.Errores[CamposFormulario.Nombre][0]);
        Assert.Equal(MensajesValidacion.TipoVacio, resultado.Errores[CamposFormulario.Tipo][0]);
        Assert.Equal(MensajesValidacion.CapacidadVacia, resultado.Errores[CamposFormulario.Capacidad][0]);
        Assert.Equal(MensajesValidacion.UbicacionVacia, resultado.Errores[CamposFormulario.Ubicacion][0]);
        Assert.Equal(MensajesValidacion.EstadoAmbienteVacio, resultado.Errores[CamposFormulario.Estado][0]);
        Assert.False(resultado.Errores.ContainsKey(CamposFormulario.ResponsableId));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(5001)]
    public async Task Capacidad_fuera_de_rango_se_rechaza(int capacidad)
    {
        var resultado = await Crear(Valido() with { Capacidad = capacidad });

        Assert.Equal(MensajesValidacion.CapacidadInvalida, resultado.Errores[CamposFormulario.Capacidad][0]);
    }

    [Fact]
    public async Task Tipo_y_estado_fuera_de_la_lista_se_rechazan()
    {
        var resultado = await Crear(Valido() with { Tipo = "Cancha", Estado = "Roto" });

        Assert.Equal(MensajesValidacion.TipoInvalido, resultado.Errores[CamposFormulario.Tipo][0]);
        Assert.Equal(MensajesValidacion.EstadoAmbienteInvalido, resultado.Errores[CamposFormulario.Estado][0]);
    }

    [Fact]
    public async Task Nombre_duplicado_se_rechaza_sin_distinguir_mayusculas()
    {
        _ambientes.Agregar("Auditorio Principal");

        var resultado = await Crear(Valido() with { Nombre = "  auditorio principal " });

        Assert.Equal(MensajesValidacion.NombreAmbienteDuplicado, resultado.Errores[CamposFormulario.Nombre][0]);
        Assert.Single(_ambientes.Ambientes);
    }

    [Fact]
    public async Task Responsable_inexistente_se_rechaza()
    {
        var resultado = await Crear(Valido() with { ResponsableId = 99 });

        Assert.Equal(MensajesValidacion.ResponsableInvalido, resultado.Errores[CamposFormulario.ResponsableId][0]);
    }

    [Fact]
    public async Task Responsable_que_no_tiene_ese_rol_o_esta_inactivo_se_rechaza()
    {
        var solicitante = _usuarios.Agregar("a@upla.edu.pe", RolUsuario.Solicitante);
        var inactivo = _usuarios.Agregar("b@upla.edu.pe", RolUsuario.Responsable, activo: false);

        var conSolicitante = await Crear(Valido() with { ResponsableId = solicitante.Id });
        var conInactivo = await Crear(Valido() with { ResponsableId = inactivo.Id });

        Assert.Equal(EstadoOperacion.DatosInvalidos, conSolicitante.Estado);
        Assert.Equal(EstadoOperacion.DatosInvalidos, conInactivo.Estado);
    }

    [Fact]
    public async Task Ambiente_valido_se_guarda_y_devuelve_el_responsable()
    {
        var responsable = _usuarios.Agregar("mario@upla.edu.pe", RolUsuario.Responsable);

        var resultado = await Crear(Valido() with { Nombre = " Sala de Reuniones A ", Estado = "En mantenimiento", ResponsableId = responsable.Id });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var guardado = Assert.Single(_ambientes.Ambientes);
        Assert.Equal("Sala de Reuniones A", guardado.Nombre);
        Assert.Equal(EstadoAmbiente.EnMantenimiento, guardado.Estado);
        Assert.Equal("En mantenimiento", resultado.Valor!.Estado);
        Assert.Equal(responsable.NombreCompleto, resultado.Valor.ResponsableNombre);
    }

    [Fact]
    public async Task Ambiente_sin_responsable_es_valido()
    {
        var resultado = await Crear(Valido());

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        Assert.Null(resultado.Valor!.ResponsableId);
    }

    [Fact]
    public async Task Listar_incluye_el_nombre_del_responsable()
    {
        var responsable = _usuarios.Agregar("mario@upla.edu.pe", RolUsuario.Responsable);
        _ambientes.Agregar("Laboratorio de Cómputo 2", responsable.Id);
        _ambientes.Agregar("Auditorio Principal");

        var lista = await _servicio.ListarAsync(CancellationToken.None);

        Assert.Equal(responsable.NombreCompleto, lista[0].ResponsableNombre);
        Assert.Null(lista[1].ResponsableNombre);
    }
}
