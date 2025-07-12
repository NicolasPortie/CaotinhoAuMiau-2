document.addEventListener('DOMContentLoaded', () => {
    
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuLateral = document.querySelector('.menu-lateral');
    const menuSobreposicao = document.querySelector('.menu-sobreposicao');
    const iconeNotificacao = document.querySelector('.icone-notificacao');
    const sinoSvg = document.querySelector('.sino-svg');
    const contadorNotificacoes = document.querySelector('.contador-notificacoes');
    const dotPulse = document.querySelector('.ponto-pulsante');
    const logoLink = document.querySelector('.logo-link');
    const pataSvg = document.querySelector('.pata-svg');
    
    if (sinoSvg && contadorNotificacoes) {
        sinoSvg.classList.add('animacao-sino');
    }
    
    if (menuHamburguer && menuLateral && menuSobreposicao) {
        menuLateral.classList.remove('ativo');
        menuSobreposicao.classList.remove('ativo');
        
        menuHamburguer.addEventListener('click', (e) => {
            e.preventDefault();
            alternarMenu();
        });
        
        menuSobreposicao.addEventListener('click', () => {
            alternarMenu();
        });
        
        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && menuLateral.classList.contains('ativo')) {
                alternarMenu();
            }
        });
    }
    
    if (iconeNotificacao) {
        
        const clone = iconeNotificacao.cloneNode(true);
        if (iconeNotificacao.parentNode) {
            iconeNotificacao.parentNode.replaceChild(clone, iconeNotificacao);
        }
        
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sino = this.querySelector('.sino-svg');
            if (sino) {
                sino.classList.add('animacao-sino');
                
                setTimeout(() => {
                    sino.classList.remove('animacao-sino');
                }, 1500);
            }
            
            alternarNotificacoes();
        });
    } else {
    }
    
    const overlayNotificacoes = document.querySelector('.overlay-notificacoes');
    if (overlayNotificacoes) {
        overlayNotificacoes.addEventListener('click', () => {
            fecharPainelNotificacoes();
        });
    }
    
    const btnFecharPainel = document.querySelector('.fechar-painel');
    if (btnFecharPainel) {
        btnFecharPainel.addEventListener('click', (e) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }
    
    const btnFecharNotificacoes = document.getElementById('fechar-notificacoes');
    if (btnFecharNotificacoes) {
        btnFecharNotificacoes.addEventListener('click', (e) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const painelNotificacoes = document.getElementById('painel-notificacoes');
            if (painelNotificacoes && (painelNotificacoes.classList.contains('ativo') || 
                painelNotificacoes.style.display === 'block')) {
                fecharPainelNotificacoes();
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        const painelNotificacoes = document.getElementById('painel-notificacoes');
        const iconeNotif = document.querySelector('.icone-notificacao');
        
        if (painelNotificacoes && 
            (painelNotificacoes.classList.contains('ativo') || painelNotificacoes.style.display === 'block') && 
            !painelNotificacoes.contains(e.target) && 
            (!iconeNotif || !iconeNotif.contains(e.target))) {
            fecharPainelNotificacoes();
        }
    });
});


const alternarMenu = () => {
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuLateral = document.querySelector('.menu-lateral');
    const menuSobreposicao = document.querySelector('.menu-sobreposicao');
    
    if (!menuLateral || !menuSobreposicao) {
        console.error("Elementos do menu não encontrados");
        return;
    }
    
    menuHamburguer.classList.toggle('ativo');
    menuLateral.classList.toggle('ativo');
    menuSobreposicao.classList.toggle('ativo');
    
    if (menuLateral.classList.contains('ativo')) {
        const larguraBarraRolagem = window.innerWidth - document.documentElement.clientWidth;
        
        if (larguraBarraRolagem > 0) {
            document.body.style.paddingRight = larguraBarraRolagem + 'px';
        }
        
        document.body.classList.add('menu-aberto');
    } else {
        setTimeout(() => {
            document.body.style.paddingRight = '';
            document.body.classList.remove('menu-aberto');
        }, 300); 
    }
};


const abrirPainelNotificacoes = () => {
    const painelNotificacoes = document.getElementById('painel-notificacoes');
    if (!painelNotificacoes) {
        console.error("[NAVBAR.JS] Painel de notificações não encontrado");
        return;
    }
    
    
    painelNotificacoes.style.display = 'block';
    painelNotificacoes.style.visibility = 'visible';
    painelNotificacoes.style.opacity = '1';
    painelNotificacoes.classList.add('ativo');
    
    fecharMenuLateral();
    
    if (typeof carregarNotificacoes === 'function') {
        carregarNotificacoes();
    }
};


const fecharPainelNotificacoes = () => {
    const painelNotificacoes = document.getElementById('painel-notificacoes');
    if (!painelNotificacoes) {
        return;
    }
    
    
    painelNotificacoes.style.display = 'none';
    painelNotificacoes.style.visibility = 'hidden';
    painelNotificacoes.style.opacity = '0';
    painelNotificacoes.classList.remove('ativo');
};


const abrirMenuLateral = () => {
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuLateral = document.querySelector('.menu-lateral');
    const menuSobreposicao = document.querySelector('.menu-sobreposicao');
    
    if (menuLateral && menuSobreposicao) {
        menuHamburguer.classList.add('ativo');
        menuLateral.classList.add('ativo');
        menuSobreposicao.classList.add('ativo');
        document.body.classList.add('menu-aberto');
        
        const painelNotificacoes = document.querySelector('.painel-notificacoes');
        if (painelNotificacoes && painelNotificacoes.classList.contains('ativo')) {
            fecharPainelNotificacoes();
        }
        
    }
};


const fecharMenuLateral = () => {
    const menuHamburguer = document.querySelector('.menu-hamburguer');
    const menuLateral = document.querySelector('.menu-lateral');
    const menuSobreposicao = document.querySelector('.menu-sobreposicao');
    
    if (menuLateral && menuSobreposicao) {
        menuHamburguer.classList.remove('ativo');
        menuLateral.classList.remove('ativo');
        menuSobreposicao.classList.remove('ativo');
        
        setTimeout(() => {
            document.body.style.paddingRight = '';
            document.body.classList.remove('menu-aberto');
        }, 300);
        
    }
};


const alternarNotificacoes = () => {
    const painelNotificacoes = document.getElementById('painel-notificacoes');
    if (!painelNotificacoes) {
        console.error("[NAVBAR.JS] Painel de notificações não encontrado");
        return;
    }
    
    
    const estaAtivo = painelNotificacoes.classList.contains('ativo') || 
                      painelNotificacoes.style.display === 'block';
    
    if (estaAtivo) {
        fecharPainelNotificacoes();
    } else {
        abrirPainelNotificacoes();
    }
};

window.alternarMenu = alternarMenu;
window.abrirMenuLateral = abrirMenuLateral;
window.fecharMenuLateral = fecharMenuLateral;
window.abrirPainelNotificacoes = abrirPainelNotificacoes;
window.fecharPainelNotificacoes = fecharPainelNotificacoes;
window.alternarNotificacoes = alternarNotificacoes; 
