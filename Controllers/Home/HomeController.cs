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
        private readonly NotificationService _servicoNotificacao;
        private readonly ApplicationDbContext _contexto;
        private readonly ILogger<HomeController> _logger;

        public HomeController(NotificationService servicoNotificacao, ApplicationDbContext contexto, ILogger<HomeController> logger)
        {
            _servicoNotificacao = servicoNotificacao;
            _contexto = contexto;
            _logger = logger;
        }

        // Método assíncrono renomeado para seguir a convenção de sufixo 'Async'
        private async Task ConfigurarDadosComunsAsync()
        {
            if (User.Identity.IsAuthenticated)
            {
                var idUsuario = User.ObterIdUsuario();
                if (!string.IsNullOrEmpty(idUsuario))
                {
                    // Atualizado para refletir o novo nome do método
                    ViewBag.NotificacoesNaoLidas = await _servicoNotificacao.ContarNotificacoesNaoLidasAsync(idUsuario);
                }
            }
        }

        [HttpGet]
        public async Task<IActionResult> IndexAsync()
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

        public async Task<IActionResult> SobreAsync()
        {
            // Ajuste de nome do método invocado após renomeação
            await ConfigurarDadosComunsAsync();
            return View("~/Views/Home/Sobre.cshtml");
        }

        public async Task<IActionResult> ContatoAsync()
        {
            // Ajuste de nome do método invocado após renomeação
            await ConfigurarDadosComunsAsync();
            return View("~/Views/Home/Contato.cshtml");
        }

        public async Task<IActionResult> PrivacidadeAsync()
        {
            // Ajuste de nome do método invocado após renomeação
            await ConfigurarDadosComunsAsync();
            return View("~/Views/Home/Privacidade.cshtml");
        }
        
        public async Task<IActionResult> TermosAsync()
        {
            // Ajuste de nome do método invocado após renomeação
            await ConfigurarDadosComunsAsync();
            return View("~/Views/Home/Termos.cshtml");
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task<IActionResult> ErroAsync()
        {
            // Ajuste de nome do método invocado após renomeação
            await ConfigurarDadosComunsAsync();
            return View("~/Views/Shared/Error.cshtml", new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }

    }
}
