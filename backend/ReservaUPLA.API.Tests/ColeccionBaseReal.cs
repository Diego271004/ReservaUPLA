namespace ReservaUPLA.API.Tests;

/// <summary>Las pruebas con la base real comparten datos globales (totales, empates): no corren en paralelo entre sí.</summary>
[CollectionDefinition("BaseReal", DisableParallelization = true)]
public sealed class ColeccionBaseReal;
