using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models.ViewModels;
using CaotinhoAuMiau.Models.ViewModels.Usuario;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using CaotinhoAuMiau.Services;
using CaotinhoAuMiau.Utils;
using CaotinhoAuMiau.Models.Enums;

namespace CaotinhoAuMiau.Controllers.Usuario
{
    [Route("usuario/adocao")]
    [Authorize(Roles = "Usuario")]
    public class AdocaoController : Controller
    {
        private readonly ApplicationDbContext _contexto;
        private readonly NotificationService _servicoNotificacao;
        private readonly HistoricoAdocaoServico _historicoServico;

        public AdocaoController(ApplicationDbContext contexto, NotificationService servicoNotificacao, HistoricoAdocaoServico historicoServico)
        {
            _contexto = contexto;
            _servicoNotificacao = servicoNotificacao;
            _historicoServico = historicoServico;
        }

        [HttpGet]
        [Route("~/usuario/adocoes")]
        public async Task<IActionResult> ListarAsync(int pagina = 1, int itensPorPagina = 12)
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return RedirectToAction("ExibirTelaLogin", "Authentication");
            }

            // Garantir que itensPorPagina seja um valor válido
            if (itensPorPagina != 12 && itensPorPagina != 24 && itensPorPagina != 36 && itensPorPagina != 48)
            {
                itensPorPagina = 12; // Valor padrão
            }

            var query = _contexto.FormulariosAdocao
                .Include(a => a.Pet)
                .Include(a => a.Usuario)
                .Where(a => a.UsuarioId.ToString() == idUsuario)
                .OrderByDescending(a => a.DataEnvio);

            var totalItens = await query.CountAsync();

            var formularios = await query
                .Skip((pagina - 1) * itensPorPagina)
                .Take(itensPorPagina)
                .ToListAsync();

            var adocoes = await _contexto.Adocoes
                .Where(a => a.UsuarioId.ToString() == idUsuario &&
                      (a.Status == "Finalizada" || a.Status == "Aguardando buscar"))
                .ToListAsync();

            foreach (var formulario in formularios)
            {
                var adocaoCorrespondente = adocoes.FirstOrDefault(a => a.PetId == formulario.PetId);
                if (adocaoCorrespondente != null)
                {
                    formulario.Status = adocaoCorrespondente.Status;
                }
            }
            
            var viewModel = new AdocaoListaViewModel
            {
                Formularios = formularios,
                PaginaAtual = pagina,
                TotalItens = totalItens,
                ItensPorPagina = itensPorPagina
            };
            
            ViewBag.PaginaAtual = pagina;
            ViewBag.TotalPaginas = (totalItens + itensPorPagina - 1) / itensPorPagina;
            ViewBag.ItensPorPagina = itensPorPagina;
            ViewBag.TotalItens = totalItens;
            
            return View("~/Views/Usuario/Adocoes.cshtml", viewModel);
        }

        [HttpGet]
        [Route("formulario/{petId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> ExibirFormularioAsync(int petId)
        {
            var pet = await _contexto.Pets.FirstOrDefaultAsync(p => p.Id == petId);
            
            if (pet == null)
            {
                return NotFound();
            }
            
            var idUsuario = User.ObterIdUsuario();
            
            if (string.IsNullOrEmpty(idUsuario))
            {
                TempData["RedirectToPetId"] = petId;
                var returnUrl = $"/usuario/adocao/formulario/{petId}";
                return RedirectToAction("ExibirTelaLogin", "Authentication", new { returnUrl });
            }
            
            var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id.ToString() == idUsuario);
            
            if (usuario == null)
            {
                return RedirectToAction("ExibirTelaLogin", "Authentication", new { returnUrl = $"/usuario/adocao/formulario/{petId}" });
            }
            
            var formularioExistente = await _contexto.FormulariosAdocao
                .FirstOrDefaultAsync(f => f.PetId == petId && f.UsuarioId.ToString() == idUsuario && 
                                        (f.Status == "Pendente" || f.Status == "Em Processo" || 
                                         f.Status == "Aguardando buscar"));
                                         
            if (formularioExistente != null)
            {
                TempData["Erro"] = "Você já possui um formulário de adoção pendente ou em processo para este pet.";
                return RedirectToAction("DetalhesPet", "Pet", new { id = petId });
            }
            
            var viewModel = FormularioAdocaoViewModel.Criar(pet, usuario);
            return View("~/Views/Usuario/FormularioAdocao.cshtml", viewModel);
        }

        [HttpPost]
        [Route("formulario/{petId:int}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ProcessarFormularioAsync(int petId, FormularioAdocaoViewModel viewModel)
        {
            try
            {
                var idUsuario = User.ObterIdUsuario();
                if (string.IsNullOrEmpty(idUsuario))
                {
                    return Json(new { success = false, message = "Usuário não autenticado" });
                }

                var pet = await _contexto.Pets.FirstOrDefaultAsync(p => p.Id == petId);
                if (pet == null)
                {
                    return Json(new { success = false, message = "Pet não encontrado" });
                }

                var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id.ToString() == idUsuario);
                if (usuario == null)
                {
                    return Json(new { success = false, message = "Usuário não encontrado" });
                }

                if (!ModelState.IsValid)
                {
                    var erros = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                        
                    return Json(new { success = false, message = "Por favor, corrija os erros no formulário.", errors = erros });
                }

                viewModel.Pet = pet;
                viewModel.Usuario = usuario;
                
                var formulario = viewModel.ToModel();

                _contexto.FormulariosAdocao.Add(formulario);

                // StatusPet é um enum; use o valor correspondente ao invés de uma string
                pet.Status = StatusPet.EmProcesso;

                await _contexto.SaveChangesAsync();

                await _servicoNotificacao.CriarNotificacaoAsync(
                    idUsuario,
                    "Solicitação de adoção enviada",
                    $"Sua solicitação de adoção para o pet {pet.Nome} foi enviada com sucesso! Aguarde a análise da equipe.",
                    "Adocao",
                    formulario.Id.ToString()
                );

                return Json(new { success = true, message = "Formulário enviado com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Erro ao processar formulário: {ex.Message}" });
            }
        }

        [HttpGet("detalhes/{id}")]
        public async Task<IActionResult> ExibirDetalhesAsync(int id)
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return RedirectToAction("ExibirTelaLogin", "Authentication");
            }

            var adocao = await _contexto.FormulariosAdocao
                .Include(f => f.Pet)
                .Include(f => f.Usuario)
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId.ToString() == idUsuario);

            if (adocao == null)
            {
                return NotFound();
            }

            return View("~/Views/Usuario/DetalhesAdocao.cshtml", adocao);
        }

        [HttpPost("cancelar-formulario-adocao/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CancelarFormularioAdocaoAsync(int id, [FromBody] CancelamentoRequest request)
        {
            try
            {
                var idUsuario = User.ObterIdUsuario();
                if (string.IsNullOrEmpty(idUsuario))
                {
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, message = "Usuário não autenticado" });
                    }
                    return RedirectToAction("ExibirTelaLogin", "Authentication");
                }

                string motivoCancelamento = request?.MotivoCancelamento;
                
                if (string.IsNullOrWhiteSpace(motivoCancelamento))
                {
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, message = "É necessário informar o motivo do cancelamento" });
                    }
                    TempData["Erro"] = "É necessário informar o motivo do cancelamento";
                    return RedirectToAction(nameof(ListarAsync));
                }
                
                if (motivoCancelamento.Trim().Length < 10)
                {
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, message = "O motivo do cancelamento deve ter pelo menos 10 caracteres" });
                    }
                    TempData["Erro"] = "O motivo do cancelamento deve ter pelo menos 10 caracteres";
                    return RedirectToAction(nameof(ListarAsync));
                }

                var formulario = await _contexto.FormulariosAdocao
                    .Include(f => f.Pet)
                    .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId.ToString() == idUsuario);

                if (formulario == null)
                {
                    if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                    {
                        return Json(new { success = false, message = "Formulário não encontrado" });
                    }
                    return NotFound();
                }

                bool formularioAprovado = formulario.Status == "Aprovado" || 
                                         formulario.Status == "Aguardando buscar";

                formulario.Status = "Cancelada";
                formulario.ObservacoesCancelamento = $"Cancelado pelo usuário em {DateTime.Now:dd/MM/yyyy HH:mm}. Motivo: {motivoCancelamento}";

                if (formularioAprovado)
                {
                    var adocao = await _contexto.Adocoes
                        .FirstOrDefaultAsync(a => a.PetId == formulario.PetId && a.UsuarioId == formulario.UsuarioId);

                    if (adocao != null)
                    {
                        adocao.Status = "Cancelado pelo Usuario";
                        adocao.DataFinalizacao = DateTime.Now;
                        adocao.ObservacoesCancelamento = $"Cancelado pelo usuário em {DateTime.Now:dd/MM/yyyy HH:mm}. Motivo: {motivoCancelamento}";
                    }
                }

                if (formulario.Pet != null)
                {
                    // Atualiza o status usando o enum correspondente
                    formulario.Pet.Status = StatusPet.Disponivel;
                }

                await _contexto.SaveChangesAsync();

                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = true, message = "Adoção cancelada com sucesso" });
                }

                TempData["Sucesso"] = "Adoção cancelada com sucesso!";
                return RedirectToAction(nameof(ListarAsync));
            }
            catch (Exception ex)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    return Json(new { success = false, message = $"Erro ao cancelar a adoção: {ex.Message}" });
                }
                
                TempData["Erro"] = $"Erro ao cancelar a adoção: {ex.Message}";
                return RedirectToAction(nameof(ListarAsync));
            }
        }

        [HttpPost("reativar-formulario-adocao/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReativarFormularioAdocaoAsync(int id)
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return RedirectToAction("ExibirTelaLogin", "Authentication");
            }

            var formulario = await _contexto.FormulariosAdocao
                .Include(f => f.Pet)
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId.ToString() == idUsuario);

            if (formulario == null)
            {
                return NotFound();
            }

            formulario.Status = "Pendente";

            if (formulario.Pet != null)
            {
                // Status de pet atualizado usando o enum
                formulario.Pet.Status = StatusPet.EmProcesso;
            }
            
            await _contexto.SaveChangesAsync();

            TempData["Sucesso"] = "Formulário de adoção reativado com sucesso!";
            return RedirectToAction(nameof(ListarAsync));
        }

        [HttpGet("formulario-detalhes/{id}")]
        public async Task<IActionResult> ObterDetalhesFormularioAsync(int id)
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized();
            }

            var adocao = await _contexto.FormulariosAdocao
                .Include(f => f.Pet)
                .Include(f => f.Usuario)
                .FirstOrDefaultAsync(f => f.Id == id && f.UsuarioId.ToString() == idUsuario);

            if (adocao == null)
            {
                return NotFound();
            }

            var respostas = new List<object>
            {
                new { pergunta = "Você tem espaço adequado para o animal?", resposta = adocao.EspacoAdequado },
                new { pergunta = "Você tem experiência anterior com animais?", resposta = adocao.ExperienciaAnterior },
                new { pergunta = "Qual sua motivação para adoção?", resposta = adocao.MotivacaoAdocao },
                new { pergunta = "Você tem condições financeiras para cuidar do animal?", resposta = adocao.CondicoesFinanceiras },
                new { pergunta = "Como você planeja cuidar do animal durante viagens?", resposta = adocao.PlanejamentoViagens },
                new { pergunta = "Qual é sua renda mensal?", resposta = adocao.RendaMensal.ToString("C", System.Globalization.CultureInfo.GetCultureInfo("pt-BR")) },
                new { pergunta = "Quantas pessoas moram na residência?", resposta = adocao.NumeroMoradores.ToString() },
                new { pergunta = "Descreva sua moradia:", resposta = adocao.DescricaoMoradia }
            };

            return Json(new { 
                Id = adocao.Id,
                Status = adocao.Status,
                DataEnvio = adocao.DataEnvio,
                DataResposta = adocao.DataResposta,
                ObservacoesCancelamento = adocao.ObservacoesCancelamento,
                ObservacaoCancelamento = adocao.ObservacoesCancelamento,
                ObservacaoResposta = adocao.ObservacaoAdminFormulario,
                CanceladoPeloUsuario = adocao.Status?.Contains("Usuário") ?? false,
                Pet = new {
                    Id = adocao.Pet.Id,
                    Nome = adocao.Pet.Nome,
                    Especie = adocao.Pet.Especie,
                    Raca = adocao.Pet.Raca,
                    Idade = adocao.Pet.Anos,
                    Sexo = adocao.Pet.Sexo,
                    Status = adocao.Pet.Status,
                    ImagemUrl = !string.IsNullOrEmpty(adocao.Pet.NomeArquivoImagem) ? 
                           $"/imagens/pets/{adocao.Pet.NomeArquivoImagem}" : 
                           "/imagens/pets/pet-placeholder.jpg"
                },
                Respostas = respostas
            });
        }

        [HttpGet("historico")]
        public async Task<IActionResult> BuscarHistoricoAdocoesAsync()
        {
            try
            {
                var idUsuario = User.ObterIdUsuario();
                
                if (string.IsNullOrEmpty(idUsuario))
                {
                    return Unauthorized(new { erro = "Usuário não autenticado" });
                }

                var historico = await _historicoServico.ObterPorUsuarioAsync(int.Parse(idUsuario), true);

                var resultado = historico.Select(a => new
                {
                    id = a.Id,
                    petId = a.PetId,
                    petNome = a.NomePet,
                    petEspecie = a.EspeciePet,
                    petRaca = a.RacaPet,
                    petFoto = a.NomeArquivoImagem,
                    dataAdocao = a.DataFinalizacao ?? a.DataEnvio,
                    dataInicio = a.DataEnvio,
                    status = a.Status,
                    observacoes = a.Observacoes
                }).ToList();

                return Json(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = ex.Message });
            }
        }

        [HttpGet("verificar-adocoes-pendentes")]
        public async Task<IActionResult> VerificarAdocoesPendentesAsync()
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Json(new { temAdocoesPendentes = false });
            }

            var temAdocoesPendentes = await _contexto.FormulariosAdocao
                .AnyAsync(f => f.UsuarioId.ToString() == idUsuario && 
                              (f.Status == "Pendente" || f.Status == "Em Processo" || 
                               f.Status == "Aguardando buscar"));

            return Json(new { temAdocoesPendentes });
        }

        [HttpGet("status-adocao/{id}")]
        public async Task<IActionResult> StatusAdocaoAsync(int id)
        {
            try
            {
                var formulario = await _contexto.FormulariosAdocao
                    .FirstOrDefaultAsync(f => f.Id == id);
                    
                if (formulario == null)
                {
                    return Json(new { success = false, message = "Formulário não encontrado" });
                }
                
                if (formulario.Status != "Aprovado")
                {
                    return Json(new { success = true, status = formulario.Status });
                }
                
                var adocao = await _contexto.Adocoes
                    .FirstOrDefaultAsync(a => a.PetId == formulario.PetId && a.UsuarioId == formulario.UsuarioId);
                    
                if (adocao == null)
                {
                    return Json(new { success = true, status = formulario.Status });
                }
                
                return Json(new { success = true, status = adocao.Status });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Erro ao obter status: {ex.Message}" });
            }
        }
    }

    public class CancelamentoRequest
    {
        public string MotivoCancelamento { get; set; } = string.Empty;
    }
} 