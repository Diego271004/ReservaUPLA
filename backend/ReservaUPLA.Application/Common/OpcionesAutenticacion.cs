namespace ReservaUPLA.Application.Common;

/// <summary>Configuración de autenticación (sección "Autenticacion" de appsettings).</summary>
public sealed class OpcionesAutenticacion
{
    public const string Seccion = "Autenticacion";

    /// <summary>Dominio institucional aceptado, sin "@". Valor por confirmar con la universidad.</summary>
    public string DominioInstitucional { get; set; } = "upla.edu.pe";
}
