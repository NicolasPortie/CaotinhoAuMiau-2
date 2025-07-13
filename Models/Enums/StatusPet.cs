using System.Runtime.Serialization;

namespace CaotinhoAuMiau.Models.Enums
{
    public enum StatusPet
    {
        [EnumMember(Value = "Disponível")]
        Disponivel,
        [EnumMember(Value = "Adotado")]
        Adotado,
        [EnumMember(Value = "Em Processo")]
        EmProcesso,
        [EnumMember(Value = "Rascunho")]
        Rascunho,
        [EnumMember(Value = "Finalizado")]
        Finalizado
    }
}
