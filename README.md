# Caotinho Au Miau

## Configuração do ASP.NET Core

Para garantir que as propriedades em PascalCase do C# sejam convertidas para camelCase no JSON retornado pela API, defina a opção `PropertyNamingPolicy` no `Program.cs`. Também habilite `PropertyNameCaseInsensitive` para aceitar dados recebidos em ambos os formatos.

```csharp
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Permite que o backend aceite camelCase ou PascalCase nas propriedades recebidas
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
```

## Padrão de nomenclatura

O backend está configurado para converter automaticamente as propriedades em PascalCase das classes C# para camelCase ao serializar JSON. A opção `PropertyNameCaseInsensitive` também está habilitada, permitindo que os dados enviados em camelCase ou PascalCase sejam lidos sem erros.

No frontend, trabalhe sempre com objetos em camelCase, tanto ao enviar quanto ao receber informações da API. Essa abordagem mantém a consistência com a convenção do JavaScript/TypeScript e evita conversões manuais.

## Compilação do TypeScript

Para facilitar o desenvolvimento do frontend, foram adicionados scripts no `package.json` que automatizam a compilação dos arquivos `.ts`:

```json
"scripts": {
  "build": "tsc",
  "watch": "tsc --watch"
}
```

### Uso diário

- **Desenvolvimento contínuo:** execute `npm run watch` na raiz do projeto e deixe o comando rodando em segundo plano enquanto codifica. O TypeScript será recompilado sempre que você salvar um arquivo.
- **Compilação manual:** antes de publicar ou versionar o código, rode `npm run build` para compilar todos os arquivos `.ts` de uma vez.

Com esses comandos, evitamos diferenças entre os arquivos TypeScript e JavaScript compilados e padronizamos o fluxo de trabalho.
