using System.ComponentModel.DataAnnotations;

namespace CaotinhoAuMiau.Models.ViewModels.Comuns
{
    public class EscolherPerfilViewModel
    {
        public string Perfil { get; set; } = string.Empty;
        public int? UsuarioId { get; set; }
        public int? ColaboradorId { get; set; }
        public bool ContinuarConectado { get; set; } = false;
    }
}
