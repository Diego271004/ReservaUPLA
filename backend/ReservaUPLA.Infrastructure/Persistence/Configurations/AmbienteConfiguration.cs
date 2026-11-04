using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ReservaUPLA.Domain.Entities;
using ReservaUPLA.Domain.Enums;

namespace ReservaUPLA.Infrastructure.Persistence.Configurations;

public class AmbienteConfiguration : IEntityTypeConfiguration<Ambiente>
{
    private static readonly ValueConverter<EstadoAmbiente, string> ConvertidorEstado = new(
        estado => estado == EstadoAmbiente.EnMantenimiento ? "En mantenimiento" : "Disponible",
        texto => texto == "En mantenimiento" ? EstadoAmbiente.EnMantenimiento : EstadoAmbiente.Disponible);

    public void Configure(EntityTypeBuilder<Ambiente> builder)
    {
        builder.ToTable("ambientes");
        builder.HasKey(ambiente => ambiente.Id);
        builder.Property(ambiente => ambiente.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(ambiente => ambiente.Nombre).HasColumnName("nombre").HasMaxLength(120);
        builder.Property(ambiente => ambiente.Tipo).HasColumnName("tipo").HasMaxLength(30).HasConversion<string>();
        builder.Property(ambiente => ambiente.Capacidad).HasColumnName("capacidad");
        builder.Property(ambiente => ambiente.Ubicacion).HasColumnName("ubicacion").HasMaxLength(160);
        builder.Property(ambiente => ambiente.Estado).HasColumnName("estado").HasMaxLength(30).HasConversion(ConvertidorEstado);
        builder.Property(ambiente => ambiente.ResponsableId).HasColumnName("responsable_id");
        builder.HasOne<Usuario>().WithMany().HasForeignKey(ambiente => ambiente.ResponsableId);
    }
}
