using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models.ViewModels.Admin;
using CaotinhoAuMiau.Models.ViewModels.Usuario;
using CaotinhoAuMiau.Models.Enums;
using System.Linq;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using CaotinhoAuMiau.Services;
using System.Text.Json;
using CaotinhoAuMiau.Utils;
using Microsoft.Extensions.Logging;

namespace CaotinhoAuMiau.Controllers.Admin
{
    [Authorize(Roles = "Administrador")]
    [Route("admin/adocoes")]
    public class GerenciamentoAdocaoController : Controller
    {
        private readonly ApplicationDbContext _contexto;
        private readonly NotificationService _servicoNotificacao;
        private readonly HistoricoAdocaoServico _historicoServico;
        private readonly ILogger<GerenciamentoAdocaoController> _logger;

        public GerenciamentoAdocaoController(ApplicationDbContext contexto, NotificationService servicoNotificacao, HistoricoAdocaoServico historicoServico, ILogger<GerenciamentoAdocaoController> logger)
        {
            _contexto = contexto;
            _servicoNotificacao = servicoNotificacao;
            _historicoServico = historicoServico;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> ListarAsync(int pagina = 1, int itensPorPagina = 10, string filtroStatus = "", string filtroData = "", string pesquisa = "")
        {
            var adminId = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(adminId))
            {
                return RedirectToAction("ExibirTelaLogin", "Authentication");
            }
            
            // Lógica de expiração automática
            var adocoesExpiradas = await _contexto.Adocoes
                .Include(a => a.Pet)
                .Where(a => a.Status == "Aguardando buscar" && a.DataResposta.HasValue && a.DataResposta.Value.AddDays(10) < DateTime.Now)
                .ToListAsync();
            foreach (var adocao in adocoesExpiradas)
            {
                adocao.Status = "Expirada";
                if (adocao.Pet != null)
                {
                    adocao.Pet.Status = StatusPet.Disponivel;
                }
            }
            if (adocoesExpiradas.Any())
            {
                await _contexto.SaveChangesAsync();
            }
            
            var query = _contexto.Adocoes
                .Include(a => a.Pet)
                .Include(a => a.Usuario)
                .AsQueryable();
            
            if (!string.IsNullOrEmpty(filtroStatus))
            {
                query = query.Where(a => a.Status.ToLower() == filtroStatus.ToLower());
            }
            
            if (!string.IsNullOrEmpty(filtroData))
            {
                var hoje = DateTime.Today;
                switch (filtroData.ToLower())
                {
                    case "hoje":
                        query = query.Where(a => a.DataEnvio.Date == hoje);
                        break;
                    case "7dias":
                        query = query.Where(a => a.DataEnvio.Date >= hoje.AddDays(-7));
                        break;
                    case "30dias":
                        query = query.Where(a => a.DataEnvio.Date >= hoje.AddDays(-30));
                        break;
                }
            }
            
            if (!string.IsNullOrEmpty(pesquisa))
            {
                pesquisa = pesquisa.ToLower();
                query = query.Where(a => 
                    (a.Usuario.Nome != null && a.Usuario.Nome.ToLower().Contains(pesquisa)) ||
                    (a.Usuario.Email != null && a.Usuario.Email.ToLower().Contains(pesquisa)) ||
                    (a.Pet.Nome != null && a.Pet.Nome.ToLower().Contains(pesquisa)) ||
                    (a.Status != null && a.Status.ToLower().Contains(pesquisa))
                );
            }
            
            var totalItens = await query.CountAsync();
            
            var adocoesPaginadas = await query
                .OrderByDescending(a => a.DataEnvio)
                .Skip((pagina - 1) * itensPorPagina)
                .Take(itensPorPagina)
                .ToListAsync();

            ViewBag.PaginaAtual = pagina;
            ViewBag.ItensPorPagina = itensPorPagina;
            ViewBag.TotalItens = totalItens;
            ViewBag.TotalPaginas = (int)Math.Ceiling(totalItens / (double)itensPorPagina);
            
            ViewBag.FiltroStatus = filtroStatus;
            ViewBag.FiltroData = filtroData;
            ViewBag.Pesquisa = pesquisa;

            return View("~/Views/Admin/GerenciamentoAdocoes.cshtml", adocoesPaginadas);
        }

        [HttpGet("Detalhes/{id}")]
        public async Task<IActionResult> ObterDetalhesAdocaoAsync(int id)
        {
            var formulario = await _contexto.FormulariosAdocao
                .Include(a => a.Pet)
                .Include(a => a.Usuario)
                .FirstOrDefaultAsync(a => a.Id == id);
                
            if (formulario == null)
            {
                return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
            }
            
            var result = new
            {
                id = formulario.Id,
                status = formulario.Status,
                dataInicio = formulario.DataEnvio,
                dataResposta = formulario.DataResposta,
                observacaoAdminFormulario = formulario.ObservacaoAdminFormulario,
                observacoesCancelamento = formulario.ObservacoesCancelamento,
                pet = new
                {
                    id = formulario.Pet.Id,
                    nome = formulario.Pet.Nome,
                    especie = formulario.Pet.Especie,
                    raca = formulario.Pet.Raca,
                    porte = formulario.Pet.Porte,
                    sexo = formulario.Pet.Sexo,
                    anos = formulario.Pet.Anos,
                    meses = formulario.Pet.Meses,
                    imagem = formulario.Pet.NomeArquivoImagem
                },
                adotante = new
                {
                    id = formulario.Usuario.Id,
                    nome = formulario.Usuario.Nome,
                    email = formulario.Usuario.Email,
                    telefone = formulario.Usuario.Telefone,
                    cpf = formulario.Usuario.CPF
                }
            };

            return Json(new { sucesso = true, dados = result });
        }

        [HttpPost("aprovar/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AprovarAdocaoAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                }

                var adminIdStr = User.ObterIdUsuario();
                if (int.TryParse(adminIdStr, out var adminId))
                {
                    var admin = await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Id == adminId);
                    if (admin != null && admin.UsuarioId.HasValue && admin.UsuarioId.Value == adocao.UsuarioId)
                    {
                        return Json(new { sucesso = false, mensagem = "Outro administrador deve aprovar esta adoção." });
                    }
                }
                
                if (adocao.Status == "Aprovado" || adocao.Status == "Rejeitada" ||
                    adocao.Status == "Cancelada")
                {
                    return Json(new { sucesso = false, mensagem = $"Esta adoção já foi {adocao.Status.ToLower()}." });
                }
                
                adocao.Status = "Aprovado";
                adocao.DataResposta = DateTime.Now;
                
                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null)
                {
                    pet.Status = StatusPet.EmProcesso;
                }
                
                if (adocao.Usuario != null)
                {
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        "Solicitação de adoção aprovada",
                        $"Sua solicitação de adoção para o pet {pet?.Nome} foi aprovada!",
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }
                
                await _contexto.SaveChangesAsync();
                
                return Json(new { sucesso = true, mensagem = "Adoção aprovada com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao aprovar adoção: {ex.Message}" });
            }
        }

        [HttpPost("rejeitar/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> RejeitarAdocaoAsync(int id, string motivo)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                }

                var adminIdStr = User.ObterIdUsuario();
                if (int.TryParse(adminIdStr, out var adminId))
                {
                    var admin = await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Id == adminId);
                    if (admin != null && admin.UsuarioId.HasValue && admin.UsuarioId.Value == adocao.UsuarioId)
                    {
                        return Json(new { sucesso = false, mensagem = "Outro administrador deve avaliar esta adoção." });
                    }
                }
                
                if (string.IsNullOrWhiteSpace(motivo))
                {
                    return Json(new { sucesso = false, mensagem = "É necessário fornecer um motivo para a rejeição." });
                }
                
                if (adocao.Status == "Aprovado" || adocao.Status == "Rejeitada" ||
                    adocao.Status == "Cancelada")
                {
                    return Json(new { sucesso = false, mensagem = $"Esta adoção já foi {adocao.Status.ToLower()}." });
                }
                
                adocao.Status = "Rejeitada";
                adocao.DataResposta = DateTime.Now;
                adocao.ObservacoesCancelamento = motivo;
                
                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null)
                {
                    pet.Status = StatusPet.Disponivel;
                }
                
                if (adocao.Usuario != null)
                {
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        "Solicitação de adoção rejeitada",
                        $"Sua solicitação de adoção para o pet {pet?.Nome} foi rejeitada. Motivo: {motivo}",
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }
                
                await _contexto.SaveChangesAsync();
                
                return Json(new { sucesso = true, mensagem = "Adoção rejeitada com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao rejeitar adoção: {ex.Message}" });
            }
        }

        [HttpPost("finalizar/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FinalizarAdocaoAsync(int id)
        {
            try
            {
                var resultado = await ProcessarFinalizacaoAsync(id);
                return Json(new { sucesso = resultado.Sucesso, mensagem = resultado.Mensagem });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao finalizar adoção: {ex.Message}" });
            }
        }

        [HttpPost("Cancelar/{id}")]
        [HttpPost("CancelarAdocao/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CancelarAdocaoAsync(int id, string motivo)
        {
            var isAjax = Request.Headers["X-Requested-With"] == "XMLHttpRequest";
            try
            {
                if (string.IsNullOrWhiteSpace(motivo) || (isAjax && motivo.Length < 5))
                {
                    if (isAjax)
                    {
                        return Json(new { sucesso = false, mensagem = "Por favor, informe um motivo de cancelamento com pelo menos 5 caracteres." });
                    }

                    TempData["Erro"] = "É necessário fornecer um motivo para o cancelamento.";
                    return RedirectToAction(nameof(ListarAsync));
                }

                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (adocao == null)
                {
                    if (isAjax)
                    {
                        return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                    }

                    TempData["Erro"] = "Adoção não encontrada.";
                    return RedirectToAction(nameof(ListarAsync));
                }

                var adminIdStr = User.ObterIdUsuario();
                if (int.TryParse(adminIdStr, out var adminId))
                {
                    var admin = await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Id == adminId);
                    if (admin != null && admin.UsuarioId.HasValue && admin.UsuarioId.Value == adocao.UsuarioId)
                    {
                        var msg = "Outro administrador deve cancelar esta adoção.";
                        if (isAjax)
                        {
                            return Json(new { sucesso = false, mensagem = msg });
                        }
                        TempData["Erro"] = msg;
                        return RedirectToAction(nameof(ListarAsync));
                    }
                }

                if (adocao.Status == "Finalizada" || adocao.Status == "Cancelada")
                {
                    var msg = $"Não é possível cancelar uma adoção que já está {adocao.Status.ToLower()}.";
                    if (isAjax)
                    {
                        return Json(new { sucesso = false, mensagem = msg });
                    }

                    TempData["Erro"] = msg;
                    return RedirectToAction(nameof(ListarAsync));
                }

                var observacaoCancelamento = $"Cancelado pelo Administrador: {motivo}";

                adocao.Status = "Cancelado pelo Admin";
                adocao.DataFinalizacao = DateTime.Now;
                adocao.ObservacoesCancelamento = observacaoCancelamento;

                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null)
                {
                    pet.Status = StatusPet.Disponivel;
                }

                var formulario = await _contexto.FormulariosAdocao
                    .FirstOrDefaultAsync(f => f.PetId == adocao.PetId && f.UsuarioId == adocao.UsuarioId);

                if (formulario != null)
                {
                    formulario.ObservacoesCancelamento = observacaoCancelamento;
                }

                try
                {
                    if (adocao.Usuario != null)
                    {
                        await _servicoNotificacao.CriarNotificacaoAsync(
                            adocao.UsuarioId.ToString(),
                            "Adoção cancelada",
                            $"A adoção do pet {adocao.Pet?.Nome} foi cancelada pelo administrador. Motivo: {motivo}",
                            "Adocao",
                            adocao.Id.ToString()
                        );
                    }
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Erro ao criar notificação");
                }

                await _contexto.SaveChangesAsync();

                if (isAjax)
                {
                    return Json(new
                    {
                        sucesso = true,
                        mensagem = "Adoção cancelada com sucesso!",
                        dataCancelamento = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                        observacoes = observacaoCancelamento
                    });
                }

                TempData["Sucesso"] = "Adoção cancelada com sucesso!";
                return RedirectToAction(nameof(ListarAsync));
            }
            catch (Exception ex)
            {
                if (isAjax)
                {
                    return Json(new { sucesso = false, mensagem = $"Erro ao cancelar adoção: {ex.Message}" });
                }

                TempData["Erro"] = $"Erro ao cancelar adoção: {ex.Message}";
                return RedirectToAction(nameof(ListarAsync));
            }
        }

        [HttpPost("aguardando-buscar/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarcarAguardandoRetiradaAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);
                    
                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                }
                
                if (adocao.Status != "Aprovado")
                {
                    return Json(new { 
                        sucesso = false, 
                        mensagem = $"Apenas adoções com status 'Aprovado' podem ser marcadas para retirada. Status atual: '{adocao.Status}'" 
                    });
                }
                
                adocao.Status = "Aguardando buscar";
                adocao.DataResposta = DateTime.Now;
                
                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null && pet.Status != StatusPet.EmProcesso)
                {
                    pet.Status = StatusPet.EmProcesso;
                }
                
                if (adocao.Usuario != null)
                {
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        "Pet pronto para retirada",
                        $"O pet {adocao.Pet?.Nome} está pronto para ser retirado. Entre em contato para agendar a retirada.",
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }
                
                await _contexto.SaveChangesAsync();
                
                return Json(new { 
                    sucesso = true, 
                    mensagem = "Pet marcado como pronto para retirada!" 
                });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao marcar pet como pronto para retirada: {ex.Message}" });
            }
        }

        [HttpPost("marcarParaRetirada/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarcarParaRetiradaAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);
                    
                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                }
                
                if (adocao.Status != "Aprovado")
                {
                    return Json(new { 
                        sucesso = false, 
                        mensagem = $"Apenas adoções com status 'Aprovado' podem ser marcadas para retirada. Status atual: '{adocao.Status}'" 
                    });
                }
                
                adocao.Status = "Aguardando buscar";
                adocao.DataResposta = DateTime.Now;
                
                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null && pet.Status != StatusPet.EmProcesso)
                {
                    pet.Status = StatusPet.EmProcesso;
                }

                var formulario = await _contexto.FormulariosAdocao
                    .FirstOrDefaultAsync(f => f.PetId == adocao.PetId && f.UsuarioId == adocao.UsuarioId);

                if (formulario != null)
                {
                    formulario.Status = "Aguardando buscar";
                    if (formulario.DataResposta == null)
                    {
                        formulario.DataResposta = DateTime.Now;
                    }
                }
                
                if (adocao.Usuario != null)
                {
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        "Pet pronto para retirada",
                        $"O pet {adocao.Pet?.Nome} está pronto para ser retirado. Entre em contato para agendar a retirada.",
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }
                
                await _contexto.SaveChangesAsync();
                
                return Json(new { 
                    sucesso = true, 
                    mensagem = "Pet marcado para retirada com sucesso!" 
                });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao marcar pet para retirada: {ex.Message}" });
            }
        }

        [HttpPost("MarcarRetirado/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarcarRetiradoAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada." });
                }

                if (adocao.Status == "Finalizada")
                {
                    return Json(new { sucesso = false, mensagem = "Esta adoção já está finalizada." });
                }

                if (adocao.Status == "Cancelada")
                {
                    return Json(new { sucesso = false, mensagem = "Não é possível finalizar uma adoção cancelada." });
                }

                if (adocao.Status != "Aguardando buscar" && adocao.Status != "Aprovado")
                {
                    return Json(new { sucesso = false, mensagem = $"Não é possível finalizar uma adoção com status '{adocao.Status}'. A adoção deve estar em 'Aguardando buscar' ou 'Aprovado'." });
                }

                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet == null)
                {
                    return Json(new { sucesso = false, mensagem = "Pet não encontrado." });
                }

                pet.Status = StatusPet.Adotado;

                adocao.Status = "Finalizada";
                adocao.DataFinalizacao = DateTime.Now;
                
                var formulario = await _contexto.FormulariosAdocao
                    .FirstOrDefaultAsync(f => f.PetId == adocao.PetId && f.UsuarioId == adocao.UsuarioId);

                if (formulario != null)
                {
                    if (formulario.DataResposta == null)
                    {
                        formulario.DataResposta = DateTime.Now;
                    }
                }

                try
                {
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        "Adoção finalizada com sucesso",
                        $"A adoção do pet {pet.Nome} foi finalizada com sucesso! Obrigado por adotar um amigo.",
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao criar notificação");
                }

                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Adoção finalizada com sucesso! O status do formulário permanece como Aprovado." });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao marcar adoção como finalizada: {ex.Message}" });
            }
        }

        [HttpGet("DetalhesAdocao/{id}")]
        public async Task<IActionResult> DetalhesAdocaoAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Pet)
                    .Include(a => a.Usuario)
                    .FirstOrDefaultAsync(a => a.Id == id);
                    
                if (adocao == null)
                {
                    var formulario = await _contexto.FormulariosAdocao
                        .Include(f => f.Pet)
                        .Include(f => f.Usuario)
                        .FirstOrDefaultAsync(f => f.Id == id);
                        
                    if (formulario == null)
                    {
                        return NotFound(new { sucesso = false, mensagem = "Adoção não encontrada" });
                    }
                    
                    if (formulario.Pet == null || formulario.Usuario == null)
                    {
                        return NotFound(new { sucesso = false, mensagem = "Dados incompletos do formulário" });
                    }
                    
                    return Json(new {
                        id = formulario.Id,
                        dataEnvio = formulario.DataEnvio,
                        dataPedido = formulario.DataEnvio,
                        dataResposta = formulario.DataResposta,
                        dataFinalizacao = (DateTime?)null,
                        dataCancelamento = (DateTime?)null,
                        status = formulario.Status ?? "Pendente",
                        motivoCancelamento = formulario.ObservacoesCancelamento,
                        observacoesCancelamento = formulario.ObservacoesCancelamento,
                        observacaoAdminFormulario = formulario.ObservacaoAdminFormulario,
                        
                        pet = new {
                            id = formulario.Pet.Id,
                            nome = formulario.Pet.Nome ?? "Não informado",
                            // Converte a enum em string amigável
                            especie = formulario.Pet.Especie.GetEnumMemberValue(),
                            raca = formulario.Pet.Raca ?? "Não informada",
                            idade = (formulario.Pet.Anos > 0 ? $"{formulario.Pet.Anos} anos" : "") + 
                                   (formulario.Pet.Meses > 0 ? $" e {formulario.Pet.Meses} meses" : ""),
                            anos = formulario.Pet.Anos,
                            meses = formulario.Pet.Meses,
                            sexo = formulario.Pet.Sexo.GetEnumMemberValue(),
                            porte = formulario.Pet.Porte ?? "Não informado",
                            imagem = formulario.Pet.NomeArquivoImagem ?? ""
                        },
                        
                        usuario = new {
                            id = formulario.Usuario.Id,
                            nome = formulario.Usuario.Nome ?? "Não informado",
                            email = formulario.Usuario.Email ?? "Não informado",
                            telefone = formulario.Usuario.Telefone ?? "Não informado",
                            cpf = formulario.Usuario.CPF ?? "Não informado",
                            logradouro = formulario.Usuario.Logradouro ?? "Não informado",
                            numero = formulario.Usuario.Numero ?? "S/N",
                            complemento = formulario.Usuario.Complemento ?? "",
                            bairro = formulario.Usuario.Bairro ?? "Não informado",
                            cidade = formulario.Usuario.Cidade ?? "Não informada",
                            estado = formulario.Usuario.Estado ?? "Não informado",
                            uf = formulario.Usuario.Estado ?? "Não informado",
                            cep = formulario.Usuario.CEP ?? "Não informado"
                        }
                    });
                }
                
                if (adocao.Pet == null || adocao.Usuario == null)
                {
                    return NotFound(new { sucesso = false, mensagem = "Dados incompletos da adoção" });
                }
                
                return Json(new {
                    id = adocao.Id,
                    dataEnvio = adocao.DataEnvio,
                    dataPedido = adocao.DataEnvio,
                    dataResposta = adocao.DataResposta,
                    dataFinalizacao = adocao.DataFinalizacao,
                    dataCancelamento = adocao.Status != null && adocao.Status.Contains("Cancelado") ? adocao.DataFinalizacao : null,
                    status = adocao.Status ?? "Pendente",
                    motivoCancelamento = adocao.ObservacoesCancelamento,
                    observacoesCancelamento = adocao.ObservacoesCancelamento,
                    
                    pet = new {
                        id = adocao.Pet.Id,
                        nome = adocao.Pet.Nome ?? "Não informado",
                        especie = adocao.Pet.Especie.GetEnumMemberValue(),
                        raca = adocao.Pet.Raca ?? "Não informada",
                        idade = (adocao.Pet.Anos > 0 ? $"{adocao.Pet.Anos} anos" : "") + 
                               (adocao.Pet.Meses > 0 ? $" e {adocao.Pet.Meses} meses" : ""),
                        anos = adocao.Pet.Anos,
                        meses = adocao.Pet.Meses,
                        sexo = adocao.Pet.Sexo.GetEnumMemberValue(),
                        porte = adocao.Pet.Porte ?? "Não informado",
                        imagem = adocao.Pet.NomeArquivoImagem ?? ""
                    },
                    
                    usuario = new {
                        id = adocao.Usuario.Id,
                        nome = adocao.Usuario.Nome ?? "Não informado",
                        email = adocao.Usuario.Email ?? "Não informado",
                        telefone = adocao.Usuario.Telefone ?? "Não informado",
                        cpf = adocao.Usuario.CPF ?? "Não informado",
                        logradouro = adocao.Usuario.Logradouro ?? "Não informado",
                        numero = adocao.Usuario.Numero ?? "S/N", 
                        complemento = adocao.Usuario.Complemento ?? "",
                        bairro = adocao.Usuario.Bairro ?? "Não informado",
                        cidade = adocao.Usuario.Cidade ?? "Não informada",
                        estado = adocao.Usuario.Estado ?? "Não informado",
                        uf = adocao.Usuario.Estado ?? "Não informado",
                        cep = adocao.Usuario.CEP ?? "Não informado"
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { sucesso = false, mensagem = $"Erro ao obter detalhes: {ex.Message}" });
            }
        }

        [HttpGet("StatusAtualAdocao/{id}")]
        public async Task<IActionResult> StatusAtualAdocaoAsync(int id)
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .FirstOrDefaultAsync(a => a.Id == id);
                    
                if (adocao == null)
                {
                    return NotFound();
                }
                
                return Json(new { status = adocao.Status });
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPost("atualizarStatus/{adocaoId}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AtualizarStatusAdocaoAsync(int adocaoId, string novoStatus, string observacoes = "")
        {
            try
            {
                var adocao = await _contexto.Adocoes
                    .Include(a => a.Usuario)
                    .Include(a => a.Pet)
                    .FirstOrDefaultAsync(a => a.Id == adocaoId);

                if (adocao == null)
                {
                    return Json(new { sucesso = false, mensagem = "Adoção não encontrada" });
                }

                var statusAntigo = adocao.Status;
                adocao.Status = novoStatus;

                if (novoStatus == "Finalizada" || novoStatus == "Cancelada")
                {
                    adocao.DataFinalizacao = DateTime.Now;
                }

                var pet = await _contexto.Pets.FindAsync(adocao.PetId);
                if (pet != null)
                {
                    switch (novoStatus)
                    {
                        case "Finalizada":
                            pet.Status = StatusPet.Adotado;
                            break;
                        case "Cancelada":
                            pet.Status = StatusPet.Disponivel;
                            break;
                        case "Aprovado":
                            pet.Status = StatusPet.EmProcesso;
                            break;
                        case "Aguardando buscar":
                            pet.Status = StatusPet.EmProcesso;
                            break;
                        default:
                            break;
                    }
                }

                if (!string.IsNullOrEmpty(observacoes) && (novoStatus == "Cancelada"))
                {
                    adocao.ObservacoesCancelamento = observacoes;
                }

                var formulario = await _contexto.FormulariosAdocao
                    .FirstOrDefaultAsync(f => f.PetId == adocao.PetId && f.UsuarioId == adocao.UsuarioId);
                    
                if (formulario != null)
                {
                    formulario.Status = novoStatus;
                    
                    if (formulario.DataResposta == null && 
                        (novoStatus != "Pendente" && novoStatus != statusAntigo))
                    {
                        formulario.DataResposta = DateTime.Now;
                    }
                    
                    if (!string.IsNullOrWhiteSpace(observacoes))
                    {
                        if (novoStatus == "Cancelada")
                        {
                            formulario.ObservacoesCancelamento = observacoes;
                        }
                        else
                        {
                            formulario.ObservacaoAdminFormulario = observacoes;
                        }
                    }
                }

                if (adocao.Usuario != null)
                {
                    string titulo = $"Status da adoção atualizado";
                    string mensagem = $"O status da adoção do pet {adocao.Pet?.Nome} foi atualizado para '{novoStatus}'.";
                    
                    if (!string.IsNullOrWhiteSpace(observacoes))
                    {
                        mensagem += $" Observações: {observacoes}";
                    }
                    
                    await _servicoNotificacao.CriarNotificacaoAsync(
                        adocao.UsuarioId.ToString(),
                        titulo,
                        mensagem,
                        "Adocao",
                        adocao.Id.ToString()
                    );
                }

                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = $"Status atualizado para '{novoStatus}'" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao atualizar status: {ex.Message}" });
            }
        }


        [HttpGet("Contadores")]
        public async Task<IActionResult> ContadoresAdocaoAsync()
        {
            try
            {
                var totalGeral = await _contexto.Adocoes.CountAsync();
                var emAndamento = await _contexto.Adocoes.CountAsync(a => a.Status == "Aprovado" || a.Status == "Aguardando buscar");
                var finalizadas = await _contexto.Adocoes.CountAsync(a => a.Status == "Finalizada");
                var canceladas = await _contexto.Adocoes.CountAsync(a => a.Status == "Cancelada" || a.Status == "Rejeitada");
                
                return Json(new {
                    totalGeral,
                    emAndamento,
                    finalizadas,
                    canceladas
                });
            }
            catch (Exception ex)
            {
                return Json(new { erro = ex.Message });
            }
        }

        [HttpGet("BuscarHistoricoAdocoes")]
        public async Task<IActionResult> BuscarHistoricoAdocoesAsync(int usuarioId)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(usuarioId);
                
                if (usuario == null)
                {
                    return Json(new { success = false, message = "Usuário não encontrado" });
                }
                
                var historico = await _historicoServico.ObterPorUsuarioAsync(usuarioId);

                var resultado = historico.Select(a => new
                {
                    id = a.Id,
                    petId = a.PetId,
                    nomePet = a.NomePet,
                    imagemPet = a.NomeArquivoImagem != null ? "/imagens/pets/" + a.NomeArquivoImagem : null,
                    dataEnvio = a.DataEnvio,
                    dataResposta = a.DataResposta,
                    dataFinalizacao = a.DataFinalizacao,
                    status = a.Status
                }).ToList();

                return Json(new { success = true, adocoes = resultado });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Erro ao buscar histórico: {ex.Message}" });
            }
        }

        [HttpGet("HistoricoAdocoes")]
        public async Task<IActionResult> HistoricoAdocoesAsync(int usuarioId)
        {
            // Chama a versão assíncrona do método de busca
            return await BuscarHistoricoAdocoesAsync(usuarioId);
        }

        [HttpGet("HistoricoAdocoes/{id}")]
        public async Task<IActionResult> HistoricoAdocoesComIdAsync(int id)
        {
            // Chama a versão assíncrona para manter o padrão
            return await BuscarHistoricoAdocoesAsync(id);
        }

        [HttpPost("FinalizarAdocao")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FinalizarAdocaoAjaxAsync([FromBody] JsonDocument modelDocument)
        {
            try
            {
                if (modelDocument == null)
                {
                    return Json(new { sucesso = false, mensagem = "Nenhum dado recebido" });
                }

                var root = modelDocument.RootElement;

                if (!root.TryGetProperty("id", out var idElement))
                {
                    return Json(new { sucesso = false, mensagem = "ID da adoção não fornecido" });
                }

                int id = idElement.GetInt32();
                string observacao = string.Empty;

                if (root.TryGetProperty("observacao", out var obsElement) && !obsElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    observacao = obsElement.GetString() ?? string.Empty;
                }

                if (id <= 0)
                {
                    return Json(new { sucesso = false, mensagem = "ID inválido fornecido" });
                }

                var resultado = await ProcessarFinalizacaoAsync(id, observacao);
                return Json(new { sucesso = resultado.Sucesso, mensagem = resultado.Mensagem });
            }
            catch (InvalidOperationException ex)
            {
                return Json(new { sucesso = false, mensagem = $"Operação inválida: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao finalizar adoção: {ex.Message}" });
            }
        }

        private async Task<(bool Sucesso, string Mensagem)> ProcessarFinalizacaoAsync(int id, string observacao = "")
        {
            var adocao = await _contexto.Adocoes
                .Include(a => a.Usuario)
                .Include(a => a.Pet)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (adocao == null)
            {
                return (false, "Adoção não encontrada.");
            }

            var adminIdStr = User.ObterIdUsuario();
            if (int.TryParse(adminIdStr, out var adminId))
            {
                var admin = await _contexto.Colaboradores.FirstOrDefaultAsync(c => c.Id == adminId);
                if (admin != null && admin.UsuarioId.HasValue && admin.UsuarioId.Value == adocao.UsuarioId)
                {
                    return (false, "Outro administrador deve finalizar esta adoção.");
                }
            }

            if (adocao.Status == "Finalizada")
            {
                return (false, "Esta adoção já está finalizada.");
            }

            if (adocao.Status == "Cancelada")
            {
                return (false, "Não é possível finalizar uma adoção cancelada.");
            }

            if (adocao.Status != "Aguardando buscar" && adocao.Status != "Aprovado")
            {
                return (false, $"Apenas adoções com status 'Aguardando buscar' ou 'Aprovado' podem ser finalizadas. Status atual: '{adocao.Status}'");
            }

            adocao.Status = "Finalizada";
            adocao.DataFinalizacao = DateTime.Now;

            var pet = await _contexto.Pets.FindAsync(adocao.PetId);
            if (pet != null)
            {
                pet.Status = StatusPet.Adotado;
            }

            var formulario = await _contexto.FormulariosAdocao
                .FirstOrDefaultAsync(f => f.PetId == adocao.PetId && f.UsuarioId == adocao.UsuarioId);

            if (formulario != null)
            {
                if (formulario.Status != "Finalizada")
                {
                    formulario.Status = "Finalizada";
                }
                if (formulario.DataResposta == null)
                {
                    formulario.DataResposta = DateTime.Now;
                }
                if (!string.IsNullOrWhiteSpace(observacao))
                {
                    formulario.ObservacaoAdminFormulario = observacao;
                }
            }

            if (adocao.Usuario != null)
            {
                var usuarioId = !string.IsNullOrEmpty(adocao.Usuario.CPF) ? adocao.Usuario.CPF : adocao.UsuarioId.ToString();
                await _servicoNotificacao.CriarNotificacaoAsync(
                    usuarioId,
                    "Adoção finalizada",
                    $"A adoção do pet {adocao.Pet?.Nome ?? "pet"} foi finalizada com sucesso!",
                    "Adocao",
                    adocao.Id.ToString()
                );
            }

            await _contexto.SaveChangesAsync();

            return (true, "Adoção finalizada com sucesso!");
        }

        [HttpGet("avaliar-formulario/{id}")]
        public async Task<IActionResult> AvaliarFormularioAdocaoAsync(int id)
        {
            var formulario = await _contexto.FormulariosAdocao
                .Include(f => f.Pet)
                .Include(f => f.Usuario)
                .FirstOrDefaultAsync(f => f.Id == id);
                
            if (formulario == null)
            {
                return NotFound();
            }
            
            var viewModel = new AvaliacaoAdocaoViewModel
            {
                Id = formulario.Id,
                PetId = formulario.PetId,
                UsuarioId = formulario.UsuarioId,
                Status = formulario.Status,
                DataEnvio = formulario.DataEnvio,
                DataResposta = formulario.DataResposta,
                ObservacaoAdminFormulario = formulario.ObservacaoAdminFormulario
            };
            
            return View(viewModel);
        }

        [HttpGet("ObterDadosUsuario")]
        public async Task<IActionResult> ObterDadosUsuarioAsync(int id)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(id);
                
                if (usuario == null)
                {
                    return NotFound(new { sucesso = false, mensagem = "Usuário não encontrado" });
                }
                
                var resultado = new
                {
                    sucesso = true,
                    dados = new
                    {
                        id = usuario.Id,
                        nomeCompleto = usuario.Nome,
                        email = usuario.Email,
                        cpf = usuario.CPF,
                        telefone = usuario.Telefone,
                        dataNascimento = usuario.DataNascimento,
                        endereco = usuario.Logradouro,
                        numero = usuario.Numero,
                        complemento = usuario.Complemento,
                        bairro = usuario.Bairro,
                        cidade = usuario.Cidade,
                        estado = usuario.Estado,
                        cep = usuario.CEP,
                        dataCadastro = usuario.DataCadastro
                    }
                };
                
                return Json(resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { sucesso = false, mensagem = $"Erro ao obter detalhes do usuário: {ex.Message}" });
            }
        }

        [HttpGet("ObterHistoricoAdocoesPorUsuario")]
        public async Task<IActionResult> ObterHistoricoAdocoesPorUsuarioAsync(int usuarioId)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(usuarioId);
                if (usuario == null)
                {
                    return NotFound(new { sucesso = false, mensagem = "Usuário não encontrado" });
                }
                
                var adocoes = await _contexto.Adocoes
                    .Include(a => a.Pet)
                    .Where(a => a.UsuarioId == usuarioId)
                    .OrderByDescending(a => a.DataEnvio)
                    .ToListAsync();
                
                var adocoesPetIds = adocoes.Select(a => a.PetId).ToList();
                var formularios = await _contexto.FormulariosAdocao
                    .Include(f => f.Pet)
                    .Where(f => f.UsuarioId == usuarioId && !adocoesPetIds.Contains(f.PetId))
                    .OrderByDescending(f => f.DataEnvio)
                    .ToListAsync();
                
                var dadosAdocoes = adocoes.Select(a => new 
                {
                    id = a.Id,
                    petId = a.PetId,
                    petNome = a.Pet?.Nome ?? "Pet não encontrado",
                    petImagem = a.Pet?.NomeArquivoImagem,
                    status = a.Status,
                    dataEnvio = a.DataEnvio,
                    dataResposta = a.DataResposta,
                    dataFormatada = a.DataEnvio.ToString("dd/MM/yyyy HH:mm"),
                    tipoRegistro = "Adoção"
                });
                
                var dadosFormularios = formularios.Select(f => new 
                {
                    id = f.Id,
                    petId = f.PetId,
                    petNome = f.Pet?.Nome ?? "Pet não encontrado",
                    petImagem = f.Pet?.NomeArquivoImagem,
                    status = f.Status,
                    dataEnvio = f.DataEnvio,
                    dataResposta = f.DataResposta,
                    dataFormatada = f.DataEnvio.ToString("dd/MM/yyyy HH:mm"),
                    tipoRegistro = "Formulário"
                });
                
                var historico = dadosAdocoes.Concat(dadosFormularios)
                    .OrderByDescending(h => h.dataEnvio)
                    .ToList();
                
                return Json(new { 
                    sucesso = true, 
                    dados = historico,
                    totalRegistros = historico.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter histórico de adoções");
                return BadRequest(new { sucesso = false, mensagem = $"Erro ao obter histórico de adoções: {ex.Message}" });
            }
        }

        [HttpGet("ObterEstatisticasAdocaoUsuario")]
        public async Task<IActionResult> ObterEstatisticasAdocaoUsuarioAsync(int id)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(id);
                
                if (usuario == null)
                {
                    return Json(new { sucesso = false, mensagem = "Usuário não encontrado" });
                }
                
                var todasAdocoes = await _contexto.Adocoes
                    .Where(a => a.UsuarioId == id)
                    .ToListAsync();
                
                var adocoesAprovadas = todasAdocoes.Count(a => a.Status == "Aprovada" || a.Status == "Finalizada" || a.Status == "Aguardando buscar");
                var adocoesRejeitadas = todasAdocoes.Count(a => a.Status == "Rejeitada");
                var adocoesCanceladas = todasAdocoes.Count(a => a.Status.Contains("Cancelad"));
                
                var formularioIds = await _contexto.Adocoes
                    .Where(a => a.UsuarioId == id)
                    .Select(a => a.Id)
                    .ToListAsync();
                
                var formularios = await _contexto.FormulariosAdocao
                    .Where(f => f.UsuarioId == id && !formularioIds.Contains(f.Id))
                    .ToListAsync();
                
                var resultado = new {
                    total = todasAdocoes.Count + formularios.Count,
                    aprovadas = adocoesAprovadas,
                    rejeitadas = adocoesRejeitadas + formularios.Count(f => f.Status == "Rejeitada"),
                    canceladas = adocoesCanceladas + formularios.Count(f => f.Status.Contains("Cancelad")),
                    emAnalise = formularios.Count(f => f.Status == "Pendente" || f.Status == "Em Análise")
                };
                
                return Json(resultado);
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter estatísticas: {ex.Message}" });
            }
        }
        
        [HttpGet("ObterHistoricoAdocoesUsuario")]
        public async Task<IActionResult> ObterHistoricoAdocoesUsuarioAsync(int id)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(id);
                
                if (usuario == null)
                {
                    return Json(new { sucesso = false, mensagem = "Usuário não encontrado" });
                }
                
                var adocoes = await _contexto.Adocoes
                    .Include(a => a.Pet)
                    .Where(a => a.UsuarioId == id)
                    .OrderByDescending(a => a.DataEnvio)
                    .ToListAsync();
                
                var adocoesPetIds = adocoes.Select(a => a.PetId).ToList();
                var formularios = await _contexto.FormulariosAdocao
                    .Include(f => f.Pet)
                    .Where(f => f.UsuarioId == id && !adocoesPetIds.Contains(f.PetId))
                    .OrderByDescending(f => f.DataEnvio)
                    .ToListAsync();
                
                var resultado = new List<object>();
                
                foreach (var adocao in adocoes)
                {
                    resultado.Add(new {
                        id = adocao.Id,
                        nomePet = adocao.Pet?.Nome ?? "Pet não encontrado",
                        imagemPet = adocao.Pet?.NomeArquivoImagem != null ? 
                            $"/imagens/pets/{adocao.Pet.NomeArquivoImagem}" : null,
                        status = adocao.Status,
                        dataAdocao = adocao.DataEnvio,
                        tipoRegistro = "Adoção"
                    });
                }
                
                foreach (var formulario in formularios)
                {
                    resultado.Add(new {
                        id = formulario.Id,
                        nomePet = formulario.Pet?.Nome ?? "Pet não encontrado",
                        imagemPet = formulario.Pet?.NomeArquivoImagem != null ? 
                            $"/imagens/pets/{formulario.Pet.NomeArquivoImagem}" : null,
                        status = formulario.Status,
                        dataAdocao = formulario.DataEnvio,
                        tipoRegistro = "Formulário"
                    });
                }
                
                resultado = resultado.OrderByDescending(r => ((dynamic)r).dataAdocao).ToList();
                
                return Json(resultado);
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter histórico: {ex.Message}" });
            }
        }

        [HttpGet("ObterPerfilUsuario")]
        public async Task<IActionResult> ObterPerfilUsuarioAsync(int id)
        {
            try
            {
                var usuario = await _contexto.Usuarios.FindAsync(id);
                
                if (usuario == null)
                {
                    return Json(new { sucesso = false, mensagem = "Usuário não encontrado" });
                }
                
                var resultado = new {
                    id = usuario.Id,
                    nome = usuario.Nome,
                    email = usuario.Email,
                    cpf = usuario.CPF,
                    telefone = usuario.Telefone,
                    dataNascimento = usuario.DataNascimento,
                    logradouro = usuario.Logradouro,
                    numero = usuario.Numero,
                    complemento = usuario.Complemento,
                    bairro = usuario.Bairro,
                    cidade = usuario.Cidade,
                    estado = usuario.Estado,
                    cep = usuario.CEP,
                    fotoPerfil = usuario.FotoPerfil,
                    dataCadastro = usuario.DataCadastro
                };
                
                return Json(resultado);
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter perfil: {ex.Message}" });
            }
        }

        [HttpGet("ObterHistoricoAdocoesPet")]
        public async Task<IActionResult> ObterHistoricoAdocoesPetAsync(int petId)
        {
            if (!User.IsInRole("Administrador"))
            {
                return Unauthorized();
            }

            try
            {
                var pet = await _contexto.Pets
                    .FirstOrDefaultAsync(p => p.Id == petId);

                if (pet == null)
                {
                    return Json(new { sucesso = false, mensagem = "Pet não encontrado." });
                }

                var historicoAdocoes = await _contexto.Adocoes
                    .Where(a => a.PetId == petId)
                    .OrderByDescending(a => a.DataResposta)
                    .Select(a => new
                    {
                        status = a.Status,
                        dataResposta = a.DataResposta,
                        observacao = a.ObservacoesCancelamento,
                        petId = pet.Id,
                        petNome = pet.Nome,
                        imagemPet = !string.IsNullOrEmpty(pet.NomeArquivoImagem) ? 
                            $"/imagens/pets/{pet.NomeArquivoImagem}" : null
                    })
                    .ToListAsync();

                return Json(new { sucesso = true, dados = historicoAdocoes });
            }
            catch (Exception)
            {
                return Json(new { sucesso = false, mensagem = "Erro ao processar sua solicitação. Tente novamente mais tarde." });
            }
        }
    }
} 