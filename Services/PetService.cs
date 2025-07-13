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

            var nomeNormalizado = nome.Trim().ToLower();

            return await _contexto.Pets
                .AnyAsync(p => p.Nome.ToLower() == nomeNormalizado
                             && p.Id != id
                             && p.Status != "Finalizado"
                             && p.Status != "Adotado");
        }
    }
}
