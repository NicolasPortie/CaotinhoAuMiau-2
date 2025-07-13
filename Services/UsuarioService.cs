using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Utils;

namespace CaotinhoAuMiau.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly ApplicationDbContext _contexto;
        private readonly ILogger<UsuarioService> _logger;

        public UsuarioService(ApplicationDbContext contexto, ILogger<UsuarioService> logger)
        {
            _contexto = contexto ?? throw new ArgumentNullException(nameof(contexto));
            _logger = logger;
        }

        public async Task CriarAdminPadraoAsync()
        {
            try
            {
                var colaboradorExistente = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(a => a.Email == "admin@admin.com");

                if (colaboradorExistente == null)
                {
                    var colaborador = new Colaborador
                    {
                        Nome = "Administrador",
                        Email = "admin@admin.com",
                        Senha = HashHelper.GerarHashSenha("admin"),
                        CPF = "00000000000",
                        Telefone = "0000000000",
                        Cargo = "Administrador",
                        Ativo = true,
                        DataCadastro = DateTime.Now
                    };

                    _contexto.Colaboradores.Add(colaborador);
                    await _contexto.SaveChangesAsync();
                }
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao criar admin padrão.");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao criar admin padrão.");
                throw;
            }
        }

        public async Task<(Colaborador? colaborador, Usuario? usuario)> AutenticarAsync(string email, string senha)
        {
            var colaborador = await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Email == email);
            var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

            if (colaborador != null && !HashHelper.VerificarSenha(senha, colaborador.Senha))
                colaborador = null;

            if (usuario != null && !HashHelper.VerificarSenha(senha, usuario.Senha))
                usuario = null;

            return (colaborador, usuario);
        }

        public async Task<Usuario> RegistrarUsuarioAsync(Usuario usuario)
        {
            usuario.Senha = HashHelper.GerarHashSenha(usuario.Senha);
            usuario.DataCadastro = DateTime.Now;
            usuario.Ativo = true;
            _contexto.Usuarios.Add(usuario);
            await _contexto.SaveChangesAsync();
            return usuario;
        }

        public async Task<bool> CPFExisteAsync(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return false;

            cpf = Regex.Replace(cpf, @"[^\d]", "");
            return await _contexto.Usuarios.AnyAsync(u => u.CPF == cpf);
        }

        public async Task<bool> EmailExisteAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var usuarioExistente = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
            var colaboradorExistente = await _contexto.Colaboradores.FirstOrDefaultAsync(a => a.Email == email);
            return usuarioExistente != null || colaboradorExistente != null;
        }

        public async Task<Colaborador?> ObterColaboradorPorIdAsync(int id)
        {
            return await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Usuario?> ObterUsuarioPorIdAsync(int id)
        {
            return await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task AtualizarUltimoAcessoColaboradorAsync(Colaborador colaborador)
        {
            colaborador.UltimoAcesso = DateTime.Now;
            await _contexto.SaveChangesAsync();
        }

        public async Task AtualizarUltimoAcessoUsuarioAsync(Usuario usuario)
        {
            usuario.UltimoAcesso = DateTime.Now;
            await _contexto.SaveChangesAsync();
        }
    }
}
