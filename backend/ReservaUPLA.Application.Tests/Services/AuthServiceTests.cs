using Microsoft.Extensions.Options;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Tests.Fakes;
using ReservaUPLA.Application.Validators;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Services;

public class AuthServiceTests
{
    private const string Correo = "ana.torres@upla.edu.pe";
    private const string Clave = "Clave#123";

    private readonly FakeUsuarioRepository _usuarios = new();
    private readonly FakePasswordHasher _hasher = new();
    private readonly FakeTokenGenerator _tokens = new();
    private readonly AuthService _servicio;

    public AuthServiceTests()
    {
        _servicio = new AuthService(
            new LoginRequestValidator(Options.Create(new OpcionesAutenticacion())), _usuarios, _hasher, _tokens);
    }

    private Task<ResultadoAutenticacion> Entrar(string? correo, string? contrasena) =>
        _servicio.IniciarSesionAsync(new LoginRequestDto(correo, contrasena), CancellationToken.None);

    [Fact]
    public async Task Correo_y_contrasena_vacios_devuelven_dos_errores()
    {
        var resultado = await Entrar("", "");

        Assert.Equal(EstadoAutenticacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.CorreoVacio, Assert.Single(resultado.Errores[CamposFormulario.Correo]));
        Assert.Equal(MensajesValidacion.ContrasenaVacia, Assert.Single(resultado.Errores[CamposFormulario.Contrasena]));
    }

    [Fact]
    public async Task Correo_mal_formado_da_error_solo_en_el_correo()
    {
        var resultado = await Entrar("ana.torres", Clave);

        Assert.Equal(EstadoAutenticacion.DatosInvalidos, resultado.Estado);
        Assert.Equal(MensajesValidacion.CorreoFormatoInvalido, Assert.Single(resultado.Errores[CamposFormulario.Correo]));
        Assert.False(resultado.Errores.ContainsKey(CamposFormulario.Contrasena));
    }

    [Fact]
    public async Task Correo_de_otro_dominio_pide_usar_el_institucional()
    {
        var resultado = await Entrar("ana@gmail.com", Clave);

        Assert.Equal(MensajesValidacion.CorreoDominioNoInstitucional("upla.edu.pe"), resultado.Errores[CamposFormulario.Correo][0]);
    }

    [Fact]
    public async Task Correo_valido_con_contrasena_vacia_da_error_solo_en_la_contrasena()
    {
        var resultado = await Entrar(Correo, "");

        Assert.Single(resultado.Errores);
        Assert.Equal(MensajesValidacion.ContrasenaVacia, resultado.Errores[CamposFormulario.Contrasena][0]);
    }

    [Fact]
    public async Task Contrasena_de_mas_de_128_caracteres_se_rechaza()
    {
        var resultado = await Entrar(Correo, new string('a', 129));

        Assert.Equal(MensajesValidacion.ContrasenaDemasiadoLarga, resultado.Errores[CamposFormulario.Contrasena][0]);
    }

    [Fact]
    public async Task Usuario_inexistente_devuelve_credenciales_invalidas_y_verifica_el_hash_ficticio()
    {
        var resultado = await Entrar(Correo, Clave);

        Assert.Equal(EstadoAutenticacion.CredencialesInvalidas, resultado.Estado);
        Assert.Equal(MensajesValidacion.CredencialesInvalidas, resultado.Mensaje);
        Assert.Equal(AuthService.HashFicticio, Assert.Single(_hasher.HashesVerificados));
        Assert.Equal(0, _tokens.Llamadas);
    }

    [Fact]
    public async Task Usuario_inactivo_devuelve_el_mismo_resultado_y_verifica_el_hash_ficticio()
    {
        _usuarios.Agregar(Correo, activo: false);

        var resultado = await Entrar(Correo, "Clave#123");

        Assert.Equal(EstadoAutenticacion.CredencialesInvalidas, resultado.Estado);
        Assert.Equal(MensajesValidacion.CredencialesInvalidas, resultado.Mensaje);
        Assert.Equal(AuthService.HashFicticio, Assert.Single(_hasher.HashesVerificados));
    }

    [Fact]
    public async Task Contrasena_erronea_devuelve_el_mismo_mensaje_que_usuario_inexistente()
    {
        _usuarios.Agregar(Correo);

        var resultado = await Entrar(Correo, "otra-clave");

        Assert.Equal(EstadoAutenticacion.CredencialesInvalidas, resultado.Estado);
        Assert.Equal(MensajesValidacion.CredencialesInvalidas, resultado.Mensaje);
        Assert.Equal(0, _tokens.Llamadas);
    }

    [Fact]
    public async Task Credenciales_correctas_devuelven_token_nombre_y_rol()
    {
        var usuario = _usuarios.Agregar(Correo, RolUsuario.Administrador);

        var resultado = await Entrar(Correo, Clave);

        Assert.Equal(EstadoAutenticacion.Exitoso, resultado.Estado);
        Assert.Equal($"token-de-{Correo}", resultado.Respuesta!.Token);
        Assert.Equal(usuario.NombreCompleto, resultado.Respuesta.NombreCompleto);
        Assert.Equal("Administrador", resultado.Respuesta.Rol);
        Assert.Equal(FakeTokenGenerator.Expiracion, resultado.Respuesta.ExpiraEn);
    }

    [Fact]
    public async Task Correo_con_espacios_y_mayusculas_se_normaliza_y_autentica()
    {
        _usuarios.Agregar(Correo);

        var resultado = await Entrar("  Ana.Torres@UPLA.edu.pe ", Clave);

        Assert.Equal(EstadoAutenticacion.Exitoso, resultado.Estado);
    }
}
