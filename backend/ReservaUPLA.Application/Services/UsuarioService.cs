using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

public sealed class UsuarioService : IUsuarioService
{
    private readonly IValidator<CrearUsuarioDto> _validator;
    private readonly IUsuarioRepository _usuarios;
    private readonly IPasswordHasher _passwordHasher;

    public UsuarioService(
        IValidator<CrearUsuarioDto> validator,
        IUsuarioRepository usuarios,
        IPasswordHasher passwordHasher)
    {
        _validator = validator;
        _usuarios = usuarios;
        _passwordHasher = passwordHasher;
    }

    public async Task<ResultadoOperacion<UsuarioDto>> CrearAsync(CrearUsuarioDto dto, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitud = dto with
        {
            NombreCompleto = dto.NombreCompleto?.Trim(),
            Correo = CorreoHelper.Normalizar(dto.Correo),
        };

        if (ResultadoOperacion<UsuarioDto>.SiNoEsValido(await _validator.ValidateAsync(solicitud, cancellationToken)) is { } invalido)
        {
            return invalido;
        }

        if (await _usuarios.ObtenerPorCorreoAsync(solicitud.Correo!, cancellationToken) is not null)
        {
            return ResultadoOperacion<UsuarioDto>.DatosInvalidos(CamposFormulario.Correo, MensajesValidacion.CorreoYaRegistrado);
        }

        TextosDominio.TryRol(solicitud.Rol, out var rol);
        var usuario = new Usuario
        {
            NombreCompleto = solicitud.NombreCompleto!,
            Correo = solicitud.Correo!,
            Rol = rol,
            Activo = solicitud.Activo ?? true,
            ContrasenaHash = _passwordHasher.Hash(solicitud.Contrasena!),
        };

        await _usuarios.AgregarAsync(usuario, cancellationToken);
        return ResultadoOperacion<UsuarioDto>.Exitoso(usuario.ADto());
    }

    public async Task<IReadOnlyList<UsuarioDto>> ListarAsync(RolUsuario? rol, CancellationToken cancellationToken)
    {
        var usuarios = await _usuarios.ListarAsync(rol, cancellationToken);
        return usuarios.Select(usuario => usuario.ADto()).ToList();
    }
}
