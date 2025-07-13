// Novo arquivo TypeScript convertido de slidebar.js

// Função global definida em outro script
declare function ocultarPainelNotificacoes(): void;

function abrirMenuLateral(): void {
    const menuLateral = document.querySelector<HTMLElement>('.menu-lateral');
    const menuSobreposicao = document.querySelector<HTMLElement>('.menu-sobreposicao');
    const menuHamburguer = document.getElementById('btnMenuHamburguer');

    if (menuLateral) {
        menuLateral.classList.add('ativo');
    }

    if (menuSobreposicao) {
        menuSobreposicao.classList.add('ativo');
    }

    if (menuHamburguer) {
        menuHamburguer.classList.add('ativo');
    }

    fecharPainelNotificacoesSeAberto();
}

function fecharMenuLateral(): void {
    const menuLateral = document.querySelector<HTMLElement>('.menu-lateral');
    const menuSobreposicao = document.querySelector<HTMLElement>('.menu-sobreposicao');
    const menuHamburguer = document.getElementById('btnMenuHamburguer');

    if (menuLateral) {
        menuLateral.classList.remove('ativo');
    }

    if (menuSobreposicao) {
        menuSobreposicao.classList.remove('ativo');
    }

    if (menuHamburguer) {
        menuHamburguer.classList.remove('ativo');
    }
}

function alternarMenu(): void {
    const menuLateral = document.querySelector<HTMLElement>('.menu-lateral');
    const menuSobreposicao = document.querySelector<HTMLElement>('.menu-sobreposicao');

    if (menuLateral && menuSobreposicao) {
        const estaAtivo = menuLateral.classList.contains('ativo');

        if (estaAtivo) {
            fecharMenuLateral();
        } else {
            abrirMenuLateral();
        }
    } else {
        console.error('[SLIDEBAR] Elementos do menu não encontrados');
    }
}

function fecharPainelNotificacoesSeAberto(): void {
    const painelNotificacoes = document.getElementById('painel-notificacoes');
    if (
        painelNotificacoes &&
        (painelNotificacoes.classList.contains('ativo') || painelNotificacoes.style.display === 'block')
    ) {
        if (typeof ocultarPainelNotificacoes === 'function') {
            ocultarPainelNotificacoes();
        } else {
            painelNotificacoes.style.display = 'none';
            painelNotificacoes.style.visibility = 'hidden';
            painelNotificacoes.style.opacity = '0';
            painelNotificacoes.classList.remove('ativo');
        }
    }
}

async function realizarLogout(): Promise<void> {
    try {
        const response = await fetch('/Autenticacao/Logout', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok || response.redirected) {
            window.location.href = '/Home/Index';
        } else {
            console.error('Erro ao fazer logout');
            alert('Ocorreu um erro ao fazer logout. Por favor, tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Ocorreu um erro ao fazer logout. Por favor, tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const iconeNotificacao = document.querySelector<HTMLElement>('.icone-notificacao');
    if (iconeNotificacao) {
        iconeNotificacao.addEventListener('click', () => {
            // Ação definida em outro script
        });
    }

    const logoutLink = document.querySelector<HTMLAnchorElement>('a[href="/Autenticacao/Logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e: Event) => {
            e.preventDefault();
            realizarLogout();
        });
    }

    const menuHamburguer = document.getElementById('btnMenuHamburguer');
    const menuSobreposicao = document.querySelector<HTMLElement>('.menu-sobreposicao');

    if (menuHamburguer && !menuHamburguer.hasAttribute('onclick')) {
        menuHamburguer.addEventListener('click', alternarMenu);
    }

    if (menuSobreposicao && !menuSobreposicao.hasAttribute('onclick')) {
        menuSobreposicao.addEventListener('click', fecharMenuLateral);
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            const menuLateral = document.querySelector<HTMLElement>('.menu-lateral');
            if (menuLateral && menuLateral.classList.contains('ativo')) {
                fecharMenuLateral();
            }
        }
    });
});

function alternarBarraLateral(): void {
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

document.addEventListener('click', (event: MouseEvent) => {
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const sidebarToggle = document.querySelector<HTMLElement>('.navbar-toggler');

    if (
        sidebar &&
        sidebar.classList.contains('active') &&
        !sidebar.contains(event.target as Node) &&
        sidebarToggle && !sidebarToggle.contains(event.target as Node)
    ) {
        sidebar.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector<HTMLElement>('.navbar');
    if (navbar) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-link d-lg-none';
        toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
        toggleButton.onclick = alternarBarraLateral;

        const navbarToggler = navbar.querySelector('.navbar-toggler');
        if (navbarToggler && navbarToggler.parentNode) {
            navbarToggler.parentNode.insertBefore(toggleButton, navbarToggler);
        }
    }
});

window.addEventListener('resize', () => {
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    if (sidebar && window.innerWidth >= 992) {
        sidebar.classList.remove('active');
    }
});

// Exportação para uso em outros scripts
interface MenuWindow extends Window {
    alternarMenu: () => void;
    abrirMenuLateral: () => void;
    fecharMenuLateral: () => void;
    realizarLogout: () => void;
}

const w = window as unknown as MenuWindow;
w.alternarMenu = alternarMenu;
w.abrirMenuLateral = abrirMenuLateral;
w.fecharMenuLateral = fecharMenuLateral;
w.realizarLogout = realizarLogout;

export {};
