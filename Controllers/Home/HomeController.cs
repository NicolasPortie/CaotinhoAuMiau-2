using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Services;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CaotinhoAuMiau.Models;
using CaotinhoAuMiau.Models.ViewModels;
using System.Diagnostics;
using CaotinhoAuMiau.Models.ViewModels.Comuns;
using CaotinhoAuMiau.Models.ViewModels.Usuario;
using Microsoft.AspNetCore.Authorization;
using CaotinhoAuMiau.Utils;

namespace CaotinhoAuMiau.Controllers.Home
{
    public class HomeController : Controller
    {
        private readonly NotificacaoServico _servicoNotificacao;
        private readonly ApplicationDbContext _contexto;
        private readonly ILogger<HomeController> _logger;

        public HomeController(NotificacaoServico servicoNotificacao, ApplicationDbContext contexto, ILogger<HomeController> logger)
        {
            _servicoNotificacao = servicoNotificacao;
            _contexto = contexto;
            _logger = logger;
        }

        private async Task ConfigurarDadosComuns()
        {
            if (User.Identity.IsAuthenticated)
            {
                var idUsuario = User.ObterIdUsuario();
                if (!string.IsNullOrEmpty(idUsuario))
                {
                    ViewBag.NotificacoesNaoLidas = await _servicoNotificacao.ContarNotificacoesNaoLidas(idUsuario);
                }
            }
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            if (User.Identity.IsAuthenticated)
            {
                if (User.IsInRole("Administrador"))
                {
                    return RedirectToAction("Inicio", "GerenciamentoDashboard");
                }
                return Redirect("/usuario/pets/explorar");
            }

            var pets = await _contexto.Pets
                .Where(p => p.Status == "Disponível" && p.CadastroCompleto)
                .OrderByDescending(p => p.DataCriacao)
                .Take(6)
                .ToListAsync();

            return View("~/Views/Home/Index.cshtml", pets);
        }

        public async Task<IActionResult> Sobre()
        {
            await ConfigurarDadosComuns();
            return View("~/Views/Home/Sobre.cshtml");
        }

        public async Task<IActionResult> Contato()
        {
            await ConfigurarDadosComuns();
            return View("~/Views/Home/Contato.cshtml");
        }

        public async Task<IActionResult> Privacidade()
        {
            await ConfigurarDadosComuns();
            return View("~/Views/Home/Privacidade.cshtml");
        }
        
        public async Task<IActionResult> Termos()
        {
            await ConfigurarDadosComuns();
            return View("~/Views/Home/Termos.cshtml");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task<IActionResult> Erro()
        {
            await ConfigurarDadosComuns();
            return View("~/Views/Shared/Error.cshtml", new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }

    }
}
