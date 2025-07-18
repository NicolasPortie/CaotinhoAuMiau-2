var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference types="bootstrap" />
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text !== null && text !== void 0 ? text : '';
    return div.innerHTML;
}
let modalDetalhesFormulario = null;
let idFormularioAtual = null;
let observacaoAdminInicial = '';
let statusFormularioAtual = '';
const coresStatus = {
    'Pendente': 'pendente',
    'Aprovado': 'aprovado',
    'Rejeitada': 'rejeitado',
    'Cancelada': 'cancelado',
    'Cancelado pelo Usuario': 'cancelado',
    'Cancelado pelo Admin': 'cancelado',
    'Aguardando Busca': 'aguardando-buscar'
};
function analisarData(textoData) {
    const partes = textoData.split(' ')[0].split('/');
    return new Date(+partes[2], +partes[1] - 1, +partes[0]);
}
function filtrarFormularios() {
    const pesquisa = document.getElementById('campoPesquisaForm').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const data = document.getElementById('filtroData').value;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ultimos7Dias = new Date();
    ultimos7Dias.setDate(ultimos7Dias.getDate() - 7);
    const ultimos30Dias = new Date();
    ultimos30Dias.setDate(ultimos30Dias.getDate() - 30);
    document.querySelectorAll('table tbody tr').forEach(linha => {
        var _a, _b, _c, _d, _e;
        const nome = ((_b = (_a = linha.querySelector('.nome-cliente')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
        const emailElem = Array.from(linha.querySelectorAll('small')).find(s => { var _a; return (_a = s.textContent) === null || _a === void 0 ? void 0 : _a.includes('@'); });
        const email = emailElem ? emailElem.textContent.toLowerCase() : '';
        const enderecoElem = Array.from(linha.querySelectorAll('small')).find(s => s.innerHTML.includes('fa-map-marker-alt'));
        const endereco = enderecoElem ? enderecoElem.textContent.toLowerCase() : '';
        const statusLinha = ((_d = (_c = linha.querySelector('.indicador-status')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        const textoData = ((_e = linha.querySelector('.data')) === null || _e === void 0 ? void 0 : _e.textContent) || '';
        let correspondenciaData = true;
        if (data) {
            const dataFormulario = analisarData(textoData);
            if (data === 'hoje') {
                correspondenciaData = dataFormulario >= hoje;
            }
            else if (data === '7dias') {
                correspondenciaData = dataFormulario >= ultimos7Dias;
            }
            else if (data === '30dias') {
                correspondenciaData = dataFormulario >= ultimos30Dias;
            }
        }
        const correspondenciaNome = nome.includes(pesquisa) || email.includes(pesquisa) || endereco.includes(pesquisa);
        const correspondenciaStatus = !status || statusLinha === status.toLowerCase();
        linha.style.display = (correspondenciaNome && correspondenciaStatus && correspondenciaData) ? '' : 'none';
    });
    verificarResultadosPorSecao();
}
function verificarResultadosPorSecao() {
    const secoes = [
        { container: '.tabela-formularios', mensagem: '.mensagem-sem-formularios' }
    ];
    secoes.forEach(secao => {
        const linhasVisiveis = Array.from(document.querySelectorAll(`${secao.container} tbody tr`)).filter(tr => tr.style.display !== 'none').length;
        const mensagemEl = document.querySelector(secao.mensagem);
        if (!mensagemEl)
            return;
        if (linhasVisiveis === 0) {
            mensagemEl.classList.remove('d-none');
        }
        else {
            mensagemEl.classList.add('d-none');
        }
    });
}
document.querySelectorAll('#campoPesquisaForm, #filtroStatus, #filtroData').forEach(el => {
    el.addEventListener('input', filtrarFormularios);
    el.addEventListener('change', filtrarFormularios);
});
function limparFiltros() {
    document.getElementById('campoPesquisaForm').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroData').value = '';
    filtrarFormularios();
    toastr.info('Filtros limpos com sucesso!');
}
function limparAlertasModal() {
    document.querySelectorAll('#modalDetalhesFormulario .alert').forEach(el => el.remove());
}
function visualizarFormulario(id) {
    return __awaiter(this, void 0, void 0, function* () {
        limparAlertasModal();
        document.getElementById('formularioIdAtual').value = id;
        document.getElementById('observacaoAdmin').value = '';
        observacaoAdminInicial = '';
        statusFormularioAtual = '';
        document.getElementById('conteudoDetalhesFormulario').innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        </div>`;
        resetarPaineisConfirmacao();
        if (!modalDetalhesFormulario) {
            modalDetalhesFormulario = new bootstrap.Modal(document.getElementById('modalDetalhesFormulario'));
        }
        modalDetalhesFormulario.show();
        try {
            const response = yield fetch(`/admin/formularios-adocao/detalhes/${id}`);
            if (!response.ok)
                throw new Error('Falha ao obter detalhes');
            const text = yield response.text();
            let resposta;
            try {
                resposta = JSON.parse(text);
            }
            catch (_a) {
                resposta = { html: text };
            }
            let formulario = resposta.formulario || resposta.data || resposta.resultado;
            if (!formulario && resposta.id !== undefined)
                formulario = resposta;
            if (resposta.html) {
                document.getElementById('conteudoDetalhesFormulario').innerHTML = resposta.html;
            }
            else if (formulario) {
                document.getElementById('conteudoDetalhesFormulario').innerHTML = construirHTMLDetalhesFormulario(formulario);
            }
            const observacao = resposta.observacoesAdmin || (formulario ? (formulario.observacaoAdminFormulario || formulario.observacaoAdmin || formulario.observacoes) : '') || '';
            const obsInput = document.getElementById('observacaoAdmin');
            obsInput.value = observacao;
            observacaoAdminInicial = observacao;
            statusFormularioAtual = resposta.status || (formulario ? formulario.status : '');
            const botoesPrimarios = document.getElementById('botoesAcaoPrimarios');
            if (statusFormularioAtual !== 'Pendente') {
                botoesPrimarios.classList.add('d-none');
                obsInput.readOnly = true;
            }
            else {
                botoesPrimarios.classList.remove('d-none');
                obsInput.readOnly = false;
            }
            const botaoAprovar = document.getElementById('botaoAprovarNoModal');
            const botaoRejeitar = document.getElementById('botaoRejeitarNoModal');
            const botaoCancelaAprov = document.getElementById('botaoCancelarAprovacao');
            const botaoCancelaRej = document.getElementById('botaoCancelarRejeicao');
            const botaoConfAprov = document.getElementById('botaoConfirmarAprovacao');
            const botaoConfRej = document.getElementById('botaoConfirmarRejeicao');
            botaoAprovar.addEventListener('click', exibirConfirmacaoAprovacao, { once: true });
            botaoRejeitar.addEventListener('click', exibirConfirmacaoRejeicao, { once: true });
            botaoCancelaAprov.addEventListener('click', resetarPaineisConfirmacao, { once: true });
            botaoCancelaRej.addEventListener('click', resetarPaineisConfirmacao, { once: true });
            botaoConfAprov.addEventListener('click', aprovarFormularioConfirmado, { once: true });
            botaoConfRej.addEventListener('click', rejeitarFormularioConfirmado, { once: true });
        }
        catch (erro) {
            document.getElementById('conteudoDetalhesFormulario').innerHTML = `<div class="alert alert-danger"><i class="fas fa-times-circle me-2"></i>Ocorreu um erro ao carregar os detalhes do formulário.</div>`;
            console.error('Erro na requisição:', erro);
        }
    });
}
function construirHTMLDetalhesFormulario(formulario) {
    var _a, _b;
    try {
        const s = escapeHtml;
        const dataEnvio = new Date(formulario.dataEnvio).toLocaleString('pt-BR');
        const dataResposta = formulario.dataResposta ? new Date(formulario.dataResposta).toLocaleString('pt-BR') : '-';
        const usuario = formulario.usuario || {};
        const pet = formulario.pet || {};
        let htmlConteudo = `<div class="container-fluid p-0">`;
        htmlConteudo += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h6 class="fw-bold detalhes-titulo mb-3"><i class="fas fa-user me-2"></i>Informações do Usuário</h6>
                    <div class="info-bloco">
                        <div class="info-item"><span class="info-label">Nome</span><span class="info-valor">${s(usuario.nome)}</span></div>
                        <div class="info-item"><span class="info-label">E-mail</span><span class="info-valor">${s(usuario.email)}</span></div>
                        <div class="info-item"><span class="info-label">Telefone</span><span class="info-valor">${s(usuario.telefone)}</span></div>
                        <div class="info-item"><span class="info-label">Localização</span><span class="info-valor">${s(usuario.cidade)} - ${s(usuario.estado)}</span></div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <h6 class="fw-bold detalhes-titulo mb-3"><i class="fas fa-paw me-2"></i>Pet de Interesse</h6>
                    <div class="info-bloco">
                        <div class="info-item"><span class="info-label">Nome</span><span class="info-valor">${s(pet.nome)}</span></div>
                        <div class="info-item"><span class="info-label">Espécie</span><span class="info-valor">${s(pet.especie)}</span></div>
                        <div class="info-item"><span class="info-label">Porte</span><span class="info-valor">${s(pet.porte)}</span></div>
                        <div class="info-item"><span class="info-label">Sexo</span><span class="info-valor">${s(pet.sexo)}</span></div>
                    </div>
                </div>
            </div>
            <hr class="my-3">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="info-bloco">
                        <div class="info-item"><span class="info-label">Data de Envio</span><span class="info-valor">${s(dataEnvio)}</span></div>
                        <div class="info-item"><span class="info-label">Status</span><span class="info-valor">${s(formulario.status)}</span></div>
                        <div class="info-item"><span class="info-label">Data de Resposta</span><span class="info-valor">${s(dataResposta)}</span></div>
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <h6 class="fw-bold detalhes-titulo mb-3"><i class="fas fa-file-alt me-2"></i>Respostas do Formulário</h6>
                <div class="info-bloco respostas">
                    <div class="info-item"><span class="info-label"><i class="fas fa-heart me-2"></i>Por que você quer adotar especificamente o(a) ${s(pet.nome)}?</span><span class="info-valor">${s(formulario.motivacaoAdocao)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-paw me-2"></i>Conte-nos sobre sua experiência com pets</span><span class="info-valor">${s(formulario.experienciaAnterior)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-expand me-2"></i>Qual espaço o pet terá disponível?</span><span class="info-valor">${s(formulario.espacoAdequado)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-plane me-2"></i>O que fará com o pet quando precisar viajar?</span><span class="info-valor">${s(formulario.planejamentoViagens)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-comment-dollar me-2"></i>Como planeja arcar com os custos do pet?</span><span class="info-valor">${s(formulario.condicoesFinanceiras)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-home me-2"></i>Descreva sua moradia</span><span class="info-valor">${s(formulario.descricaoMoradia)}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-money-bill-wave me-2"></i>Renda mensal aproximada</span><span class="info-valor">${(_a = formulario.rendaMensal) !== null && _a !== void 0 ? _a : ''}</span></div>
                    <div class="info-item"><span class="info-label"><i class="fas fa-users me-2"></i>Pessoas na residência</span><span class="info-valor">${(_b = formulario.numeroMoradores) !== null && _b !== void 0 ? _b : ''}</span></div>
                </div>
            </div>
        `;
        htmlConteudo += `</div>`;
        return htmlConteudo;
    }
    catch (erro) {
        console.error('Erro ao construir detalhes do formulário:', erro);
        return `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Erro ao carregar detalhes do formulário. Por favor, tente novamente.</div>`;
    }
}
function exibirConfirmacaoAprovacao() {
    limparAlertasModal();
    document.getElementById('botoesAcaoPrimarios').classList.add('d-none');
    document.getElementById('confirmacaoRejeicao').classList.add('d-none');
    document.getElementById('confirmacaoAprovacao').classList.remove('d-none');
}
function exibirConfirmacaoRejeicao() {
    limparAlertasModal();
    document.getElementById('botoesAcaoPrimarios').classList.add('d-none');
    document.getElementById('confirmacaoAprovacao').classList.add('d-none');
    document.getElementById('confirmacaoRejeicao').classList.remove('d-none');
}
function resetarPaineisConfirmacao() {
    document.getElementById('confirmacaoAprovacao').classList.add('d-none');
    document.getElementById('confirmacaoRejeicao').classList.add('d-none');
    document.getElementById('botoesAcaoPrimarios').classList.remove('d-none');
    limparAlertasModal();
}
function aprovarFormularioConfirmado() {
    return __awaiter(this, void 0, void 0, function* () {
        const formularioId = document.getElementById('formularioIdAtual').value;
        const observacaoAdmin = document.getElementById('observacaoAdmin').value;
        const botao = document.getElementById('botaoConfirmarAprovacao');
        botao.disabled = true;
        botao.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processando...';
        try {
            const formData = new FormData();
            formData.append('observacao', observacaoAdmin);
            formData.append('__RequestVerificationToken', document.querySelector('input[name="__RequestVerificationToken"]').value);
            const response = yield fetch(`/admin/formularios-adocao/Aprovar/${formularioId}`, { method: 'POST', body: formData });
            const resposta = yield response.json();
            botao.disabled = false;
            botao.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Aprovação';
            if (response.ok && resposta.sucesso) {
                toastr.success('Formulário aprovado com sucesso!');
                setTimeout(() => location.reload(), 1500);
            }
            else {
                toastr.error(resposta.mensagem || 'Erro ao aprovar formulário.');
                resetarPaineisConfirmacao();
            }
        }
        catch (erro) {
            console.error('Erro ao aprovar formulário:', erro);
            botao.disabled = false;
            botao.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Aprovação';
            toastr.error('Erro ao aprovar formulário.');
            resetarPaineisConfirmacao();
        }
    });
}
function rejeitarFormularioConfirmado() {
    return __awaiter(this, void 0, void 0, function* () {
        const formularioId = document.getElementById('formularioIdAtual').value;
        const observacaoAdmin = document.getElementById('observacaoAdmin').value;
        if (!observacaoAdmin || observacaoAdmin.trim() === '') {
            toastr.warning('Por favor, preencha a observação indicando o motivo da rejeição.');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('motivo', observacaoAdmin);
            formData.append('__RequestVerificationToken', document.querySelector('input[name="__RequestVerificationToken"]').value);
            const response = yield fetch(`/admin/formularios-adocao/Rejeitar/${formularioId}`, { method: 'POST', body: formData });
            const resposta = yield response.json();
            if (response.ok && resposta.sucesso) {
                toastr.success('Formulário rejeitado com sucesso!');
                setTimeout(() => location.reload(), 1500);
            }
            else {
                toastr.error(resposta.mensagem || 'Erro ao rejeitar formulário.');
                resetarPaineisConfirmacao();
            }
        }
        catch (_a) {
            toastr.error('Ocorreu um erro ao processar sua solicitação.');
            resetarPaineisConfirmacao();
        }
    });
}
function aprovarFormulario(id) {
    idFormularioAtual = id;
    processarFormulario(id, 'aprovar');
}
function rejeitarFormulario(id) {
    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo || motivo.trim() === '') {
        alert('É necessário informar um motivo para rejeitar o formulário.');
        return;
    }
    idFormularioAtual = id;
    processarFormulario(id, 'rejeitar', motivo);
}
function processarFormulario(id, acao, observacao = '') {
    toastr.info(`Processando ${acao === 'aprovar' ? 'aprovação' : 'rejeição'} do formulário...`);
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    processarFormularioAcao(id, acao, token, observacao);
}
function processarFormularioAcao(id_1, acao_1, token_1) {
    return __awaiter(this, arguments, void 0, function* (id, acao, token, observacao = '') {
        const url = acao === 'aprovar'
            ? `/admin/formularios-adocao/Aprovar/${id}`
            : `/admin/formularios-adocao/Rejeitar/${id}`;
        const formData = new FormData();
        formData.append('__RequestVerificationToken', token);
        if (acao === 'rejeitar') {
            formData.append('motivo', observacao);
        }
        else {
            formData.append('observacao', observacao);
        }
        try {
            const response = yield fetch(url, { method: 'POST', body: formData });
            const resposta = yield response.json();
            if (response.ok && resposta && resposta.sucesso) {
                const classeStatus = acao === 'aprovar' ? 'aprovado' : 'rejeitado';
                const textoStatus = acao === 'aprovar' ? 'Aprovado' : 'Rejeitada';
                const linha = document.querySelector(`table tbody tr[data-id="${id}"]`);
                if (linha) {
                    const statusEl = linha.querySelector('.indicador-status');
                    statusEl.classList.remove('pendente', 'aprovado', 'rejeitado', 'cancelado', 'aguardando-buscar');
                    statusEl.classList.add(classeStatus);
                    statusEl.innerHTML = `${obterIconeStatus(textoStatus)} ${textoStatus}`;
                    linha.querySelector('.botoes-acao').innerHTML = `
                    <button class="botao-acao botao-visualizar" onclick="visualizarFormulario(${id})">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    linha.setAttribute('data-status', textoStatus);
                }
                atualizarContadoresFormularios();
                toastr.success(`Formulário ${acao === 'aprovar' ? 'aprovado' : 'rejeitado'} com sucesso!`);
                if (modalDetalhesFormulario) {
                    modalDetalhesFormulario.hide();
                }
            }
            else {
                toastr.error((resposta === null || resposta === void 0 ? void 0 : resposta.mensagem) || `Erro ao ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'} formulário`);
            }
        }
        catch (_a) {
            toastr.error(`Erro ao ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'} formulário`);
        }
    });
}
function atualizarContadoresFormularios() {
    const total = document.querySelectorAll('table tbody tr').length;
    const pendentes = document.querySelectorAll('table tbody tr[data-status="Pendente"]').length;
    const aprovados = document.querySelectorAll('table tbody tr[data-status="Aprovado"]').length;
    const rejeitados = document.querySelectorAll('table tbody tr[data-status="Rejeitada"]').length;
    const cancelados = document.querySelectorAll('table tbody tr[data-status^="Cancelad"]').length;
    document.querySelector('.card.resumo.total-formularios .h5').textContent = total.toString();
    document.querySelector('.card.resumo.pendentes .h5').textContent = pendentes.toString();
    document.querySelector('.card.resumo.aprovados .h5').textContent = aprovados.toString();
    document.querySelector('.card.resumo.rejeicoes .h5').textContent = (rejeitados + cancelados).toString();
}
function gerarAvatarInicial(nome) {
    if (!nome || nome.length === 0)
        return '?';
    return nome.charAt(0).toUpperCase();
}
function exibirFotoUsuario(fotoPerfil, nome) {
    if (fotoPerfil && fotoPerfil !== '') {
        return `<img src="/imagens/perfil/${fotoPerfil}" alt="${nome}" class="foto-usuario">`;
    }
    else {
        return `<div class="avatar-inicial">${gerarAvatarInicial(nome)}</div>`;
    }
}
function obterIconeStatus(status) {
    switch (status.toLowerCase()) {
        case 'pendente':
            return 'fas fa-clock text-warning';
        case 'aprovado':
            return 'fas fa-check-circle text-success';
        case 'rejeitado':
            return 'fas fa-times-circle text-danger';
        case 'cancelado':
            return 'fas fa-ban text-secondary';
        case 'em processo':
            return 'fas fa-spinner text-primary';
        case 'aguardando buscar':
            return 'fas fa-truck-pickup text-warning';
        case 'finalizado':
            return 'fas fa-check-double text-success';
        default:
            return 'fas fa-question-circle text-muted';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', event => {
        const link = event.target.closest('.pagination .page-link');
        if (link) {
            event.preventDefault();
            const url = link.getAttribute('href');
            if (url) {
                window.location.href = url;
            }
        }
    });
    const tabelaForm = document.querySelector('.tabela-formularios tbody');
    if (tabelaForm) {
        tabelaForm.addEventListener('click', event => {
            const botao = event.target.closest('.botao-visualizar, .botao-contorno-primario');
            if (botao) {
                const linha = botao.closest('tr');
                const id = linha === null || linha === void 0 ? void 0 : linha.getAttribute('data-id');
                if (id) {
                    event.preventDefault();
                    visualizarFormulario(id);
                }
            }
        });
    }
    const modalEl = document.getElementById('modalDetalhesFormulario');
    if (modalEl) {
        modalEl.addEventListener('hide.bs.modal', e => {
            const obsAtual = document.getElementById('observacaoAdmin').value;
            if (statusFormularioAtual === 'Pendente' && obsAtual && obsAtual !== observacaoAdminInicial) {
                if (!confirm('Você tem observações não salvas. Deseja realmente sair?')) {
                    e.preventDefault();
                }
            }
        });
        modalEl.addEventListener('hidden.bs.modal', () => {
            document.getElementById('observacaoAdmin').value = '';
            observacaoAdminInicial = '';
            statusFormularioAtual = '';
        });
    }
});
