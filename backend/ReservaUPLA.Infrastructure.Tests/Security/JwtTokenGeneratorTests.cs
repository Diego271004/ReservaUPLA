using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Options;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;
using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.Infrastructure.Tests.Security;

public class JwtTokenGeneratorTests
{
    private sealed class RelojFijo : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(2026, 11, 3, 12, 0, 0, 123, TimeSpan.Zero);
    }

    private static JwtTokenGenerator CrearGenerador() => new(
        Options.Create(new JwtOptions
        {
            Issuer = "ReservaUPLA.API",
            Audience = "ReservaUPLA.Frontend",
            Key = new string('k', 64),
            MinutosExpiracion = 30,
        }),
        new RelojFijo());

    private static readonly Usuario Carla = new()
    {
        Id = 7,
        NombreCompleto = "Carla Rojas",
        Correo = "carla.rojas@upla.edu.pe",
        Rol = RolUsuario.Administrador,
    };

    [Fact]
    public void El_token_lleva_id_correo_nombre_y_rol()
    {
        var (token, _) = CrearGenerador().Generar(Carla);

        var leido = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal("7", leido.Subject);
        Assert.Equal("carla.rojas@upla.edu.pe", leido.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("Carla Rojas", leido.Claims.First(c => c.Type == JwtRegisteredClaimNames.Name).Value);
        Assert.Equal("Administrador", leido.Claims.First(c => c.Type == JwtTokenGenerator.ClaimRol).Value);
        Assert.Equal("ReservaUPLA.API", leido.Issuer);
    }

    [Fact]
    public void La_expiracion_coincide_con_la_del_token_y_dura_los_minutos_configurados()
    {
        var (token, expiraEn) = CrearGenerador().Generar(Carla);

        var leido = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal(expiraEn, leido.ValidTo);
        Assert.Equal(new DateTime(2026, 11, 3, 12, 30, 0, DateTimeKind.Utc), expiraEn);
    }

    [Fact]
    public void El_token_no_contiene_la_contrasena_ni_su_hash()
    {
        var usuario = new Usuario { Id = 1, NombreCompleto = "Ana", Correo = "ana@upla.edu.pe", ContrasenaHash = "$2a$11$secreto" };

        var (token, _) = CrearGenerador().Generar(usuario);

        Assert.DoesNotContain("secreto", new JwtSecurityTokenHandler().ReadJwtToken(token).Payload.SerializeToJson());
    }
}
