using System.Threading.Tasks;
using CaotinhoAuMiau.Models;

namespace CaotinhoAuMiau.Services
{
    public interface IUsuarioService
    {
        Task CriarAdminPadraoAsync();
        Task<(Colaborador? colaborador, Usuario? usuario)> AutenticarAsync(string email, string senha);
        Task<Usuario> RegistrarUsuarioAsync(Usuario usuario);
        Task<bool> CPFExisteAsync(string cpf);
        Task<bool> EmailExisteAsync(string email);
        Task<Colaborador?> ObterColaboradorPorIdAsync(int id);
        Task<Usuario?> ObterUsuarioPorIdAsync(int id);
        Task AtualizarUltimoAcessoColaboradorAsync(Colaborador colaborador);
        Task AtualizarUltimoAcessoUsuarioAsync(Usuario usuario);
    }
}
