using FluentValidation.Results;

namespace ReservaUPLA.Application.Common;

public static class ErroresDeValidacion
{
    public static IReadOnlyDictionary<string, string[]> AgruparPorCampo(this IEnumerable<ValidationFailure> errores) =>
        errores
            .GroupBy(error => error.PropertyName)
            .ToDictionary(grupo => grupo.Key, grupo => grupo.Select(error => error.ErrorMessage).ToArray());
}
