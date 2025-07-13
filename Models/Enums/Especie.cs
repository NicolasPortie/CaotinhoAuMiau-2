using System.Runtime.Serialization;

namespace CaotinhoAuMiau.Models.Enums
{
    public enum Especie
    {
        [EnumMember(Value = "Cachorro")]
        Cachorro,
        [EnumMember(Value = "Gato")]
        Gato,
        [EnumMember(Value = "Outro")]
        Outro
    }
}
