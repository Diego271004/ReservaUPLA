using Microsoft.AspNetCore.Mvc;

namespace ReservaUPLA.API.Middleware;

/// <summary>
/// Último recurso ante errores no controlados: responde ProblemDetails 500 sin trazas ni mensajes internos
/// y registra la excepción. Nunca registra el cuerpo de la petición (contiene contraseñas).
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private const string Titulo = "Ocurrió un error inesperado.";
    private const string Tipo = "https://tools.ietf.org/html/rfc9110#section-15.6.1";

    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate siguiente, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _siguiente = siguiente;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (OperationCanceledException) when (contexto.RequestAborted.IsCancellationRequested)
        {
            // El cliente cerró la conexión: no hay a quién responder ni es un error del servidor.
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado en {Metodo} {Ruta}", contexto.Request.Method, contexto.Request.Path);

            if (contexto.Response.HasStarted)
            {
                throw;
            }

            contexto.Response.Clear();
            contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await contexto.Response.WriteAsJsonAsync(
                new ProblemDetails { Type = Tipo, Title = Titulo, Status = StatusCodes.Status500InternalServerError },
                options: null,
                contentType: "application/problem+json");
        }
    }
}
