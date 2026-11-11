using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ReservaUPLA.Application.DTOs;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Application.Reglas;
using ReservaUPLA.Application.Services;
using ReservaUPLA.Application.Validators;

namespace ReservaUPLA.Application;

public static class DependencyInjection
{
    public static IServiceCollection AgregarAplicacion(this IServiceCollection servicios)
    {
        servicios.AddOptions<Common.OpcionesAutenticacion>();
        servicios.TryAddSingleton(TimeProvider.System);
        servicios.AddScoped<IValidator<LoginRequestDto>, LoginRequestValidator>();
        servicios.AddScoped<IValidator<CrearUsuarioDto>, CrearUsuarioValidator>();
        servicios.AddScoped<IValidator<CrearAmbienteDto>, CrearAmbienteValidator>();
        servicios.AddScoped<IValidator<CrearReservaDto>, CrearReservaValidator>();
        servicios.AddScoped<IValidator<ConsultarDisponibilidadDto>, ConsultarDisponibilidadValidator>();
        servicios.AddScoped<IValidator<ConsultaReservasDto>, ConsultaReservasValidator>();
        servicios.AddScoped<ComprobadorDeHorario>();
        servicios.AddScoped<IReglaReserva, ReglaAmbienteDisponible>();
        servicios.AddScoped<IReglaReserva, ReglaFechaNoPasada>();
        servicios.AddScoped<IReglaReserva, ReglaSinCruceConAprobadas>();
        servicios.AddScoped<IAuthService, AuthService>();
        servicios.AddScoped<IUsuarioService, UsuarioService>();
        servicios.AddScoped<IAmbienteService, AmbienteService>();
        servicios.AddScoped<IReservaService, ReservaService>();
        servicios.AddScoped<IConsultaService, ConsultaService>();
        return servicios;
    }
}
