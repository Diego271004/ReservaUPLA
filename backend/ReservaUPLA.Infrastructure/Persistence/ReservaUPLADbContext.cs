using Microsoft.EntityFrameworkCore;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Persistence;

public class ReservaUPLADbContext : DbContext
{
    public ReservaUPLADbContext(DbContextOptions<ReservaUPLADbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ambiente> Ambientes => Set<Ambiente>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<HistorialReserva> HistorialReservas => Set<HistorialReserva>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ReservaUPLADbContext).Assembly);
    }
}
