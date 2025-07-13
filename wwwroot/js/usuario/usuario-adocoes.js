document.addEventListener('DOMContentLoaded', function () {
    // Manipulador para o seletor de itens por página
    var seletor = document.getElementById('selectItensPorPagina');
    if (seletor) {
        seletor.addEventListener('change', function () {
            var itensPorPagina = this.value;
            var url = '@Url.Action("Listar", "Adocao")' + '?pagina=1&itensPorPagina=' + itensPorPagina;
            window.location.href = url;
        });
    }

    // Corrigir problema de paginação
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
