using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Persistence.Configurations;

public class ReservaConfiguration : IEntityTypeConfiguration<Reserva>
{
    public void Configure(EntityTypeBuilder<Reserva> builder)
    {
        builder.ToTable("reservas");
        builder.HasKey(reserva => reserva.Id);
        builder.Property(reserva => reserva.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(reserva => reserva.Fecha).HasColumnName("fecha");
        builder.Property(reserva => reserva.HoraInicio).HasColumnName("hora_inicio");
        builder.Property(reserva => reserva.HoraFin).HasColumnName("hora_fin");
        builder.Property(reserva => reserva.Motivo).HasColumnName("motivo").HasMaxLength(300);
        builder.Property(reserva => reserva.Estado).HasColumnName("estado").HasMaxLength(20).HasConversion<string>();
        builder.Property(reserva => reserva.UsuarioId).HasColumnName("usuario_id");
        builder.Property(reserva => reserva.AmbienteId).HasColumnName("ambiente_id");
        builder.Property(reserva => reserva.FechaCreacion).HasColumnName("fecha_creacion").ValueGeneratedOnAdd();
        builder.HasOne<Usuario>().WithMany().HasForeignKey(reserva => reserva.UsuarioId);
        builder.HasOne<Ambiente>().WithMany().HasForeignKey(reserva => reserva.AmbienteId);
    }
}
