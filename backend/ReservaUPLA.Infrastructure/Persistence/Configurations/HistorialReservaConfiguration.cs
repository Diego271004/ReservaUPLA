using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Persistence.Configurations;

public class HistorialReservaConfiguration : IEntityTypeConfiguration<HistorialReserva>
{
    public void Configure(EntityTypeBuilder<HistorialReserva> builder)
    {
        builder.ToTable("historial_reserva");
        builder.HasKey(evento => evento.Id);
        builder.Property(evento => evento.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(evento => evento.ReservaId).HasColumnName("reserva_id");
        builder.Property(evento => evento.EstadoAnterior).HasColumnName("estado_anterior").HasMaxLength(20).HasConversion<string>();
        builder.Property(evento => evento.EstadoNuevo).HasColumnName("estado_nuevo").HasMaxLength(20).HasConversion<string>();
        builder.Property(evento => evento.UsuarioId).HasColumnName("usuario_id");
        builder.Property(evento => evento.Fecha).HasColumnName("fecha").ValueGeneratedOnAdd();
        builder.HasOne<Usuario>().WithMany().HasForeignKey(evento => evento.UsuarioId);
    }
}
