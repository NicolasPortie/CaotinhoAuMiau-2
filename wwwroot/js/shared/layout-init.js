// Código extraído de _Layout.cshtml para centralizar scripts.
// Ele adiciona listeners para menus e notificações.
document.addEventListener('DOMContentLoaded', function() {
    const btnMenuHamburguer = document.getElementById('btnMenuHamburguer');
    if (btnMenuHamburguer) {
        btnMenuHamburguer.addEventListener('click', function() {
            if (typeof alternarMenu === 'function') {
                alternarMenu();
            } else {
                console.error('Função alternarMenu não está disponível');
            }
        });
    }

    const notificacaoIcone = document.getElementById('notificacoes-icone');
    if (notificacaoIcone) {
        notificacaoIcone.addEventListener('click', function() {
            if (typeof togglePainelNotificacoes === 'function') {
                togglePainelNotificacoes();
            } else {
                console.error('Função togglePainelNotificacoes não está disponível');
            }
        });
    }

    const menuSobreposicao = document.querySelector('.menu-sobreposicao');
    if (menuSobreposicao) {
        menuSobreposicao.addEventListener('click', function() {
            if (typeof fecharMenuLateral === 'function') {
                fecharMenuLateral();
            } else {
                console.error('Função fecharMenuLateral não está disponível');
            }
        });
    }
});
