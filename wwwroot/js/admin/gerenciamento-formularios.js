function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
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
        const nome = linha.querySelector('.nome-cliente')?.textContent.toLowerCase() || '';
        const emailElem = Array.from(linha.querySelectorAll('small')).find(s => s.textContent.includes('@'));
        const email = emailElem ? emailElem.textContent.toLowerCase() : '';
        const enderecoElem = Array.from(linha.querySelectorAll('small')).find(s => s.innerHTML.includes('fa-map-marker-alt'));
        const endereco = enderecoElem ? enderecoElem.textContent.toLowerCase() : '';
        const statusLinha = linha.querySelector('.indicador-status')?.textContent.toLowerCase() || '';
        const textoData = linha.querySelector('.data')?.textContent || '';
        let correspondenciaData = true;
        
        if (data) {
            const dataFormulario = analisarData(textoData);
            if (data === 'hoje') {
                correspondenciaData = dataFormulario >= hoje;
            } else if (data === '7dias') {
                correspondenciaData = dataFormulario >= ultimos7Dias;
            } else if (data === '30dias') {
                correspondenciaData = dataFormulario >= ultimos30Dias;
            }
        }
        
        const correspondenciaNome = nome.includes(pesquisa) || email.includes(pesquisa) || endereco.includes(pesquisa);
        const correspondenciaStatus = !status || statusLinha === status.toLowerCase();
        
        if (correspondenciaNome && correspondenciaStatus && correspondenciaData) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
    
    verificarResultadosPorSecao();
}

function analisarData(textoData) {
    const partes = textoData.split(' ')[0].split('/');
    return new Date(partes[2], partes[1] - 1, partes[0]);
}


function verificarResultadosPorSecao() {
    const secoes = [
        { container: '.tabela-formularios', mensagem: '.mensagem-sem-formularios' }
    ];

    secoes.forEach(secao => {
        const linhasVisiveis = Array.from(document.querySelectorAll(`${secao.container} tbody tr`))
            .filter(tr => tr.style.display !== 'none').length;
        const mensagemEl = document.querySelector(secao.mensagem);
        if (!mensagemEl) return;
        if (linhasVisiveis === 0) {
            mensagemEl.classList.remove('d-none');
        } else {
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

let modalDetalhesFormulario;
let idFormularioAtual;
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


function limparAlertasModal() {
    document.querySelectorAll('#modalDetalhesFormulario .alert').forEach(el => el.remove());
}


function visualizarFormulario(id) {


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
        </div>
    `;

    resetarPaineisConfirmacao();

    if (!modalDetalhesFormulario) {
        modalDetalhesFormulario = new bootstrap.Modal(document.getElementById('modalDetalhesFormulario'));
    }
    modalDetalhesFormulario.show();

    (async () => {
        try {
            const response = await fetch(`/admin/formularios-adocao/detalhes/${id}`);
            if (!response.ok) throw new Error('Falha ao obter detalhes');
            const text = await response.text();
            let resposta;
            try { resposta = JSON.parse(text); } catch { resposta = { html: text }; }

            let formulario = resposta.formulario || resposta.data || resposta.resultado;
            if (!formulario && resposta.id !== undefined) formulario = resposta;

            if (resposta.html) {
                document.getElementById('conteudoDetalhesFormulario').innerHTML = resposta.html;
            } else if (formulario) {
                document.getElementById('conteudoDetalhesFormulario').innerHTML = construirHTMLDetalhesFormulario(formulario);
            }

            const observacao = resposta.observacoesAdmin ||
                (formulario ? (formulario.observacaoAdminFormulario || formulario.observacaoAdmin || formulario.observacoes) : '') || '';
            const obsInput = document.getElementById('observacaoAdmin');
            obsInput.value = observacao;
            observacaoAdminInicial = observacao;
            statusFormularioAtual = resposta.status || (formulario ? formulario.status : '');

            const botoesPrimarios = document.getElementById('botoesAcaoPrimarios');
            if (statusFormularioAtual !== 'Pendente') {
                botoesPrimarios.classList.add('d-none');
                obsInput.readOnly = true;
            } else {
                botoesPrimarios.classList.remove('d-none');
                obsInput.readOnly = false;
            }

            document.getElementById('botaoAprovarNoModal').onclick = exibirConfirmacaoAprovacao;
            document.getElementById('botaoRejeitarNoModal').onclick = exibirConfirmacaoRejeicao;
            document.getElementById('botaoCancelarAprovacao').onclick = resetarPaineisConfirmacao;
            document.getElementById('botaoCancelarRejeicao').onclick = resetarPaineisConfirmacao;
            document.getElementById('botaoConfirmarAprovacao').onclick = aprovarFormularioConfirmado;
            document.getElementById('botaoConfirmarRejeicao').onclick = rejeitarFormularioConfirmado;
        } catch (erro) {
            document.getElementById('conteudoDetalhesFormulario').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle me-2"></i>
                    Ocorreu um erro ao carregar os detalhes do formulário.
                </div>`;
            console.error('Erro na requisição:', erro);
        }
    })();
}


function construirHTMLDetalhesFormulario(formulario) {
    try {

        const s = escapeHtml;
        
        
        if (!formulario || typeof formulario !== 'object') {
            console.error("Objeto de formulário inválido:", formulario);
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Erro ao processar formulário</strong>
                    <p>Dados do formulário inválidos ou incompletos.</p>
                </div>
            `;
        }
        
        
        
        
        const dataEnvio = new Date(formulario.dataEnvio);
        const dataFormatada = dataEnvio.toLocaleString('pt-BR');
        const dataResposta = formulario.dataResposta ? new Date(formulario.dataResposta).toLocaleString('pt-BR') : '-';
        
        
        let htmlConteudo = `
            <div class="container-fluid p-0">
                <!-- Cabeçalho com informações básicas -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-light">
                        <div class="d-flex align-items-center">
                            <h4 class="mb-0 fw-bold text-primary fs-5">
                                <i class="fas fa-file-alt me-2"></i>
                                Formulário #${s(formulario.id)}
                            </h4>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row small">
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <i class="fas fa-calendar-alt text-primary me-2"></i>
                                    <strong>Data de envio:</strong> ${dataFormatada}
                                </div>
                            </div>
                            ${formulario.dataResposta ? `
                            <div class="col-md-6">
                                <div class="mb-2">
                                    <i class="fas fa-check-circle text-primary me-2"></i>
                                    <strong>Data de resposta:</strong> ${dataResposta}
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
        `;

        
        if ((formulario.status === 'Cancelada' || formulario.status === 'Cancelado pelo Admin') && formulario.observacaoAdminFormulario) {
            htmlConteudo += `
                <div class="alert alert-warning mb-4">
                    <div class="d-flex">
                        <div class="me-3">
                            <i class="fas fa-exclamation-triangle fa-2x text-warning"></i>
                        </div>
                        <div>
                            <h5 class="mb-1 fw-bold">Motivo do Cancelamento (Admin)</h5>
                            <p class="mb-0">${s(formulario.observacaoAdminFormulario || 'Não informado')}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        
        if ((formulario.status === 'Cancelada' || formulario.status === 'Cancelado pelo Usuário') && formulario.observacoesCancelamento) {
            htmlConteudo += `
                <div class="alert alert-info mb-4">
                    <div class="d-flex">
                        <div class="me-3">
                            <i class="fas fa-comment-alt fa-2x text-info"></i>
                        </div>
                        <div>
                            <h5 class="mb-1 fw-bold">Motivo do Cancelamento (Usuário)</h5>
                            <p class="mb-0">${s(formulario.observacoesCancelamento || 'Não informado')}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        
        htmlConteudo += `
            <div class="row mb-4">
                <!-- Dados do Interessado -->
                <div class="col-md-6 mb-3">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-light">
                            <h5 class="mb-0 fw-bold text-primary">
                                <i class="fas fa-user me-2"></i>Dados do Interessado
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex mb-3">
                                <div class="me-3">
                                    <div class="container-foto-usuario ${!formulario.usuario?.fotoPerfil ? 'sem-foto' : ''}" style="width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background-color: ${!formulario.usuario?.fotoPerfil ? '#F59E0B' : 'transparent'}; color: white; font-weight: bold; font-size: 1.5rem;">
                                        ${!formulario.usuario?.fotoPerfil 
                                            ? `<span class="iniciais">${formulario.usuario?.nome?.charAt(0) || '?'}</span>` 
                                            : `<img src="/imagens/perfil/${formulario.usuario.fotoPerfil}" alt="${s(formulario.usuario.nome || '')}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                                        }
                                    </div>
                                </div>
                                <div>
                                    <h6 class="mb-1 fw-bold fs-6">${s(formulario.usuario?.nome || 'Nome não informado')}</h6>
                                    <div class="text-muted small">
                                        <div><i class="fas fa-envelope me-1"></i>${s(formulario.usuario?.email || 'Email não informado')}</div>
                                        <div><i class="fas fa-phone me-1"></i>${s(formulario.usuario?.telefone || 'Telefone não informado')}</div>
                                        <div><i class="fas fa-map-marker-alt me-1"></i>${s(formulario.usuario?.cidade || 'Cidade não informada')}${formulario.usuario?.estado ? ` - ${s(formulario.usuario.estado)}` : ''}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Pet de Interesse -->
                <div class="col-md-6 mb-3">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-light">
                            <h5 class="mb-0 fw-bold text-primary">
                                <i class="fas fa-paw me-2"></i>Pet de Interesse
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex mb-3">
                                <div class="me-3">
                                    <div style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden;">
                                        <img src="${formulario.pet?.nomeArquivoImagem 
                                            ? `/imagens/pets/${formulario.pet.nomeArquivoImagem}` 
                                            : `/imagens/pets/pet-placeholder.jpg`}" 
                                            alt="${s(formulario.pet?.nome || 'Pet')}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                </div>
                                <div>
                                    <h6 class="mb-1 fw-bold fs-6">${s(formulario.pet?.nome || 'Nome não informado')}</h6>
                                    <div class="text-muted small">
                                        <div>
                                            <i class="${formulario.pet?.especie === 'Cachorro' ? 'fas fa-dog' : 'fas fa-cat'} me-1"></i>
                                            ${s(formulario.pet?.especie || 'Espécie não informada')}
                                        </div>
                                        <div>
                                            <i class="fas fa-ruler me-1"></i>
                                            ${s(formulario.pet?.porte || 'Porte não informado')}
                                        </div>
                                        <div>
                                            <i class="fas fa-venus-mars me-1"></i>
                                            ${s(formulario.pet?.sexo || 'Sexo não informado')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Informações do Formulário -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0 fw-bold text-primary">
                        <i class="fas fa-clipboard-list me-2"></i>Informações do Formulário
                    </h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <tbody>
                                <tr>
                                    <th style="width: 30%">Por que você quer adotar este pet?</th>
                                    <td>${s(formulario.motivacaoAdocao || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Conte-nos sobre sua experiência com pets</th>
                                    <td>${s(formulario.experienciaAnterior || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Qual espaço o pet terá disponível?</th>
                                    <td>${s(formulario.espacoAdequado || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>O que fará com o pet quando precisar viajar?</th>
                                    <td>${s(formulario.planejamentoViagens || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Como planeja arcar com os custos do pet?</th>
                                    <td>${s(formulario.condicoesFinanceiras || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Descreva sua moradia</th>
                                    <td>${s(formulario.descricaoMoradia || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Tipo de residência</th>
                                    <td>${s(formulario.tipoResidencia || 'Não informado')}</td>
                                </tr>
                                <tr>
                                    <th>Renda mensal aproximada</th>
                                    <td>R$ ${typeof formulario.rendaMensal === 'number' ? formulario.rendaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</td>
                                </tr>
                                <tr>
                                    <th>Pessoas na residência</th>
                                    <td>${s(formulario.numeroMoradores || '0')}</td>
                                </tr>
                                ${formulario.tempoDisponivel ? `
                                <tr>
                                    <th>Quanto tempo livre você tem para dedicar ao pet diariamente?</th>
                                    <td>${s(formulario.tempoDisponivel)} horas por dia</td>
                                </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        return htmlConteudo;
    } catch (erro) {
        console.error('Erro ao construir detalhes do formulário:', erro);
        return `<div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Erro ao carregar detalhes do formulário. Por favor, tente novamente.
        </div>`;
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

    const formularioId = document.getElementById('formularioIdAtual').value;
    const observacaoAdmin = document.getElementById('observacaoAdmin').value;

    const botao = document.getElementById('botaoConfirmarAprovacao');
    botao.disabled = true;
    botao.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processando...';

    (async () => {
        try {
            const formData = new FormData();
            formData.append('observacao', observacaoAdmin);
            formData.append('__RequestVerificationToken', document.querySelector('input[name="__RequestVerificationToken"]').value);

            const response = await fetch(`/admin/formularios-adocao/Aprovar/${formularioId}`, {
                method: 'POST',
                body: formData
            });

            const resposta = await response.json();
            botao.disabled = false;
            botao.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Aprovação';

            if (response.ok && resposta.sucesso) {
                toastr.success('Formulário aprovado com sucesso!');
                setTimeout(() => location.reload(), 1500);
            } else {
                toastr.error(resposta.mensagem || 'Erro ao aprovar formulário.');
                resetarPaineisConfirmacao();
                if (resposta.mensagem && resposta.mensagem.includes('pet')) {
                    document.querySelector('#modalDetalhesFormulario .modal-body').insertAdjacentHTML('afterbegin', `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <strong>Erro!</strong> ${resposta.mensagem}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                        </div>`);
                }
            }
        } catch (erro) {
            console.error('Erro ao aprovar formulário:', erro);
            botao.disabled = false;
            botao.innerHTML = '<i class="fas fa-check me-2"></i>Confirmar Aprovação';
            toastr.error('Erro ao aprovar formulário.');
            resetarPaineisConfirmacao();
        }
    })();
}
function rejeitarFormularioConfirmado() {
    const formularioId = document.getElementById('formularioIdAtual').value;
    const observacaoAdmin = document.getElementById('observacaoAdmin').value;

    if (!observacaoAdmin || observacaoAdmin.trim() === '') {
        toastr.warning('Por favor, preencha a observação indicando o motivo da rejeição.');
        return;
    }

    (async () => {
        try {
            const formData = new FormData();
            formData.append('motivo', observacaoAdmin);
            formData.append('__RequestVerificationToken', document.querySelector('input[name="__RequestVerificationToken"]').value);

            const response = await fetch(`/admin/formularios-adocao/Rejeitar/${formularioId}`, {
                method: 'POST',
                body: formData
            });

            const resposta = await response.json();
            if (response.ok && resposta.sucesso) {
                toastr.success('Formulário rejeitado com sucesso!');
                setTimeout(() => location.reload(), 1500);
            } else {
                toastr.error(resposta.mensagem || 'Erro ao rejeitar formulário.');
                resetarPaineisConfirmacao();
            }
        } catch (erro) {
            toastr.error('Ocorreu um erro ao processar sua solicitação.');
            resetarPaineisConfirmacao();
        }
    })();
}


function aprovarFormulario(id) {
    idFormularioAtual = id;
    processarFormulario(id, 'aprovar');
}


function rejeitarFormulario(id) {
    
    const motivo = prompt('Por favor, indique o motivo da rejeição:');
    
    
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

async function processarFormularioAcao(id, acao, token, observacao = '') {
    const url = acao === 'aprovar'
        ? `/admin/formularios-adocao/Aprovar/${id}`
        : `/admin/formularios-adocao/Rejeitar/${id}`;

    const formData = new FormData();
    formData.append('__RequestVerificationToken', token);
    if (acao === 'rejeitar') {
        formData.append('motivo', observacao);
    } else {
        formData.append('observacao', observacao);
    }

    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        const resposta = await response.json();

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
        } else {
            toastr.error(resposta?.mensagem || `Erro ao ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'} formulário`);
        }
    } catch (erro) {
        console.error(`Erro ao ${acao} formulário:`, erro);
        toastr.error(`Erro ao ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'} formulário`);
    }
}


function atualizarContadoresFormularios() {
    const total = document.querySelectorAll('table tbody tr').length;
    const pendentes = document.querySelectorAll('table tbody tr[data-status="Pendente"]').length;
    const aprovados = document.querySelectorAll('table tbody tr[data-status="Aprovado"]').length;
    const rejeitados = document.querySelectorAll('table tbody tr[data-status="Rejeitada"]').length;
    const cancelados = document.querySelectorAll('table tbody tr[data-status^="Cancelad"]').length;

    document.querySelector('.card.resumo.total-formularios .h5').textContent = total;
    document.querySelector('.card.resumo.pendentes .h5').textContent = pendentes;
    document.querySelector('.card.resumo.aprovados .h5').textContent = aprovados;
    document.querySelector('.card.resumo.rejeicoes .h5').textContent = rejeitados + cancelados;
}


function gerarAvatarInicial(nome) {
    if (!nome || nome.length === 0) return '?';
    return nome.charAt(0).toUpperCase();
}


function exibirFotoUsuario(fotoPerfil, nome) {
    if (fotoPerfil && fotoPerfil !== '') {
        return `<img src="/imagens/perfil/${fotoPerfil}" alt="${nome}" class="foto-usuario">`;
    } else {
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