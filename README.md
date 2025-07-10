## Requisitos
- .NET SDK 6

### Instalação no Ubuntu
```bash
sudo apt-get install -y dotnet-sdk-6.0
dotnet --version
dotnet build
```

### Configuração da API no front-end

Crie um arquivo `.env` dentro da pasta `ClientApp` definindo a URL base do backend:

```env
API_BASE_URL=https://seu-backend-url
```

Durante o build o front-end utilizará esta variável para montar as requisições HTTP.
