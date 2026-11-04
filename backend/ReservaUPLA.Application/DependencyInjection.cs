using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Validators;

namespace ReservaUPLA.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registra validadores y servicios. El dominio institucional se configura desde la API con la
    /// sección "Autenticacion"; las reglas de negocio de la Fase 6 se agregan registrando <see cref="IReglaReserva"/>.
    /// </summary>
    public static IServiceCollection AgregarAplicacion(this IServiceCollection servicios)
    {
        servicios.AddOptions<Common.OpcionesAutenticacion>();
        servicios.AddScoped<IValidator<LoginRequestDto>, LoginRequestValidator>();
        servicios.AddScoped<IValidator<CrearUsuarioDto>, CrearUsuarioValidator>();
        servicios.AddScoped<IValidator<CrearAmbienteDto>, CrearAmbienteValidator>();
        servicios.AddScoped<IValidator<CrearReservaDto>, CrearReservaValidator>();
        servicios.AddScoped<IAuthService, AuthService>();
        servicios.AddScoped<IUsuarioService, UsuarioService>();
        servicios.AddScoped<IAmbienteService, AmbienteService>();
        servicios.AddScoped<IReservaService, ReservaService>();
        return servicios;
    }
}
