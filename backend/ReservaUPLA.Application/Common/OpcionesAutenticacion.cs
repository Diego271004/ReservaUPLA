namespace ReservaUPLA.Application.Common;

/// <summary>Configuración de autenticación (sección "Autenticacion" de appsettings).</summary>
public sealed class OpcionesAutenticacion
{
    public const string Seccion = "Autenticacion";

    public string DominioInstitucional { get; set; } = "upla.edu.pe";
}
