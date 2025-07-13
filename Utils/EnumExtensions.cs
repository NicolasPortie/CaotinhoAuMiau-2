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

        public static T ParseEnumMemberValue<T>(string value) where T : Enum
        {
            foreach (var field in typeof(T).GetFields())
            {
                var attribute = field.GetCustomAttribute<EnumMemberAttribute>();
                if (attribute != null && attribute.Value == value)
                {
                    return (T)field.GetValue(null)!;
                }
            }
            return (T)Enum.Parse(typeof(T), value, ignoreCase: true);
        }
    }
}
