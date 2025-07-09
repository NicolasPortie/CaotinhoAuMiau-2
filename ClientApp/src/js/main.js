import {
    togglePainelNotificacoes,
    mostrarPainelNotificacoes,
    ocultarPainelNotificacoes,
    carregarNotificacoes,
    marcarTodasComoLidas,
    inicializarComponenteNotificacoes
} from './shared/notificacoes.js';
import * as slidebar from './shared/slidebar.js';
import * as navbar from './shared/navbar.js';

import './home/home.js';
import './home/sobre.js';

import './autenticacao/cadastro.js';
import './autenticacao/login.js';
import './autenticacao/escolher-perfil.js';

import './usuario/adocoes.js';
import './usuario/explorar-pets.js';
import './usuario/perfil.js';
import './usuario/usuario-adocoes.js';

import './formulario/FormularioAdocao.js';

import './admin/dashboard.js';
import './admin/gerenciamento-colaboradores.js';
import './admin/gerenciamento-formularios.js';
import './admin/gerenciamento-pets.js';
import './admin/admin-gerenciamento-adocoes.js';

// Exposição global para scripts inline
window.alternarMenu = slidebar.alternarMenu || navbar.alternarMenu;
window.abrirMenuLateral = slidebar.abrirMenuLateral || navbar.abrirMenuLateral;
window.fecharMenuLateral = slidebar.fecharMenuLateral || navbar.fecharMenuLateral;
window.realizarLogout = slidebar.realizarLogout;
window.togglePainelNotificacoes = togglePainelNotificacoes;
window.mostrarPainelNotificacoes = mostrarPainelNotificacoes;
window.ocultarPainelNotificacoes = ocultarPainelNotificacoes;
window.carregarNotificacoes = carregarNotificacoes;
window.marcarTodasComoLidas = marcarTodasComoLidas;
