namespace CaotinhoAuMiau.Models.ViewModels.Admin
{
    public class PetCardViewModel
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Especie { get; set; } = string.Empty;
        public string Sexo { get; set; } = string.Empty;
        public string Porte { get; set; } = string.Empty;
        public string IdadeTexto { get; set; } = string.Empty;
        public bool CadastroCompleto { get; set; }
        public string? NomeArquivoImagem { get; set; }
        public string Status { get; set; } = string.Empty;
        public string StatusCss { get; set; } = string.Empty;
    }
}
