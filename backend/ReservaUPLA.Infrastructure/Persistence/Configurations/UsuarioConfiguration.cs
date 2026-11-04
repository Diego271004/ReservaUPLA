using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservaUPLA.Domain.Entities;

namespace ReservaUPLA.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("usuarios");
        builder.HasKey(usuario => usuario.Id);
        builder.Property(usuario => usuario.Id).HasColumnName("id").ValueGeneratedOnAdd();
        builder.Property(usuario => usuario.NombreCompleto).HasColumnName("nombre_completo").HasMaxLength(120);
        builder.Property(usuario => usuario.Correo).HasColumnName("correo").HasMaxLength(160);
        builder.Property(usuario => usuario.Rol).HasColumnName("rol").HasMaxLength(20).HasConversion<string>();
        builder.Property(usuario => usuario.Activo).HasColumnName("activo");
        builder.Property(usuario => usuario.ContrasenaHash).HasColumnName("contrasena_hash").HasMaxLength(100);
    }
}
