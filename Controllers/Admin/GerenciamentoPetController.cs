using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Models.ViewModels;
using CaotinhoAuMiau.Models.ViewModels.Admin;
using CaotinhoAuMiau.Models.Enums;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Authorization;
using CaotinhoAuMiau.Services;
using CaotinhoAuMiau.Utils;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace CaotinhoAuMiau.Controllers.Admin
{
    [Route("admin/pets")]
    [Authorize(Roles = "Administrador")]
    [RequestFormLimits(MultipartBodyLengthLimit = 52428800)]
    [RequestSizeLimit(52428800)]
    public class GerenciamentoPetController : Controller
    {
        private readonly ApplicationDbContext _contexto;
        private readonly IWebHostEnvironment _ambiente;
        private readonly NotificacaoServico _servicoNotificacao;
        private readonly IPetService _petService;
        private readonly ILogger<GerenciamentoPetController> _logger;

        public GerenciamentoPetController(ApplicationDbContext contexto, IWebHostEnvironment ambiente, NotificacaoServico servicoNotificacao, IPetService petService, ILogger<GerenciamentoPetController> logger)
        {
            _contexto = contexto;
            _ambiente = ambiente;
            _servicoNotificacao = servicoNotificacao;
            _petService = petService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> ListarAsync(int pagina = 1, int itensPorPagina = 14)
        {
            var adminId = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(adminId))
            {
                return RedirectToAction("ExibirTelaLogin", "Autenticacao");
            }

            if (pagina < 1) pagina = 1;

            if (itensPorPagina != 14 && itensPorPagina != 24 && itensPorPagina != 48)
            {
                itensPorPagina = 14;
            }

            var query = _contexto.Pets
                .OrderByDescending(p => p.CadastroCompleto == false)
                .ThenByDescending(p => p.DataCriacao);

            var totalItens = await query.CountAsync();
            
            int totalPaginas = Math.Max(1, (int)Math.Ceiling(totalItens / (double)itensPorPagina));

            if (pagina > totalPaginas)
            {
                pagina = totalPaginas;
            }
            
            var pets = await query
                .Skip((pagina - 1) * itensPorPagina)
                .Take(itensPorPagina)
                .ToListAsync();

            ViewBag.PaginaAtual = pagina;
            ViewBag.ItensPorPagina = itensPorPagina;
            ViewBag.TotalPaginas = totalPaginas;
            ViewBag.TotalItens = totalItens;

            return View("~/Views/Admin/GerenciamentoPet.cshtml", pets);
        }

        [HttpGet("criar")]
        public IActionResult ExibirFormularioCriacao()
        {
            return View("~/Views/Admin/GerenciamentoPet.cshtml");
        }

        [HttpPost("SalvarPet")]

        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SalvarPetAsync([FromForm]Pet pet, IFormFile foto, bool RemoverImagem = false, bool CadastroCompleto = true, bool ManterImagemAtual = false)
        {
            try
            {
                var resultado = await _petService.SalvarPetAsync(pet, foto, _ambiente.WebRootPath, RemoverImagem, CadastroCompleto, ManterImagemAtual);
                return Json(new { sucesso = resultado.Sucesso, mensagem = resultado.Mensagem, petId = resultado.PetId });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao salvar pet.");
                return Json(new { sucesso = false, mensagem = "Não foi possível salvar o pet devido a um problema de dados." });
            }
            catch (IOException ioEx)
            {
                _logger.LogWarning(ioEx, "Falha de I/O ao processar imagem do pet.");
                return Json(new { sucesso = false, mensagem = "Erro ao processar a imagem do pet." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao salvar pet.");
                throw;
            }
        }

        [HttpGet("editar/{id}")]
        public async Task<IActionResult> ExibirFormularioEdicaoAsync(int id)
        {
            var pet = await _contexto.Pets
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pet == null)
            {
                return NotFound();
            }

            var viewModel = new PetViewModel
            {
                Id = pet.Id,
                Nome = pet.Nome,
                Descricao = pet.Descricao,
                NomeArquivoImagem = pet.NomeArquivoImagem,
                Especie = pet.Especie,
                Raca = pet.Raca,
                Anos = pet.Anos,
                Meses = pet.Meses,
                Sexo = pet.Sexo,
                Porte = pet.Porte,
                Status = pet.Status,
                CadastroCompleto = pet.CadastroCompleto
            };

            return View("~/Views/Admin/GerenciamentoPet.cshtml", viewModel);
        }

        [HttpPost("excluir/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ExcluirPetAsync(int id)
        {
            var pet = await _contexto.Pets
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pet == null)
            {
                return Json(new { sucesso = false, mensagem = "Pet não encontrado." });
            }

            if (pet.Status == StatusPet.Adotado || pet.Status == StatusPet.EmProcesso)
            {
                return Json(new { sucesso = false, mensagem = "Não é possível excluir um pet que está em processo de adoção ou já foi adotado." });
            }

            try
            {
                if (!string.IsNullOrEmpty(pet.NomeArquivoImagem))
                {
                    ImagemHelper.Remover(_ambiente.WebRootPath, "pets", pet.NomeArquivoImagem);
                }

                _contexto.Pets.Remove(pet);
                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Pet excluído com sucesso!" });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro ao excluir pet, possível conflito no banco.");
                return Json(new { sucesso = false, mensagem = "Não foi possível excluir o pet devido a um problema de dados." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao excluir pet.");
                throw;
            }
        }

        [HttpPost("alterar-status/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AlterarStatusPetAsync(int id, [FromBody] JsonElement modelo)
        {
            try
            {
                if (!modelo.TryGetProperty("novoStatus", out JsonElement novoStatusElement))
                {
                    return Json(new { sucesso = false, mensagem = "O status do pet não foi informado." });
                }
                
                string novoStatus = novoStatusElement.GetString();
                
                if (string.IsNullOrEmpty(novoStatus))
                {
                    return Json(new { sucesso = false, mensagem = "O status do pet não foi informado." });
                }
                
                var pet = await _contexto.Pets.FindAsync(id);
                
                if (pet == null)
                {
                    return Json(new { sucesso = false, mensagem = "Pet não encontrado." });
                }
                
                pet.Status = EnumExtensions.ParseEnumMemberValue<StatusPet>(novoStatus);
                pet.DataAtualizacao = DateTime.Now;
                
                await _contexto.SaveChangesAsync();
                
                return Json(new { sucesso = true, mensagem = $"Status do pet alterado para {novoStatus} com sucesso!" });
            }
            catch (DbUpdateConcurrencyException dbConcEx)
            {
                _logger.LogWarning(dbConcEx, "Conflito de concorrência ao alterar status do pet.");
                return Json(new { sucesso = false, mensagem = "O status do pet já foi alterado por outro usuário." });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao alterar status do pet.");
                return Json(new { sucesso = false, mensagem = "Não foi possível alterar o status devido a um problema de dados." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao alterar status do pet.");
                throw;
            }
        }

        [HttpGet("ObterPet/{id}")]
        public async Task<IActionResult> ObterDadosPetAsync(int id)
        {
            try
            {
                var pet = await _contexto.Pets
                    .FirstOrDefaultAsync(p => p.Id == id);
                
                if (pet == null)
                {
                    return Json(new { sucesso = false, mensagem = "Pet não encontrado." });
                }

                var resultado = new
                {
                    id = pet.Id,
                    nome = pet.Nome,
                    especie = pet.Especie,
                    raca = pet.Raca,
                    anos = pet.Anos,
                    meses = pet.Meses,
                    sexo = pet.Sexo.GetEnumMemberValue(),
                    porte = pet.Porte,
                    status = pet.Status,
                    descricao = pet.Descricao,
                    nomeArquivoImagem = pet.NomeArquivoImagem,
                    cadastroCompleto = pet.CadastroCompleto,
                    dataCriacao = pet.DataCriacao,
                    dataAtualizacao = pet.DataAtualizacao
                };
                
                return Json(new { sucesso = true, dados = resultado });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao obter dados do pet.");
                return Json(new { sucesso = false, mensagem = "Não foi possível carregar os dados do pet." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao obter pet.");
                throw;
            }
        }

        [HttpPost("CadastrarPet")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CadastrarPetAjaxAsync(PetViewModel? modelo, IFormFile? imagemUpload)
        {
            try
            {
                _logger.LogInformation("=========== INÍCIO DO LOG DE CADASTRO DE PET ===========");
                _logger.LogInformation("Recebendo cadastro de pet: {Nome}, Espécie: {Especie}", modelo?.Nome, modelo?.Especie);
                _logger.LogInformation("É rascunho: {Rascunho}", modelo?.CadastroCompleto == false);
                _logger.LogInformation("Imagem recebida: {InfoImagem}", imagemUpload != null ? $"Sim, nome: {imagemUpload.FileName}, tamanho: {imagemUpload.Length} bytes" : "Não");
                
                if (modelo == null)
                {
                    return Json(new { sucesso = false, erros = new Dictionary<string, string> { { "Geral", "Dados do pet não fornecidos." } } });
                }

                if (!ModelState.IsValid)
                {
                    var erros = ModelState.Where(ms => ms.Value.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.First().ErrorMessage);
                    return Json(new { sucesso = false, erros });
                }

                var pet = new Pet
                {
                    Nome = modelo.Nome,
                    Especie = modelo.Especie,
                    Raca = modelo.Raca,
                    Anos = modelo.Anos,
                    Meses = modelo.Meses,
                    Sexo = modelo.Sexo,
                    Porte = modelo.Porte,
                    Descricao = modelo.Descricao,
                    Status = modelo.CadastroCompleto ? StatusPet.Disponivel : StatusPet.Rascunho,
                    DataCriacao = DateTime.Now,
                    CadastroCompleto = modelo.CadastroCompleto,
                    UsuarioId = 0,
                    NomeArquivoImagem = null
                };
                
                if (imagemUpload != null && imagemUpload.Length > 0)
                {
                    pet.NomeArquivoImagem = await ImagemHelper.SalvarAsync(
                        imagemUpload,
                        _ambiente.WebRootPath,
                        "pets");
                }
                else
                {
                    pet.NomeArquivoImagem = null;
                }
                
                _contexto.Pets.Add(pet);
                await _contexto.SaveChangesAsync();
                
                return Json(new { 
                    sucesso = true, 
                    mensagem = modelo.CadastroCompleto ? "Pet cadastrado com sucesso!" : "Rascunho salvo com sucesso!",
                    pet = new { 
                        id = pet.Id, 
                        nome = pet.Nome,
                        nomeArquivoImagem = pet.NomeArquivoImagem,
                        cadastroCompleto = pet.CadastroCompleto
                    } 
                });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao cadastrar pet.");
                return Json(new { sucesso = false, mensagem = "Não foi possível cadastrar o pet por um problema de dados." });
            }
            catch (IOException ioEx)
            {
                _logger.LogWarning(ioEx, "Falha de I/O ao salvar imagem do pet.");
                return Json(new { sucesso = false, mensagem = "Erro ao salvar a imagem do pet." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao cadastrar pet.");
                throw;
            }
        }

        [HttpGet("ObterDetalhesPet/{id}")]
        public async Task<IActionResult> ObterDetalhesPetAsync(int id)
        {
            try
            {
                var pet = await _contexto.Pets.FirstOrDefaultAsync(p => p.Id == id);
                
                if (pet == null)
                {
                    return Json(new { success = false, message = "Pet não encontrado" });
                }
                
                string idadeFormatada = $"{pet.Anos} ano(s) e {pet.Meses} mês(es)";
                
                var petDto = new
                {
                    id = pet.Id,
                    nome = pet.Nome,
                    especie = pet.Especie,
                    raca = pet.Raca,
                    sexo = pet.Sexo.GetEnumMemberValue(),
                    porte = pet.Porte,
                    status = pet.Status.GetEnumMemberValue(),
                    idade = idadeFormatada,
                    anos = pet.Anos,
                    meses = pet.Meses,
                    descricao = pet.Descricao,
                    nomeArquivoImagem = pet.NomeArquivoImagem,
                    cadastroCompleto = pet.CadastroCompleto
                };
                
                return Json(new { success = true, pet = petDto });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogWarning(dbEx, "Erro de banco ao obter detalhes do pet.");
                return Json(new { success = false, message = "Não foi possível obter detalhes do pet." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao obter detalhes do pet.");
                throw;
            }
        }

        [HttpGet("ObterListaPets")]
        public async Task<IActionResult> ObterListaPetsAsync()
        {
            try
            {
                var adminId = User.ObterIdUsuario();
                if (string.IsNullOrEmpty(adminId))
                {
                    return Json(new { success = false, message = "Usuário não autenticado" });
                }
                
                var pets = await _contexto.Pets
                    .OrderByDescending(p => p.CadastroCompleto == false)
                    .ThenByDescending(p => p.DataCriacao)
                    .ToListAsync();

                var petsFormatados = pets.Select(p => new
                {
                    p.Id,
                    p.Nome,
                    p.Especie,
                    p.Raca,
                    p.Sexo,
                    p.Porte,
                    p.Anos,
                    p.Meses,
                    p.Status,
                    p.Descricao,
                    p.NomeArquivoImagem,
                    DataCadastro = p.DataCriacao.ToString("dd/MM/yyyy"),
                    p.CadastroCompleto
                });
                
                return Json(new { sucesso = true, pets = petsFormatados });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter pets: {ex.Message}" });
            }
        }


        [HttpGet("verificar-nome")]
        public async Task<IActionResult> VerificarNomeAsync(string nome, int id = 0)
        {
            if (string.IsNullOrWhiteSpace(nome))
            {
                return Json(new { disponivel = false, mensagem = "O nome do pet é obrigatório." });
            }
            
            var nomeTrim = nome.Trim();
            var petExistente = await _contexto.Pets
                .Where(p => p.Nome.ToLower() == nomeTrim.ToLower() 
                         && p.Id != id
                         && p.Status != "Finalizado" 
                         && p.Status != "Adotado")
                .FirstOrDefaultAsync();
            
            return Json(new { 
                disponivel = petExistente == null,
                mensagem = petExistente == null ? "" : $"Este nome já está sendo usado por outro pet ativo no sistema."
            });
        }

    }
} 