using CaotinhoAuMiau.Models.ViewModels.Comuns;
using CaotinhoAuMiau.Models.Enums;

namespace CaotinhoAuMiau.Models.ViewModels.Admin
{
    public class PetViewModel : PetViewModelBase
    {
        public Especie? FiltroEspecie { get; set; }
        public SexoPet? FiltroSexo { get; set; }
        public string FiltroPorte { get; set; } = string.Empty;
        public StatusPet? FiltroStatus { get; set; }

        public int? UsuarioId { get; set; } = 1;

        public int Idade { get => Anos; }

        public bool CadastroCompleto { get; set; }

    }
}
