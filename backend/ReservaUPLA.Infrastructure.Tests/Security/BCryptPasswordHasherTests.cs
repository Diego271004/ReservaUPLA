using ReservaUPLA.Infrastructure.Security;

namespace ReservaUPLA.Infrastructure.Tests.Security;

public class BCryptPasswordHasherTests
{
    // Hash generado con pgcrypto: SELECT crypt('clave-de-prueba-pgcrypto', gen_salt('bf', 11)).
    // Es el formato $2a$ que usa database/05_datos_prueba.sql.
    private const string HashDePgcrypto = "$2a$11$T4Ig0zA3y1dmiJY1qQnd5ekffpVwHIuF/uDWMVXeQ7y8jxs4BPUR.";

    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Verifica_un_hash_2a_generado_por_pgcrypto()
    {
        Assert.True(_hasher.Verificar("clave-de-prueba-pgcrypto", HashDePgcrypto));
    }

    [Fact]
    public void Rechaza_una_contrasena_incorrecta_contra_un_hash_de_pgcrypto()
    {
        Assert.False(_hasher.Verificar("otra-clave", HashDePgcrypto));
    }

    [Fact]
    public void Hash_usa_el_factor_de_trabajo_11_y_verifica_la_misma_contrasena()
    {
        var hash = _hasher.Hash("Clave#123");

        Assert.StartsWith("$2a$11$", hash);
        Assert.True(_hasher.Verificar("Clave#123", hash));
        Assert.False(_hasher.Verificar("Clave#124", hash));
    }

    [Fact]
    public void Dos_hashes_de_la_misma_contrasena_son_distintos()
    {
        Assert.NotEqual(_hasher.Hash("Clave#123"), _hasher.Hash("Clave#123"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("no-es-un-hash")]
    public void Un_hash_danado_se_trata_como_contrasena_incorrecta_y_no_como_error(string hash)
    {
        Assert.False(_hasher.Verificar("Clave#123", hash));
    }
}
