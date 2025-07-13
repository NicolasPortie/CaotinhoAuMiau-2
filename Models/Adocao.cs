using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CaotinhoAuMiau.Models.Enums;

namespace CaotinhoAuMiau.Models
{
    public class Adocao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PetId { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        public DateTime DataEnvio { get; set; } = DateTime.Now;
        public DateTime? DataResposta { get; set; }
        public DateTime? DataFinalizacao { get; set; }
        public StatusAdocao Status { get; set; } = StatusAdocao.Pendente;
        public string? ObservacoesCancelamento { get; set; }

        public virtual Pet? Pet { get; set; }
        public virtual Usuario? Usuario { get; set; }
    }
} 