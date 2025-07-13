# Caotinho Au Miau

## Padrão de nomenclatura

O backend está configurado para converter automaticamente as propriedades em PascalCase das classes C# para camelCase ao serializar JSON. A opção `PropertyNameCaseInsensitive` também está habilitada, permitindo que os dados enviados em camelCase ou PascalCase sejam lidos sem erros.

No frontend, trabalhe sempre com objetos em camelCase, tanto ao enviar quanto ao receber informações da API. Essa abordagem mantém a consistência com a convenção do JavaScript/TypeScript e evita conversões manuais.
