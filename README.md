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

No frontend, trabalhe sempre com objetos em camelCase, tanto ao enviar quanto ao receber informações da API. Essa abordagem mantém a consistência com a convenção do JavaScript e evita conversões manuais.


## Sessões e cache

O projeto utiliza o Redis para armazenar sessões e dados de cache quando um servidor está disponível. Se nenhuma string de conexão para o Redis for encontrada ou se a tentativa de conexão falhar, o *Program.cs* passa a utilizar o cache em memória, evitando atrasos no carregamento das páginas.

## Dependências de JavaScript

Após clonar o repositório, execute `npm install` para baixar o **Font Awesome** e o **Chart.js** utilizados no painel administrativo. O script `postinstall` copia os arquivos necessários para `wwwroot/lib`, garantindo que os ícones e gráficos sejam carregados mesmo sem acesso à internet.
