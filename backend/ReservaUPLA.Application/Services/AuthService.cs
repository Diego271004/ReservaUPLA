using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;

namespace ReservaUPLA.Application.Services;

/// <summary>
/// Caso de uso de inicio de sesión. Orquesta validación, búsqueda, verificación y emisión de token;
/// los detalles técnicos (BD, BCrypt, JWT) llegan por interfaces.
/// </summary>
public sealed class AuthService : IAuthService
{
    /// <summary>
    /// Hash BCrypt (costo 11, igual que los reales) de un valor aleatorio descartado. Se verifica contra él
    /// cuando el usuario no existe o está inactivo, para que el tiempo de respuesta no revele si el correo existe.
    /// </summary>
    public const string HashFicticio = "$2a$11$njTgnrqVc.gIRSY5WYQvF.RPguRdUFv1FiLg.B1rfzE3u2Fe.C48m";

    private readonly IValidator<LoginRequestDto> _validator;
    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenGenerator _tokenGenerator;

    public AuthService(
        IValidator<LoginRequestDto> validator,
        IUsuarioRepository usuarios,
        IPasswordHasher passwordHasher,
        ITokenGenerator tokenGenerator)
    {
        _validator = validator;
        _usuarios = usuarios;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<ResultadoAutenticacion> IniciarSesionAsync(LoginRequestDto dto, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitud = dto with { Correo = CorreoHelper.Normalizar(dto.Correo) };

        var validacion = await _validator.ValidateAsync(solicitud, cancellationToken);
        if (!validacion.IsValid)
        {
            return ResultadoAutenticacion.DatosInvalidos(validacion.Errors.AgruparPorCampo());
        }

        var contrasena = solicitud.Contrasena!;
        var usuario = await _usuarios.ObtenerPorCorreoAsync(solicitud.Correo!, cancellationToken);

        // Inexistente o inactivo: se paga el mismo costo de verificación y se responde igual.
        if (usuario is null || !usuario.Activo)
        {
            _passwordHasher.Verificar(contrasena, HashFicticio);
            return ResultadoAutenticacion.CredencialesInvalidas();
        }

        // Contraseña errónea: mismo resultado, sin distinción.
        if (!_passwordHasher.Verificar(contrasena, usuario.ContrasenaHash))
        {
            return ResultadoAutenticacion.CredencialesInvalidas();
        }

        var (token, expiraEn) = _tokenGenerator.Generar(usuario);
        return ResultadoAutenticacion.Exitoso(
            new LoginResponseDto(token, usuario.NombreCompleto, usuario.Rol.ToString(), expiraEn));
    }
}
