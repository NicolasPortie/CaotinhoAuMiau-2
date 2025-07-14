using System;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;

namespace CaotinhoAuMiau.Utils
{
    public static class EnumExtensions
    {
        public static string GetEnumMemberValue<T>(this T enumValue) where T : Enum
        {
            var member = typeof(T).GetMember(enumValue.ToString()).FirstOrDefault();
            var attribute = member?.GetCustomAttribute<EnumMemberAttribute>();
            return attribute?.Value ?? enumValue.ToString();
        }

        public static T ParseEnumMemberValue<T>(string? value) where T : Enum
        {
            // Retorna o valor padrão do enum caso a string seja nula ou vazia
            if (string.IsNullOrWhiteSpace(value))
            {
                return default;
            }

            // Procura pelo atributo EnumMember com valor correspondente
            foreach (var field in typeof(T).GetFields())
            {
                var attribute = field.GetCustomAttribute<EnumMemberAttribute>();
                if (attribute != null && string.Equals(attribute.Value, value, StringComparison.OrdinalIgnoreCase))
                {
                    return (T)field.GetValue(null)!;
                }
            }

            // Tenta fazer o parse pelo nome do enum ignorando maiúsculas/minúsculas
            if (Enum.TryParse(typeof(T), value, ignoreCase: true, out var result))
            {
                return (T)result!;
            }

            // Caso não consiga converter, retorna o valor padrão para evitar exceção
            return default;
        }
    }
}
