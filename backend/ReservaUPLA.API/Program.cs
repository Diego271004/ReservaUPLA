using System.IdentityModel.Tokens.Jwt;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ReservaUPLA.API.Contracts;
using ReservaUPLA.API.Controllers;
using ReservaUPLA.API.Middleware;
using ReservaUPLA.Application;
using ReservaUPLA.Application.Common;
using ReservaUPLA.Infrastructure;
using ReservaUPLA.Infrastructure.Security;

const string PoliticaCors = "Frontend";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AgregarAplicacion();
builder.Services.AgregarInfraestructura(builder.Configuration);

// Un dominio vacío dejaría pasar cualquier correo: la API no arranca así.
builder.Services.AddOptions<OpcionesAutenticacion>()
    .Bind(builder.Configuration.GetSection(OpcionesAutenticacion.Seccion))
    .Validate(opciones => !string.IsNullOrWhiteSpace(opciones.DominioInstitucional?.Trim().TrimStart('@')),
        $"Falta {OpcionesAutenticacion.Seccion}:DominioInstitucional en la configuración.")
    .ValidateOnStart();

var codificadorJson = JavaScriptEncoder.Create(UnicodeRanges.All);
builder.Services.AddControllers()
    .AddJsonOptions(opciones => opciones.JsonSerializerOptions.Encoder = codificadorJson)
    .ConfigureApiBehaviorOptions(opciones => opciones.SuppressModelStateInvalidFilter = true);
builder.Services.ConfigureHttpJsonOptions(opciones => opciones.SerializerOptions.Encoder = codificadorJson);

builder.Services.AddProblemDetails();

// CORS restringido a los orígenes configurados (nunca AllowAnyOrigin).
var origenesPermitidos = builder.Configuration.GetSection("Cors:OrigenesPermitidos").Get<string[]>() ?? [];
builder.Services.AddCors(opciones => opciones.AddPolicy(PoliticaCors, politica => politica
    .WithOrigins(origenesPermitidos)
    .WithMethods("GET", "POST")
    .WithHeaders("Content-Type", "Authorization")
    .WithExposedHeaders("Retry-After")));

// JWT Bearer. Las opciones se leen de JwtOptions, ya validadas (clave de 32 bytes o más).
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
    {
        bearer.MapInboundClaims = false;
        // El 401 no explica por qué falló el token (expirado, firma, emisor...).
        bearer.IncludeErrorDetails = false;
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Value.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Value.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = jwt.Value.ObtenerClaveFirma(),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            NameClaimType = JwtRegisteredClaimNames.Name,
            RoleClaimType = JwtTokenGenerator.ClaimRol,
            ClockSkew = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

// Anti fuerza bruta: ventana fija de 5 intentos por minuto por IP, solo en el login.
// Limitación conocida: detrás de un proxy todos los clientes comparten la IP del proxy; en un despliegue real
// se configura UseForwardedHeaders con proxies conocidos.
builder.Services.AddRateLimiter(opciones =>
{
    opciones.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    opciones.AddPolicy(AuthController.PoliticaLogin, contexto => RateLimitPartition.GetFixedWindowLimiter(
        contexto.Connection.RemoteIpAddress?.ToString() ?? "desconocida",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true,
        }));
    opciones.OnRejected = async (contexto, cancellationToken) =>
    {
        contexto.HttpContext.Response.Headers.RetryAfter = "60";
        await contexto.HttpContext.Response.WriteAsJsonAsync(
            new MensajeResponse(MensajesValidacion.DemasiadosIntentos), cancellationToken);
    };
});

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

var app = builder.Build();

// Primero: cualquier excepción no controlada termina en un 500 sin detalles internos.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(PoliticaCors);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Expone Program para que las pruebas de la API la levanten en memoria.
public partial class Program;
