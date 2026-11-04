using ReservaUPLA.Application.Common;
using ReservaUPLA.Domain.Common;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Application.Tests.Common;

public class CorreoYTextosTests
{
    [Theory]
    [InlineData("  Ana.Torres@UPLA.edu.pe ", "ana.torres@upla.edu.pe")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void Normalizar_recorta_y_pasa_a_minusculas(string? entrada, string esperado) =>
        Assert.Equal(esperado, CorreoHelper.Normalizar(entrada));

    [Fact]
    public void El_estado_de_ambiente_en_mantenimiento_usa_el_texto_con_espacios()
    {
        Assert.Equal("En mantenimiento", TextosDominio.ATexto(EstadoAmbiente.EnMantenimiento));
        Assert.True(TextosDominio.TryEstadoAmbiente("En mantenimiento", out var estado));
        Assert.Equal(EstadoAmbiente.EnMantenimiento, estado);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("administrador")]
    [InlineData("")]
    [InlineData(null)]
    public void Los_roles_solo_se_aceptan_con_su_nombre_exacto(string? texto) =>
        Assert.False(TextosDominio.TryRol(texto, out _));
}
