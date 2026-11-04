using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Application.Interfaces;

public interface ITokenGenerator
{
    (string token, DateTime expiraEn) Generar(Usuario usuario);
}
