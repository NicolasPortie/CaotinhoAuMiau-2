using System.Collections.Generic;

namespace CaotinhoAuMiau.Models.ViewModels.Admin
{
    public class GerenciamentoPetViewModel
    {
        public List<PetCardViewModel> Pets { get; set; } = new List<PetCardViewModel>();
        public int PaginaAtual { get; set; }
        public int TotalPaginas { get; set; }
        public int ItensPorPagina { get; set; }
        public int TotalItens { get; set; }

        public int TotalPets { get; set; }
        public int TotalCachorros { get; set; }
        public int TotalGatos { get; set; }
        public int TotalAdotados { get; set; }
        public bool TemPets => Pets != null && Pets.Count > 0;
        public bool TemPaginaAnterior => PaginaAtual > 1;
        public bool TemProximaPagina => PaginaAtual < TotalPaginas;
    }
}
