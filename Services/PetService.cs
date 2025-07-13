using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CaotinhoAuMiau.Data;

namespace CaotinhoAuMiau.Services
{
    public class PetService
    {
        private readonly ApplicationDbContext _contexto;

        public PetService(ApplicationDbContext contexto)
        {
            _contexto = contexto ?? throw new ArgumentNullException(nameof(contexto));
        }

        public async Task<bool> NomeJaExisteAsync(string nome, int id)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return false;

            var nomeNormalizado = nome.Trim();

            return await _contexto.Pets
                .AnyAsync(p =>
                    p.Id != id
                    && !string.Equals(p.Status, "Finalizado", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(p.Status, "Adotado", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(p.Nome.Trim(), nomeNormalizado, StringComparison.OrdinalIgnoreCase));
        }
    }
}
