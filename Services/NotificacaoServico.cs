using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Data;
using System.Linq;

namespace CaotinhoAuMiau.Services
{
    public class NotificacaoServico
    {
        private readonly ApplicationDbContext _context;

        public NotificacaoServico(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        // Renomeado para seguir a convenção .NET de métodos assíncronos
        public async Task<IEnumerable<Notificacao>> ObterNotificacoesUsuarioAsync(string idUsuario)
        {
            if (string.IsNullOrEmpty(idUsuario))
                throw new ArgumentException("ID do usuário não pode ser nulo ou vazio", nameof(idUsuario));

            return await _context.Notificacoes
                .Where(n => n.UsuarioId.ToString() == idUsuario)
                .OrderByDescending(n => n.DataCriacao)
                .Take(10)
                .ToListAsync();
        }

        // Sufixo Async indica método assíncrono
        public async Task<int> ContarNotificacoesNaoLidasAsync(string idUsuario)
        {
            if (string.IsNullOrEmpty(idUsuario))
                throw new ArgumentException("ID do usuário não pode ser nulo ou vazio", nameof(idUsuario));

            return await _context.Notificacoes
                .CountAsync(n => n.UsuarioId.ToString() == idUsuario && !n.Lida);
        }

        // Método renomeado para refletir chamada assíncrona
        public async Task<bool> MarcarComoLidaAsync(int id, string idUsuario)
        {
            var notificacao = await _context.Notificacoes
                .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId.ToString() == idUsuario);
            if (notificacao == null)
            {
                return false;
            }

            notificacao.Lida = true;
            notificacao.DataLeitura = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        // Identificador ajustado para padrão assíncrono
        public async Task MarcarTodasComoLidasAsync(string idUsuario)
        {
            if (string.IsNullOrEmpty(idUsuario))
                throw new ArgumentException("ID do usuário não pode ser nulo ou vazio", nameof(idUsuario));

            var notificacoes = await _context.Notificacoes
                .Where(n => n.UsuarioId.ToString() == idUsuario && !n.Lida)
                .ToListAsync();

            foreach (var notificacao in notificacoes)
            {
                notificacao.Lida = true;
                notificacao.DataLeitura = DateTime.Now;
            }

            await _context.SaveChangesAsync();
        }

        // Sufixo Async para indicar operação assíncrona
        public async Task CriarNotificacaoAsync(string idUsuario, string titulo, string mensagem, string tipo, string? referencia = null)
        {
            if (string.IsNullOrEmpty(idUsuario))
                throw new ArgumentException("ID do usuário não pode ser nulo ou vazio", nameof(idUsuario));
            if (string.IsNullOrEmpty(titulo))
                throw new ArgumentException("Título não pode ser nulo ou vazio", nameof(titulo));
            if (string.IsNullOrEmpty(mensagem))
                throw new ArgumentException("Mensagem não pode ser nula ou vazia", nameof(mensagem));
            if (string.IsNullOrEmpty(tipo))
                throw new ArgumentException("Tipo não pode ser nulo ou vazio", nameof(tipo));

            var notificacao = new Notificacao
            {
                UsuarioId = int.Parse(idUsuario),
                Titulo = titulo,
                Mensagem = mensagem,
                Tipo = tipo,
                Referencia = referencia,
                DataCriacao = DateTime.Now,
                Lida = false
            };

            _context.Notificacoes.Add(notificacao);
            await _context.SaveChangesAsync();
        }

    }
} 
