using System.Reflection;
using ReservaUPLA.Application.Interfaces;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Tests;

public class ArquitecturaTests
{
    private static string[] NombresReferenciados(Assembly ensamblado) =>
        ensamblado.GetReferencedAssemblies().Select(referencia => referencia.Name ?? string.Empty).ToArray();

    [Fact]
    public void Application_no_referencia_Infrastructure()
    {
        var referencias = NombresReferenciados(typeof(IComprobadorSalud).Assembly);

        Assert.DoesNotContain("ReservaUPLA.Infrastructure", referencias);
        Assert.DoesNotContain("ReservaUPLA.API", referencias);
    }

    [Fact]
    public void Application_depende_de_Domain()
    {
        var referencias = NombresReferenciados(typeof(IComprobadorSalud).Assembly);

        Assert.Contains("ReservaUPLA.Domain", referencias);
    }

    [Fact]
    public void Domain_no_referencia_otras_capas()
    {
        var referencias = NombresReferenciados(typeof(Reserva).Assembly);

        Assert.DoesNotContain(referencias, nombre => nombre.StartsWith("ReservaUPLA.", StringComparison.Ordinal));
    }

    [Fact]
    public void El_codigo_de_Application_no_usa_el_espacio_de_nombres_de_Infrastructure()
    {
        var carpetaApplication = LocalizarCarpeta("ReservaUPLA.Application");

        var archivosConUsing = Directory
            .EnumerateFiles(carpetaApplication, "*.cs", SearchOption.AllDirectories)
            .Where(ruta => !ruta.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")
                        && !ruta.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}"))
            .Where(ruta => File.ReadAllText(ruta).Contains("using ReservaUPLA.Infrastructure", StringComparison.Ordinal))
            .ToList();

        Assert.Empty(archivosConUsing);
    }

    private static string LocalizarCarpeta(string nombre)
    {
        var directorio = new DirectoryInfo(AppContext.BaseDirectory);
        while (directorio is not null)
        {
            var candidata = Path.Combine(directorio.FullName, nombre);
            if (Directory.Exists(candidata))
            {
                return candidata;
            }
            directorio = directorio.Parent;
        }
        throw new DirectoryNotFoundException($"No se encontró la carpeta {nombre}.");
    }
}
