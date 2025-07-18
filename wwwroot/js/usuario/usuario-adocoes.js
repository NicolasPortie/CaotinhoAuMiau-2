// Código responsável por lidar com a paginação e seleção de itens na listagem de adoções do usuário.
document.addEventListener('DOMContentLoaded', function () {
    // Manipulador para o seletor de itens por página
    var seletor = document.getElementById('selectItensPorPagina');
    if (seletor) {
        var baseUrl = seletor.dataset.baseUrl || '';
        seletor.addEventListener('change', function () {
            var itensPorPagina = this.value;
            var url = baseUrl + '?pagina=1&itensPorPagina=' + encodeURIComponent(itensPorPagina);
            window.location.href = url;
        });
    }
    // Corrigir problema de paginação ao clicar nos links
    document.querySelectorAll('.pagination .page-link').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var url = link.getAttribute('href');
            if (url) {
                window.location.href = url;
            }
            return false;
        });
    });
    // Código existente abaixo
});
