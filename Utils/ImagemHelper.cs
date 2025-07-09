using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace CaotinhoAuMiau.Utils
{
    public static class ImagemHelper
    {
        public static async Task<string> SalvarAsync(IFormFile imagem, string webRootPath, string subpasta, string? nomeAtual = null)
        {
            if (imagem == null || imagem.Length <= 0)
                return null;

            if (!string.IsNullOrEmpty(nomeAtual))
            {
                Remover(webRootPath, subpasta, nomeAtual);
            }

            var caminhoUpload = Path.Combine(webRootPath, "imagens", subpasta);
            if (!Directory.Exists(caminhoUpload))
            {
                Directory.CreateDirectory(caminhoUpload);
            }

            var nomeArquivo = Guid.NewGuid().ToString() + Path.GetExtension(imagem.FileName);
            var caminhoArquivo = Path.Combine(caminhoUpload, nomeArquivo);

            using (var stream = new FileStream(caminhoArquivo, FileMode.Create))
            {
                await imagem.CopyToAsync(stream);
            }

            return nomeArquivo;
        }

        public static void Remover(string webRootPath, string subpasta, string nomeArquivo)
        {
            if (string.IsNullOrEmpty(nomeArquivo))
                return;

            var caminho = Path.Combine(webRootPath, "imagens", subpasta, nomeArquivo);
            if (File.Exists(caminho))
            {
                try
                {
                    File.Delete(caminho);
                }
                catch
                {
                    // Ignora falhas de remoção
                }
            }
        }
    }
}
