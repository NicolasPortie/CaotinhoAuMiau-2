using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Models.Enums;
using CaotinhoAuMiau.Models.ViewModels;
using CaotinhoAuMiau.Models.ViewModels.Usuario;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using CaotinhoAuMiau.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.Logging;
using CaotinhoAuMiau.Utils;

namespace CaotinhoAuMiau.Controllers.Usuario
{
    [Route("usuario/pets")]
    [Authorize(Roles = "Usuario")]
    public class PetController : Controller
    {
        private readonly ApplicationDbContext _contexto;
        private readonly NotificationService _servicoNotificacao;
        private readonly ILogger<PetController> _logger;

        public PetController(ApplicationDbContext contexto, NotificationService servicoNotificacao, ILogger<PetController> logger)
        {
            _contexto = contexto;
            _servicoNotificacao = servicoNotificacao;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> ListarAsync()
        {
            var idUsuario = User.ObterIdUsuario();
            if (!string.IsNullOrEmpty(idUsuario))
            {
                // Atualização para o método com sufixo Async
                ViewBag.NotificacoesNaoLidas = await _servicoNotificacao.ContarNotificacoesNaoLidasAsync(idUsuario);
            }

            var pets = await _contexto.Pets
                .Where(p => p.Status == StatusPet.Disponivel && p.CadastroCompleto)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            var viewModel = PetViewModel.CriarParaListagem();
            viewModel.Pets = pets;
            viewModel.PaginaAtual = 1;
            viewModel.TotalPaginas = 1;
            viewModel.TotalItens = pets.Count;
            viewModel.Especies = new SelectList(new List<SelectListItem>
            {
                new SelectListItem { Value = "Cachorro", Text = "Cachorro" },
                new SelectListItem { Value = "Gato", Text = "Gato" }
            }, "Value", "Text");
            viewModel.Sexos = new SelectList(new List<SelectListItem>
            {
                new SelectListItem { Value = "Macho", Text = "Macho" },
                new SelectListItem { Value = "Fêmea", Text = "Fêmea" }
            }, "Value", "Text");

            return View("~/Views/Usuario/ExplorarPets.cshtml", viewModel);
        }

       
        [HttpGet("explorar")]
        [ActionName("ExplorarPets")]
        public async Task<IActionResult> ExplorarPetsAsync(
            string filtroNome,
            string filtroEspecie, 
            string filtroSexo, 
            string filtroPorte, 
            string filtroIdade,
            string filtroRaca,
            string filtroOrdem = "recentes",
            int itensPorPagina = 12,
            int pagina = 1,
            bool fromForm = false,
            bool navegacaoPagina = false)
        {
            
            var referrer = Request.Headers["Referer"].ToString();
            if (!fromForm && (referrer.Contains("/adocao/formulario/") || referrer.Contains("/usuario/adocao/formulario/")))
            {
                _logger.LogInformation("Redirecionamento detectado do formulário de adoção");
                fromForm = true;
            }
            
            _logger.LogInformation($"Parâmetro navegacaoPagina: {navegacaoPagina}");
            
            try {
                _logger.LogInformation("Acessando ExplorarPets");
                _logger.LogInformation($"Total de pets no banco: {await _contexto.Pets.CountAsync()}");
                
                if (itensPorPagina <= 0)
                {
                    itensPorPagina = 12;
                }
                
                if (pagina <= 0)
                {
                    pagina = 1;
                }
                
                _logger.LogInformation($"Usando {itensPorPagina} itens por página, página {pagina}");
                
                var query = _contexto.Pets.Where(p => p.Status == StatusPet.Disponivel);
                
                var petsDisponiveis = await query.Where(p => p.CadastroCompleto).CountAsync();
                _logger.LogInformation($"Total de pets disponíveis e com cadastro completo: {petsDisponiveis}");
                if (petsDisponiveis > 0)
                {
                    query = query.Where(p => p.CadastroCompleto);
                }
                else
                {
                    var petsDisponiveisIncompletos = await query.CountAsync();
                    _logger.LogInformation($"Pets disponíveis (incluindo cadastro incompleto): {petsDisponiveisIncompletos}");
                }
                
                _logger.LogInformation($"Aplicando filtros: Nome='{filtroNome}', Especie='{filtroEspecie}', Sexo='{filtroSexo}', Porte='{filtroPorte}', Idade='{filtroIdade}', Raça='{filtroRaca}', Ordem='{filtroOrdem}'");
                if (!string.IsNullOrEmpty(filtroNome))
                {
                    query = query.Where(p => p.Nome.Contains(filtroNome));
                }
                
                if (!string.IsNullOrEmpty(filtroEspecie))
                {
                    var especieEnum = EnumExtensions.ParseEnumMemberValue<Especie>(filtroEspecie);
                    query = query.Where(p => p.Especie == especieEnum);
                }

                if (!string.IsNullOrEmpty(filtroSexo))
                {
                    var sexoEnum = EnumExtensions.ParseEnumMemberValue<SexoPet>(filtroSexo);
                    query = query.Where(p => p.Sexo == sexoEnum);
                }

                if (!string.IsNullOrEmpty(filtroPorte))
                {
                    query = query.Where(p => p.Porte == filtroPorte);
                }
                
                if (!string.IsNullOrEmpty(filtroRaca))
                {
                    query = query.Where(p => p.Raca == filtroRaca);
                }

                if (!string.IsNullOrEmpty(filtroIdade))
                {
                    switch (filtroIdade)
                    {
                        case "Filhote":
                            query = query.Where(p => p.Anos < 1);
                            break;
                        case "Adulto":
                            query = query.Where(p => p.Anos >= 1 && p.Anos < 7);
                            break;
                        case "Idoso":
                            query = query.Where(p => p.Anos >= 7);
                            break;
                    }
                }

                switch (filtroOrdem)
                {
                    case "recentes":
                        query = query.OrderByDescending(p => p.DataCriacao);
                        break;
                    case "antigos":
                        query = query.OrderBy(p => p.DataCriacao);
                        break;
                    case "nome":
                        query = query.OrderBy(p => p.Nome);
                        break;
                    case "nome_desc":
                        query = query.OrderByDescending(p => p.Nome);
                        break;
                    default:
                        query = query.OrderByDescending(p => p.DataCriacao);
                        break;
                }

                var totalItens = await query.CountAsync();

                // Garantir que itensPorPagina seja exatamente o valor selecionado pelo usuário
                _logger.LogInformation($"Usando valor de itensPorPagina: {itensPorPagina}");

                // Calcular o número total de páginas
                int totalPaginas = (int)Math.Ceiling(totalItens / (double)itensPorPagina);
                
                // Garantir que sempre haja pelo menos uma página
                if (totalPaginas <= 0)
                {
                    totalPaginas = 1;
                }
                
                _logger.LogInformation($"Calculando totalPaginas={totalPaginas} baseado em {totalItens} itens totais e {itensPorPagina} itens por página");
                
                // Garantir que a página atual seja válida
                if (pagina > totalPaginas && totalPaginas > 0)
                {
                    pagina = totalPaginas;
                }
                
                // Calcular quantos itens pular
                int skipCount = (pagina - 1) * itensPorPagina;
                
                if (skipCount >= totalItens)
                {
                    skipCount = 0;
                    pagina = 1;
                }
                
                // Obter os pets para a página atual, respeitando o limite de itens por página
                var pets = await query
                    .Skip(skipCount)
                    .Take(itensPorPagina)
                    .ToListAsync();

                _logger.LogInformation($"Retornando {pets.Count} pets para a página {pagina} de {totalPaginas} (skip={skipCount}, take={itensPorPagina})");

                var viewModel = new PetViewModel
                {
                    Pets = pets,
                    PaginaAtual = pagina,
                    TotalPaginas = Math.Max(1, totalPaginas), // Garantir que sempre haja pelo menos 1 página
                    TotalItens = totalItens,
                    FiltroNome = filtroNome,
                    FiltroEspecie = !string.IsNullOrEmpty(filtroEspecie) ? EnumExtensions.ParseEnumMemberValue<Especie>(filtroEspecie) : (Especie?)null,
                    FiltroSexo = !string.IsNullOrEmpty(filtroSexo) ? EnumExtensions.ParseEnumMemberValue<SexoPet>(filtroSexo) : (SexoPet?)null,
                    FiltroPorte = filtroPorte,
                    FiltroIdade = filtroIdade,
                    FiltroRaca = filtroRaca,
                    FiltroOrdem = filtroOrdem,
                    ItensPorPaginaSelecionado = itensPorPagina
                };
                
                viewModel.Especies = new SelectList(new List<SelectListItem>
                {
                    new SelectListItem { Value = "Cachorro", Text = "Cachorro" },
                    new SelectListItem { Value = "Gato", Text = "Gato" }
                }, "Value", "Text");
                
                viewModel.Sexos = new SelectList(new List<SelectListItem>
                {
                    new SelectListItem { Value = "Macho", Text = "Macho" },
                    new SelectListItem { Value = "Fêmea", Text = "Fêmea" }
                }, "Value", "Text");
                
                viewModel.Portes = new SelectList(new List<SelectListItem>
                {
                    new SelectListItem { Value = "Pequeno", Text = "Pequeno" },
                    new SelectListItem { Value = "Médio", Text = "Médio" },
                    new SelectListItem { Value = "Grande", Text = "Grande" }
                }, "Value", "Text");
                
                viewModel.FaixasEtarias = new SelectList(new List<SelectListItem>
                {
                    new SelectListItem { Value = "Filhote", Text = "Filhote (< 1 ano)" },
                    new SelectListItem { Value = "Adulto", Text = "Adulto (1 a 7 anos)" },
                    new SelectListItem { Value = "Idoso", Text = "Idoso (> 7 anos)" }
                }, "Value", "Text");

                return View("~/Views/Usuario/ExplorarPets.cshtml", viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao acessar ExplorarPets");
                return View("Error");
            }
        }

        [HttpGet("detalhes/{id}")]
        public async Task<IActionResult> DetalhesPetAsync(int id)
        {
            var idUsuario = User.ObterIdUsuario();
            if (!string.IsNullOrEmpty(idUsuario))
            {
                // Chamada para método atualizado
                ViewBag.NotificacoesNaoLidas = await _servicoNotificacao.ContarNotificacoesNaoLidasAsync(idUsuario);
            }

            var pet = await _contexto.Pets
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (pet == null)
            {
                return NotFound();
            }
            
            var viewModel = PetViewModel.CriarDaEntidade(pet);
            return View("~/Views/Usuario/DetalhesPet.cshtml", viewModel);
        }

        [HttpPost("buscar")]
        public async Task<IActionResult> BuscarPetsAsync(string termoBusca, string especie, string idade, string sexo)
        {
            var petsQuery = _contexto.Pets.AsQueryable();
            
            petsQuery = petsQuery.Where(p => p.Status == StatusPet.Disponivel && p.CadastroCompleto);
            
            if (!string.IsNullOrEmpty(termoBusca))
            {
                termoBusca = termoBusca.ToLower();
                petsQuery = petsQuery.Where(p => 
                    p.Nome.ToLower().Contains(termoBusca) ||
                    p.Raca.ToLower().Contains(termoBusca) ||
                    p.Especie.ToString().ToLower().Contains(termoBusca));
            }
            
            if (!string.IsNullOrEmpty(especie) && especie != "Todos")
            {
                var especieEnum = EnumExtensions.ParseEnumMemberValue<Especie>(especie);
                petsQuery = petsQuery.Where(p => p.Especie == especieEnum);
            }
            
            if (!string.IsNullOrEmpty(idade))
            {
                switch (idade)
                {
                    case "Filhote":
                        petsQuery = petsQuery.Where(p => p.Anos < 1);
                        break;
                    case "Adulto":
                        petsQuery = petsQuery.Where(p => p.Anos >= 1 && p.Anos < 7);
                        break;
                    case "Idoso":
                        petsQuery = petsQuery.Where(p => p.Anos >= 7);
                        break;
                }
            }
            
            if (!string.IsNullOrEmpty(sexo) && sexo != "Todos")
            {
                var sexoEnum = EnumExtensions.ParseEnumMemberValue<SexoPet>(sexo);
                petsQuery = petsQuery.Where(p => p.Sexo == sexoEnum);
            }
            
            var pets = await petsQuery
                .OrderByDescending(p => p.DataCriacao)
                .Select(p => new {
                    p.Id,
                    p.Nome,
                    p.Especie,
                    p.Raca,
                    p.Sexo,
                    Idade = (p.Anos > 0 ? p.Anos + " ano(s) " : "") + (p.Meses > 0 ? p.Meses + " mês(es)" : ""),
                    p.Porte,
                    p.NomeArquivoImagem,
                    ImagemUrl = !string.IsNullOrEmpty(p.NomeArquivoImagem) 
                                ? $"/imagens/Imagens CaotinhoAuMiau/{p.NomeArquivoImagem}" 
                                : "/imagens/default-pet.jpg"
                })
                .Take(10)
                .ToListAsync();
            
            return Json(new { sucesso = true, dados = pets });
        }

    }
} 