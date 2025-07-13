using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CaotinhoAuMiau.Data;
using CaotinhoAuMiau.Services;
using System.Threading.Tasks;
using CaotinhoAuMiau.Utils;

namespace CaotinhoAuMiau.Controllers.API
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificacaoController : ControllerBase
    {
        private readonly ApplicationDbContext _contexto;
        private readonly NotificacaoServico _servicoNotificacao;

        public NotificacaoController(ApplicationDbContext contexto, NotificacaoServico servicoNotificacao)
        {
            _contexto = contexto;
            _servicoNotificacao = servicoNotificacao;
        }

        [HttpGet]
        public async Task<IActionResult> ObterNotificacoesAsync()
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized();
            }

            // Chamada do método renomeado com sufixo Async
            var notificacoes = await _servicoNotificacao.ObterNotificacoesUsuarioAsync(idUsuario);
            return Ok(notificacoes);
        }

        [HttpGet("nao-lidas")]
        public async Task<IActionResult> ObterNotificacoesNaoLidasAsync()
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized();
            }

            // Ajuste para o novo nome do método
            var notificacoes = await _servicoNotificacao.ContarNotificacoesNaoLidasAsync(idUsuario);
            return Ok(notificacoes);
        }

        [HttpPost("marcar-como-lida/{id}")]
        public async Task<IActionResult> MarcarComoLidaAsync(int id)
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized();
            }

            // Uso do método renomeado na camada de serviço
            var resultado = await _servicoNotificacao.MarcarComoLidaAsync(id, idUsuario);
            if (!resultado)
            {
                return Forbid();
            }
            return Ok();
        }

        [HttpPost("marcar-todas-como-lidas")]
        public async Task<IActionResult> MarcarTodasComoLidasAsync()
        {
            var idUsuario = User.ObterIdUsuario();
            if (string.IsNullOrEmpty(idUsuario))
            {
                return Unauthorized();
            }

            // Chamada ao método renomeado da camada de serviço
            await _servicoNotificacao.MarcarTodasComoLidasAsync(idUsuario);
            return Ok();
        }
    }
} 