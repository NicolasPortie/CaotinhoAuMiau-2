using CaotinhoAuMiau.Models.ViewModels.Comuns;

namespace CaotinhoAuMiau.Models.ViewModels.Admin
{
    public class PetViewModel : PetViewModelBase
    {
        public string FiltroEspecie { get; set; } = string.Empty;
        public string FiltroSexo { get; set; } = string.Empty;
        public string FiltroPorte { get; set; } = string.Empty;
        public string FiltroStatus { get; set; } = string.Empty;

        public int? UsuarioId { get; set; } = 1;

        public int Idade { get => Anos; }

        public bool CadastroCompleto { get; set; }

    }
}
