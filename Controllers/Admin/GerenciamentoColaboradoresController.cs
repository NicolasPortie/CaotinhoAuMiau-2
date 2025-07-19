using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Models;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using CaotinhoAuMiau.Models.ViewModels.Admin;
using CaotinhoAuMiau.Models.ViewModels.Comuns;
using System.Collections.Generic;
using CaotinhoAuMiau.Utils;

namespace CaotinhoAuMiau.Controllers.Admin
{
    [Authorize(Roles = "Administrador")]
    [Route("Admin/Colaboradores")]
    public class GerenciamentoColaboradoresController : Controller
    {
        private readonly ApplicationDbContext _contexto;

        public GerenciamentoColaboradoresController(ApplicationDbContext contexto)
        {
            _contexto = contexto;
        }

        private bool VerificarPermissaoAdministrar()
        {
            var cargo = User.ObterValorClaim("Cargo");
            return cargo == "Administrador";
        }

        [HttpGet]
        public async Task<IActionResult> ListarAsync(int pagina = 1, int itensPorPagina = 10, string filtroStatus = "", string filtroCargo = "", string pesquisa = "")
        {
            if (!VerificarPermissaoAdministrar())
            {
                return RedirectToAction("Inicio", "GerenciamentoDashboard");
            }

            var query = _contexto.Colaboradores
                .OrderBy(c => c.Nome)
                .AsQueryable();
            
            if (!string.IsNullOrEmpty(filtroStatus))
            {
                bool ativo = filtroStatus.ToLower() == "ativo";
                query = query.Where(c => c.Ativo == ativo);
            }
            
            if (!string.IsNullOrEmpty(filtroCargo))
            {
                query = query.Where(c => c.Cargo.ToLower() == filtroCargo.ToLower());
            }
            
            if (!string.IsNullOrEmpty(pesquisa))
            {
                pesquisa = pesquisa.ToLower();
                query = query.Where(c => 
                    (c.Nome != null && c.Nome.ToLower().Contains(pesquisa)) ||
                    (c.Email != null && c.Email.ToLower().Contains(pesquisa)) ||
                    (c.CPF != null && c.CPF.Contains(pesquisa))
                );
            }
            
            var totalItens = await query.CountAsync();
            
            var colaboradoresPaginados = await query
                .Skip((pagina - 1) * itensPorPagina)
                .Take(itensPorPagina)
                .Select(c => ColaboradorViewModel.CriarDeEntidade(c))
                .ToListAsync();

            ViewBag.PaginaAtual = pagina;
            ViewBag.ItensPorPagina = itensPorPagina;
            ViewBag.TotalItens = totalItens;
            ViewBag.TotalPaginas = (int)Math.Ceiling(totalItens / (double)itensPorPagina);
            
            ViewBag.FiltroStatus = filtroStatus;
            ViewBag.FiltroCargo = filtroCargo;
            ViewBag.Pesquisa = pesquisa;

            return View("~/Views/Admin/GerenciamentoColaboradores.cshtml", colaboradoresPaginados);
        }

        [HttpPost("CadastrarColaborador")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CadastrarAsync(ColaboradorViewModel model)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { sucesso = false, mensagem = "Dados inválidos. Verifique os campos obrigatórios." });
                }

                var colaboradorExistente = await _contexto.Colaboradores
                    .AnyAsync(c => c.Email == model.Email);

                if (colaboradorExistente)
                {
                    return Json(new { sucesso = false, mensagem = "Já existe um colaborador com este e-mail." });
                }

                var cpfExistente = await _contexto.Colaboradores.AnyAsync(c => c.CPF == model.CPF);
                if (cpfExistente)
                {
                    return Json(new { sucesso = false, mensagem = "Já existe um colaborador com este CPF." });
                }

                var colaborador = model.ConverterParaEntidade();
                colaborador.Senha = HashHelper.GerarHashSenha(colaborador.Senha);

                _contexto.Colaboradores.Add(colaborador);
                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Colaborador cadastrado com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao cadastrar colaborador: {ex.Message}" });
            }
        }

        [HttpGet("VerificarUsuario")]
        public async Task<IActionResult> VerificarUsuarioAsync(string email, string cpf)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(cpf))
            {
                return Json(new { existe = false });
            }

            var usuario = await _contexto.Usuarios
                .FirstOrDefaultAsync(u => u.Email == email || u.CPF == cpf);

            if (usuario != null)
            {
                return Json(new
                {
                    existe = true,
                    usuario = new
                    {
                        id = usuario.Id,
                        nome = usuario.Nome,
                        email = usuario.Email,
                        cpf = usuario.CPF,
                        telefone = usuario.Telefone
                    }
                });
            }

            return Json(new { existe = false });
        }

        [HttpPost("PromoverUsuario")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> PromoverUsuarioAsync(int usuarioId, string cargo)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var usuario = await _contexto.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId);
                if (usuario == null)
                {
                    return Json(new { sucesso = false, mensagem = "Usuário não encontrado." });
                }

                bool jaColaborador = await _contexto.Colaboradores.AnyAsync(c => c.UsuarioId == usuarioId);
                if (jaColaborador)
                {
                    return Json(new { sucesso = false, mensagem = "Usuário já é colaborador." });
                }

                var colaborador = new Colaborador
                {
                    UsuarioId = usuario.Id,
                    Nome = usuario.Nome,
                    Email = usuario.Email,
                    CPF = usuario.CPF,
                    Telefone = usuario.Telefone,
                    Cargo = cargo,
                    Senha = usuario.Senha,
                    Ativo = true,
                    DataCadastro = usuario.DataCadastro,
                    UltimoAcesso = usuario.UltimoAcesso
                };

                _contexto.Colaboradores.Add(colaborador);
                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Usuário promovido a colaborador com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao promover usuário: {ex.Message}" });
            }
        }

        [HttpGet("ObterColaborador/{id}")]
        public async Task<IActionResult> ObterAsync(int id)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var colaborador = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (colaborador == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }

                var viewModel = ColaboradorViewModel.CriarDeEntidade(colaborador);
                return Json(new { sucesso = true, dados = viewModel });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter colaborador: {ex.Message}" });
            }
        }

        [HttpGet("DetalhesColaborador/{id}")]
        public async Task<IActionResult> ObterDetalhesAsync(int id)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var colaborador = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (colaborador == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }

                var viewModel = ColaboradorViewModel.CriarDeEntidade(colaborador);
                return Json(new { sucesso = true, dados = viewModel });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter detalhes do colaborador: {ex.Message}" });
            }
        }

        [HttpPost("AtualizarColaborador")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AtualizarAsync(ColaboradorViewModel model)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                ModelState.Remove(nameof(model.Senha));
                ModelState.Remove("ConfirmarSenha");
                if (!ModelState.IsValid)
                {
                    return Json(new { sucesso = false, mensagem = "Dados inválidos. Verifique os campos obrigatórios." });
                }

                var colaboradorExistente = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(c => c.Id == model.Id);

                if (colaboradorExistente == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }

                if (string.IsNullOrEmpty(model.SenhaAtual) || string.IsNullOrEmpty(model.Senha) || string.IsNullOrEmpty(model.ConfirmarSenha))
                {
                    return Json(new { sucesso = false, mensagem = "Preencha a senha atual e digite a nova senha duas vezes." });
                }
                if (model.Senha.Length < 6)
                {
                    return Json(new { sucesso = false, mensagem = "A nova senha deve ter pelo menos 6 caracteres." });
                }
                if (model.Senha != model.ConfirmarSenha)
                {
                    return Json(new { sucesso = false, mensagem = "As novas senhas não coincidem." });
                }
                var senhaAtualHash = HashHelper.GerarHashSenha(model.SenhaAtual);
                if (senhaAtualHash != colaboradorExistente.Senha)
                {
                    return Json(new { sucesso = false, mensagem = "Senha atual incorreta." });
                }
                var novaSenhaHash = HashHelper.GerarHashSenha(model.Senha);
                if (novaSenhaHash == colaboradorExistente.Senha)
                {
                    return Json(new { sucesso = false, mensagem = "A nova senha não pode ser igual à senha atual." });
                }
                using var transacao = _contexto.Database.BeginTransaction();

                colaboradorExistente.Senha = novaSenhaHash;

                colaboradorExistente.Nome = model.Nome;
                colaboradorExistente.Email = model.Email;
                colaboradorExistente.CPF = model.CPF;
                colaboradorExistente.Telefone = model.Telefone;
                colaboradorExistente.Cargo = model.Cargo;
                colaboradorExistente.Ativo = model.Ativo;
                colaboradorExistente.UsuarioId = model.UsuarioId;

                _contexto.Colaboradores.Update(colaboradorExistente);

                if (colaboradorExistente.UsuarioId.HasValue)
                {
                    var usuario = await _contexto.Usuarios
                        .FirstOrDefaultAsync(u => u.Id == colaboradorExistente.UsuarioId.Value);
                    if (usuario != null)
                    {
                        usuario.Nome = colaboradorExistente.Nome;
                        usuario.Email = colaboradorExistente.Email;
                        usuario.CPF = colaboradorExistente.CPF;
                        usuario.Telefone = colaboradorExistente.Telefone;
                        usuario.Senha = colaboradorExistente.Senha;
                        usuario.Ativo = colaboradorExistente.Ativo;
                        usuario.DataAtualizacao = DateTime.Now;

                        _contexto.Usuarios.Update(usuario);
                    }
                }

                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();

                return Json(new { sucesso = true, mensagem = "Colaborador atualizado com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao atualizar colaborador: {ex.Message}" });
            }
        }

        [HttpPost("AtivarColaborador/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AtivarAsync(int id)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var colaborador = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (colaborador == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }

                colaborador.Ativo = true;
                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Colaborador ativado com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao ativar colaborador: {ex.Message}" });
            }
        }

        [HttpPost("DesativarColaborador/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DesativarAsync(int id)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                int colaboradorAtivos = await _contexto.Colaboradores
                    .CountAsync(c => c.Ativo && c.Id != id);

                if (colaboradorAtivos == 0)
                {
                    return Json(new { sucesso = false, mensagem = "Não é possível desativar o último colaborador ativo." });
                }

                var colaborador = await _contexto.Colaboradores
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (colaborador == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }

                colaborador.Ativo = false;
                await _contexto.SaveChangesAsync();

                return Json(new { sucesso = true, mensagem = "Colaborador desativado com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao desativar colaborador: {ex.Message}" });
            }
        }

        [HttpGet("ObterListaColaboradores")]
        public async Task<IActionResult> ListarTodosAsync()
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var colaboradores = await _contexto.Colaboradores
                    .OrderBy(c => c.Nome)
                    .Select(c => ColaboradorViewModel.CriarDeEntidade(c))
                    .ToListAsync();

                return Json(new { sucesso = true, dados = colaboradores });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao obter lista de colaboradores: {ex.Message}" });
            }
        }



        [AllowAnonymous]
        [HttpGet("Login")]
        public IActionResult TelaLogin(string? urlRetorno = null)
        {
            ViewData["ReturnUrl"] = urlRetorno;
            return View("~/Views/Admin/Login.cshtml");
        }

        [AllowAnonymous]
        [HttpPost("Login")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> FazerLoginAsync(AutenticacaoLoginViewModel modelo, string? urlRetorno = null)
        {
            if (!ModelState.IsValid)
            {
                return View("~/Views/Admin/Login.cshtml", modelo);
            }

            var colaborador = await _contexto.Colaboradores
                .FirstOrDefaultAsync(c => c.Email == modelo.Email);

            if (colaborador == null)
            {
                ModelState.AddModelError("", "Email ou senha inválidos");
                return View("~/Views/Admin/Login.cshtml", modelo);
            }

            if (!HashHelper.VerificarSenha(modelo.Senha, colaborador.Senha))
            {
                ModelState.AddModelError("", "Email ou senha inválidos");
                return View("~/Views/Admin/Login.cshtml", modelo);
            }

            if (!colaborador.Ativo)
            {
                ModelState.AddModelError("", "Conta desativada. Entre em contato com o administrador do sistema.");
                return View("~/Views/Admin/Login.cshtml", modelo);
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier.ToString(), colaborador.Id.ToString()),
                new Claim(ClaimTypes.Name.ToString(), colaborador.Nome),
                new Claim(ClaimTypes.Email.ToString(), colaborador.Email),
                new Claim(ClaimTypes.Role, "Colaborador"),
                new Claim("TipoPerfil", "Colaborador"),
                new Claim("Cargo", colaborador.Cargo)
            };

            var identidade = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var principal = new ClaimsPrincipal(identidade);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                new AuthenticationProperties
                {
                    IsPersistent = false,
                    ExpiresUtc = DateTime.UtcNow.AddHours(24)
                });

            return RedirecionarParaRetornoOuPadrao(urlRetorno);
        }

        [HttpPost("Logout")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SairAsync()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }

        private IActionResult RedirecionarParaRetornoOuPadrao(string urlRetorno)
        {
            if (!string.IsNullOrEmpty(urlRetorno) && Url.IsLocalUrl(urlRetorno))
            {
                return Redirect(urlRetorno);
            }
            else
            {
                return RedirectToAction("Index", "GerenciamentoDashboard");
            }
        }

        [HttpPost("ExcluirColaborador/{id}")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ExcluirAsync(int id)
        {
            if (!VerificarPermissaoAdministrar())
            {
                return Json(new { sucesso = false, mensagem = "Você não tem permissão para realizar esta ação." });
            }

            try
            {
                var colaborador = await _contexto.Colaboradores.FindAsync(id);
                if (colaborador == null)
                {
                    return Json(new { sucesso = false, mensagem = "Colaborador não encontrado." });
                }
                _contexto.Colaboradores.Remove(colaborador);
                await _contexto.SaveChangesAsync();
                return Json(new { sucesso = true, mensagem = "Colaborador excluído com sucesso!" });
            }
            catch (Exception ex)
            {
                return Json(new { sucesso = false, mensagem = $"Erro ao excluir colaborador: {ex.Message}" });
            }
        }
    }
} 