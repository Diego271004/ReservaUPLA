using FluentValidation;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Services;

public sealed class AmbienteService : IAmbienteService
{
    private readonly IValidator<CrearAmbienteDto> _validator;
    private readonly IAmbienteRepository _ambientes;
    private readonly IUsuarioRepository _usuarios;

    public AmbienteService(
        IValidator<CrearAmbienteDto> validator,
        IAmbienteRepository ambientes,
        IUsuarioRepository usuarios)
    {
        _validator = validator;
        _ambientes = ambientes;
        _usuarios = usuarios;
    }

    public async Task<ResultadoOperacion<AmbienteDto>> CrearAsync(CrearAmbienteDto dto, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitud = dto with { Nombre = dto.Nombre?.Trim(), Ubicacion = dto.Ubicacion?.Trim() };

        var validacion = await _validator.ValidateAsync(solicitud, cancellationToken);
        if (!validacion.IsValid)
        {
            return ResultadoOperacion<AmbienteDto>.DatosInvalidos(validacion.Errors.AgruparPorCampo());
        }

        if (await _ambientes.ExisteNombreAsync(solicitud.Nombre!, cancellationToken))
        {
            return ResultadoOperacion<AmbienteDto>.DatosInvalidos(
                CamposFormulario.Nombre, MensajesValidacion.NombreAmbienteDuplicado);
        }

        Usuario? responsable = null;
        if (solicitud.ResponsableId is { } responsableId)
        {
            responsable = await _usuarios.ObtenerPorIdAsync(responsableId, cancellationToken);
            if (responsable is not { Rol: RolUsuario.Responsable, Activo: true })
            {
                return ResultadoOperacion<AmbienteDto>.DatosInvalidos(
                    CamposFormulario.ResponsableId, MensajesValidacion.ResponsableInvalido);
            }
        }

        TextosDominio.TryTipo(solicitud.Tipo, out var tipo);
        TextosDominio.TryEstadoAmbiente(solicitud.Estado, out var estado);
        var ambiente = new Ambiente
        {
            Nombre = solicitud.Nombre!,
            Tipo = tipo,
            Capacidad = solicitud.Capacidad!.Value,
            Ubicacion = solicitud.Ubicacion!,
            Estado = estado,
            ResponsableId = responsable?.Id,
        };

        await _ambientes.AgregarAsync(ambiente, cancellationToken);
        return ResultadoOperacion<AmbienteDto>.Exitoso(ambiente.ADto(responsable?.NombreCompleto));
    }

    public async Task<IReadOnlyList<AmbienteDto>> ListarAsync(CancellationToken cancellationToken)
    {
        var ambientes = await _ambientes.ListarAsync(cancellationToken);
        var responsables = (await _usuarios.ListarAsync(RolUsuario.Responsable, cancellationToken))
            .ToDictionary(usuario => usuario.Id, usuario => usuario.NombreCompleto);

        return ambientes
            .Select(ambiente => ambiente.ADto(
                ambiente.ResponsableId is { } id && responsables.TryGetValue(id, out var nombre) ? nombre : null))
            .ToList();
    }
}
