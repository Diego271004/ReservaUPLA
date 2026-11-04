using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Application.Validators;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

public class UsuarioServiceTests
{
    private readonly FakeUsuarioRepository _usuarios = new();
    private readonly UsuarioService _servicio;

    public UsuarioServiceTests()
    {
        _servicio = new UsuarioService(
            new CrearUsuarioValidator(Options.Create(new OpcionesAutenticacion())), _usuarios, new FakePasswordHasher());
    }

    private static CrearUsuarioDto Valido() =>
        new("Luis Quispe", "luis.quispe@upla.edu.pe", "Solicitante", true, "Clave#123");

    private Task<ResultadoOperacion<UsuarioDto>> Crear(CrearUsuarioDto dto) => _servicio.CrearAsync(dto, CancellationToken.None);

    [Fact]
    public async Task Todos_los_campos_vacios_devuelven_un_error_por_campo()
    {
        var resultado = await Crear(new CrearUsuarioDto("", "", "", null, ""));

        Assert.Equal(EstadoOperacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.NombreCompletoVacio, resultado.Errores[CamposFormulario.NombreCompleto][0]);
        Assert.Equal(MensajesValidacion.CorreoUsuarioVacio, resultado.Errores[CamposFormulario.Correo][0]);
        Assert.Equal(MensajesValidacion.RolVacio, resultado.Errores[CamposFormulario.Rol][0]);
        Assert.Equal(MensajesValidacion.ContrasenaInicialVacia, resultado.Errores[CamposFormulario.Contrasena][0]);
    }

    [Theory]
    [InlineData("luis.quispe", MensajesValidacion.CorreoFormatoInvalido)]
    [InlineData("luis@gmail.com", "Usa tu correo institucional (termina en @upla.edu.pe).")]
    public async Task Correo_invalido_da_su_mensaje(string correo, string mensaje)
    {
        var resultado = await Crear(Valido() with { Correo = correo });

        Assert.Equal(mensaje, resultado.Errores[CamposFormulario.Correo][0]);
    }

    [Fact]
    public async Task Rol_fuera_de_la_lista_se_rechaza()
    {
        var resultado = await Crear(Valido() with { Rol = "Superusuario" });

        Assert.Equal(MensajesValidacion.RolInvalido, resultado.Errores[CamposFormulario.Rol][0]);
    }

    [Fact]
    public async Task Nombre_de_mas_de_120_caracteres_se_rechaza()
    {
        var resultado = await Crear(Valido() with { NombreCompleto = new string('a', 121) });

        Assert.Equal(MensajesValidacion.NombreCompletoDemasiadoLargo, resultado.Errores[CamposFormulario.NombreCompleto][0]);
    }

    [Fact]
    public async Task Contrasena_de_mas_de_72_caracteres_se_rechaza()
    {
        var resultado = await Crear(Valido() with { Contrasena = new string('a', 73) });

        Assert.Equal(MensajesValidacion.ContrasenaInicialDemasiadoLarga, resultado.Errores[CamposFormulario.Contrasena][0]);
    }

    [Fact]
    public async Task Correo_ya_registrado_se_rechaza_aunque_cambien_mayusculas_y_espacios()
    {
        _usuarios.Agregar("luis.quispe@upla.edu.pe");

        var resultado = await Crear(Valido() with { Correo = "  Luis.Quispe@UPLA.edu.pe " });

        Assert.Equal(MensajesValidacion.CorreoYaRegistrado, resultado.Errores[CamposFormulario.Correo][0]);
        Assert.Single(_usuarios.Usuarios);
    }

    [Fact]
    public async Task Usuario_valido_se_guarda_con_correo_normalizado_y_hash()
    {
        var resultado = await Crear(Valido() with { NombreCompleto = "  Luis Quispe ", Correo = " Luis.Quispe@UPLA.edu.pe " });

        Assert.Equal(EstadoOperacion.Exitoso, resultado.Estado);
        var guardado = Assert.Single(_usuarios.Usuarios);
        Assert.Equal("Luis Quispe", guardado.NombreCompleto);
        Assert.Equal("luis.quispe@upla.edu.pe", guardado.Correo);
        Assert.Equal(RolUsuario.Solicitante, guardado.Rol);
        Assert.Equal("fake-hash:Clave#123", guardado.ContrasenaHash);
        Assert.NotEqual("Clave#123", guardado.ContrasenaHash);
        Assert.Equal("Solicitante", resultado.Valor!.Rol);
    }

    [Fact]
    public async Task Sin_indicar_Activo_el_usuario_queda_activo()
    {
        await Crear(Valido() with { Activo = null });

        Assert.True(_usuarios.Usuarios.Single().Activo);
    }

    [Fact]
    public async Task Usuario_inactivo_se_guarda_inactivo()
    {
        await Crear(Valido() with { Activo = false });

        Assert.False(_usuarios.Usuarios.Single().Activo);
    }

    [Fact]
    public async Task Listar_filtra_por_rol()
    {
        _usuarios.Agregar("a@upla.edu.pe", RolUsuario.Responsable);
        _usuarios.Agregar("b@upla.edu.pe", RolUsuario.Solicitante);

        var responsables = await _servicio.ListarAsync(RolUsuario.Responsable, CancellationToken.None);
        var todos = await _servicio.ListarAsync(null, CancellationToken.None);

        Assert.Single(responsables);
        Assert.Equal(2, todos.Count);
    }
}
