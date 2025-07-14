let toastrConfig = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 5000
};


const URL_API_DETALHES_ADOCAO = "/admin/adocoes/Detalhes/";
const URL_API_APROVAR_ADOCAO = "/admin/adocoes/aprovar/";
const URL_API_REJEITAR_ADOCAO = "/admin/adocoes/rejeitar/";
const URL_API_AGUARDANDO_BUSCAR = "/admin/adocoes/aguardando-buscar/";
const URL_API_FINALIZAR_ADOCAO = "/admin/adocoes/finalizar/";
const URL_API_CANCELAR_ADOCAO = "/admin/adocoes/Cancelar/";
const URL_API_OBTER_PERFIL_USUARIO = "/admin/adocoes/ObterPerfilUsuario";
const URL_API_ESTATISTICAS_ADOCAO_USUARIO = "/admin/adocoes/ObterEstatisticasAdocaoUsuario";
const URL_API_HISTORICO_ADOCOES_USUARIO = "/admin/adocoes/ObterHistoricoAdocoesUsuario";


document.addEventListener("DOMContentLoaded", () => {
    
    
    toastr.options = toastrConfig;
    
    
    inicializarEventos();
    
    
    aplicarFormatacaoTabela();
    
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.pagination .page-link');
        if (link) {
            e.preventDefault();
            const url = link.getAttribute('href');
            if (url) {
                window.location.href = url;
            }
        }
    });
});


function inicializarEventos() {
    document.getElementById('pesquisaAdocao').addEventListener('keyup', filtrarTabela);
    document.getElementById('filtroStatus').addEventListener('change', filtrarTabela);
    document.getElementById('filtroData').addEventListener('change', filtrarTabela);
    document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);

    document.addEventListener('click', event => {
        const botaoPerfil = event.target.closest('.botao-ver-perfil');
        if (botaoPerfil) {
            const usuarioId = botaoPerfil.dataset.usuarioId;
            abrirPerfilUsuario(usuarioId);
        }
    });

    const modalDetalhes = document.getElementById('modalDetalhesAdocao');
    modalDetalhes.addEventListener('hidden.bs.modal', () => {
        document.querySelector('.carregando-detalhes').classList.remove('d-none');
        document.querySelector('.detalhes-adocao-container').classList.add('d-none');

        ['detalhesNomePet','detalhesEspeciePet','detalhesRacaPet','detalhesIdadePet','detalhesSexoPet','detalhesPortePet'].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
        ['detalhesStatusAdocao','detalhesDataEnvio','detalhesDataResposta','detalhesNomeAdotante','detalhesEmailAdotante','detalhesTelefoneAdotante','detalhesCpfAdotante'].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
        document.getElementById('detalhesObservacoes').innerHTML = '';

        document.querySelectorAll('.timeline-progresso-item').forEach(el => el.classList.remove('ativo','concluido','atual','rejeitado'));
        document.querySelectorAll('.timeline-progresso-linha').forEach(el => el.classList.remove('ativa'));
        ['timelineDataSolicitacao','timelineDataAprovacao','timelineDataBusca','timelineDataFinalizacao'].forEach(id => {
            document.getElementById(id).textContent = '';
        });

        document.getElementById('detalhesDataBuscaContainer').classList.add('d-none');
        document.getElementById('detalhesDataFinalizacaoContainer').classList.add('d-none');
        document.getElementById('detalhesPrazoBusca').classList.add('d-none');

        document.getElementById('detalhesPetImagem').innerHTML = '<i class="fas fa-paw"></i>';
        document.getElementById('detalhesAdotanteAvatar').innerHTML = '<i class="fas fa-user"></i>';
    });

    modalDetalhes.addEventListener('shown.bs.modal', () => {
        setTimeout(configurarNavegacaoAbas, 200);
    });

    document.addEventListener('click', event => {
        const aba = event.target.closest('.detalhes-aba');
        if (aba) {
            event.preventDefault();
            const painelAlvo = aba.dataset.painel;
            document.querySelectorAll('.detalhes-aba').forEach(a => a.classList.remove('ativa'));
            aba.classList.add('ativa');
            document.querySelectorAll('.detalhes-painel').forEach(p => p.classList.remove('ativo'));
            document.getElementById(painelAlvo).classList.add('ativo');
        }
    });
}


function aplicarFormatacaoTabela() {
    document.querySelectorAll('.tabela tr').forEach(tr => {
        const indicador = tr.querySelector('.indicador-status');
        const status = indicador ? indicador.textContent.trim() : '';
        formatarIndicadorStatus(indicador, status);
    });
}


function formatarIndicadorStatus(elemento, status) {
    if (!elemento) return;
    elemento.classList.remove('pendente','aprovado','finalizada','rejeitada','cancelada','em-processo','aguardando-buscar');
    
    
    switch(status.toLowerCase()) {
        case 'pendente':
            elemento.classList.add('pendente');
            break;
        case 'aprovado':
            elemento.classList.add('aprovado');
            break;
        case 'finalizada':
            elemento.classList.add('finalizada');
            break;
        case 'rejeitada':
            elemento.classList.add('rejeitada');
            break;
        case 'cancelada':
            elemento.classList.add('cancelada');
            break;
        case 'em processo':
            elemento.classList.add('em-processo');
            break;
        case 'aguardando buscar':
            elemento.classList.add('aguardando-buscar');
        break;
    }
}


function filtrarTabela() {
    const textoPesquisa = document.getElementById('pesquisaAdocao').value.toLowerCase();
    const statusFiltro = document.getElementById('filtroStatus').value;
    const dataFiltro = document.getElementById('filtroData').value;
    
    let temRegistros = false;
    
    document.querySelectorAll('.tabela tbody tr').forEach(linha => {
        const conteudoLinha = linha.textContent.toLowerCase();
        const statusLinha = linha.dataset.status;
        const spanData = linha.querySelector('td:nth-child(3) span:first-child');
        const dataAdocao = spanData ? new Date(spanData.textContent.split('/').reverse().join('-')) : new Date();
        
        let mostrarPorTexto = conteudoLinha.indexOf(textoPesquisa) > -1;
        let mostrarPorStatus = statusFiltro === 'Todos' || statusLinha === statusFiltro;
        let mostrarPorData = verificarFiltroData(dataAdocao, dataFiltro);
        
        if (mostrarPorTexto && mostrarPorStatus && mostrarPorData) {
            linha.classList.remove('d-none');
            temRegistros = true;
        } else {
            linha.classList.add('d-none');
        }
    });
    
    
    const tabela = document.querySelector('.tabela');
    const msgSem = document.querySelector('.mensagem-sem-adocoes');
    if (temRegistros) {
        tabela.classList.remove('d-none');
        msgSem.classList.add('d-none');
    } else {
        tabela.classList.add('d-none');
        msgSem.classList.remove('d-none');
    }
}


function verificarFiltroData(data, filtro) {
    if (!filtro) return true;
    
    const hoje = new Date();
    
    switch(filtro) {
        case 'hoje':
            return data.toDateString() === hoje.toDateString();
        case '7dias':
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(hoje.getDate() - 7);
            return data >= seteDiasAtras;
        case '30dias':
            const trintaDiasAtras = new Date();
            trintaDiasAtras.setDate(hoje.getDate() - 30);
            return data >= trintaDiasAtras;
        default:
            return true;
    }
}


function limparFiltros() {
    document.getElementById('pesquisaAdocao').value = '';
    document.getElementById('filtroStatus').value = 'Todos';
    document.getElementById('filtroData').value = '';
    
    filtrarTabela();
}

function formatarTelefone(telefone) {
    if (!telefone) return "-";
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

function formatarCPF(cpf) {
    if (!cpf) return "-";
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function formatarCEP(cep) {
    if (!cep) return "-";
    cep = cep.replace(/\D/g, '');
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}


async function verDetalhes(id, fromProfile = false) {
    if (fromProfile) {
        const perfilModalEl = document.getElementById('perfilUsuarioModal');
        const perfilModal = bootstrap.Modal.getInstance(perfilModalEl);
        if (perfilModal) perfilModal.hide();
    }

    const modalEl = document.getElementById('modalDetalhesAdocao');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    const carregando = document.querySelector('.carregando-detalhes');
    const container = document.querySelector('.detalhes-adocao-container');
    carregando.classList.remove('d-none');
    container.classList.add('d-none');

    try {
        const resp = await fetch(URL_API_DETALHES_ADOCAO + id);
        if (!resp.ok) throw new Error(resp.statusText);
        const dados = await resp.json();
        const detalhes = dados && dados.sucesso ? dados.dados : dados;
        if (detalhes && detalhes.id) {
            preencherDetalhesAdocao(detalhes, fromProfile);
            setTimeout(configurarNavegacaoAbas, 100);
        } else {
            carregando.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Não foi possível carregar os detalhes da adoção. ${dados.mensagem || 'Tente novamente mais tarde.'}
                </div>`;
        }
    } catch (error) {
        carregando.innerHTML = `
            <div class="alert alert-danger m-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Erro ao carregar detalhes: ${error}
            </div>`;
    }
}


function preencherDetalhesAdocao(adocao, fromProfile = false) {
    document.querySelector('.carregando-detalhes').classList.add('d-none');
    document.querySelector('.detalhes-adocao-container').classList.remove('d-none');

    const statusElement = document.getElementById('detalhesStatusAdocao');
    statusElement.textContent = adocao.status;

    statusElement.classList.remove('sucesso','alerta','perigo','destaque');
    switch(adocao.status) {
        case 'Finalizada':
            statusElement.classList.add('sucesso');
            break;
        case 'Aguardando buscar':
            statusElement.classList.add('alerta');
            break;
        case 'Rejeitada':
        case 'Cancelada':
            statusElement.classList.add('perigo');
            break;
        case 'Em Processo':
        case 'Aprovado':
        case 'Pendente':
        default:
            statusElement.classList.add('destaque');
            break;
    }
    
    
    const prazoElement = document.getElementById('detalhesPrazoBusca');
    
    if (adocao.status === 'Aguardando buscar' && adocao.dataResposta) {
        const dataLimite = new Date(adocao.dataResposta);
        dataLimite.setDate(dataLimite.getDate() + 10);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataLimite - hoje) / (1000 * 60 * 60 * 24));
        
        
        prazoElement.classList.remove('sucesso','alerta','perigo');
        
        
        if (diasRestantes <= 0) {
            prazoElement.textContent = 'Prazo expirado';
            prazoElement.classList.add('perigo');
        } else if (diasRestantes <= 2) {
            prazoElement.textContent = `${diasRestantes} dias`;
            prazoElement.classList.add('perigo');
        } else if (diasRestantes <= 5) {
            prazoElement.textContent = `${diasRestantes} dias`;
            prazoElement.classList.add('alerta');
        } else {
            prazoElement.textContent = `${diasRestantes} dias`;
            prazoElement.classList.add('sucesso');
        }
        
        prazoElement.classList.remove('d-none');
    } else {
        prazoElement.classList.add('d-none');
    }
    
    
    configurarTimelineProgresso(adocao);
    
    
    document.getElementById('detalhesNomePet').textContent = adocao.pet ? adocao.pet.nome : 'Não disponível';
    document.getElementById('detalhesEspeciePet').textContent = adocao.pet ? adocao.pet.especie : '-';
    document.getElementById('detalhesRacaPet').textContent = adocao.pet ? adocao.pet.raca : '-';
    document.getElementById('detalhesIdadePet').textContent = adocao.pet ? adocao.pet.idade : '-';
    document.getElementById('detalhesSexoPet').textContent = adocao.pet ? adocao.pet.sexo : '-';
    document.getElementById('detalhesPortePet').textContent = adocao.pet ? adocao.pet.porte : '-';
    
    
    const petImagemContainer = document.getElementById('detalhesPetImagem');
    petImagemContainer.innerHTML = '';
    
    if (adocao.pet && adocao.pet.imagem) {
        const img = document.createElement('img');
        img.src = `/imagens/pets/${adocao.pet.imagem}`;
        img.alt = adocao.pet.nome;
        petImagemContainer.appendChild(img);
    } else {
        petImagemContainer.innerHTML = '<i class="fas fa-paw"></i>';
    }
    
    
    document.getElementById('detalhesNomeAdotante').textContent = adocao.usuario ? adocao.usuario.nome : 'Não disponível';
    document.getElementById('detalhesEmailAdotante').textContent = adocao.usuario ? adocao.usuario.email : '-';
    document.getElementById('detalhesTelefoneAdotante').textContent = adocao.usuario && adocao.usuario.telefone ? formatarTelefone(adocao.usuario.telefone) : '-';
    document.getElementById('detalhesCpfAdotante').textContent = adocao.usuario && adocao.usuario.cpf ? formatarCPF(adocao.usuario.cpf) : '-';
    
    
    const adotanteAvatarContainer = document.getElementById('detalhesAdotanteAvatar');
    adotanteAvatarContainer.innerHTML = '';
    
    if (adocao.usuario && adocao.usuario.fotoPerfil) {
        const img = document.createElement('img');
        img.src = `/imagens/perfil/${adocao.usuario.fotoPerfil}`;
        img.alt = adocao.usuario.nome;
        adotanteAvatarContainer.appendChild(img);
    } else if (adocao.usuario && adocao.usuario.nome) {
        adotanteAvatarContainer.textContent = adocao.usuario.nome.charAt(0).toUpperCase();
    } else {
        adotanteAvatarContainer.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    
    const botaoPerfil = document.getElementById('botaoVerPerfilCompleto');
    if (adocao.usuario) {
        botaoPerfil.classList.remove('d-none');
        botaoPerfil.onclick = () => {
            bootstrap.Modal.getInstance(document.getElementById('modalDetalhesAdocao')).hide();
            setTimeout(() => abrirPerfilUsuario(adocao.usuario.id), 500);
        };
    } else {
        botaoPerfil.classList.add('d-none');
        botaoPerfil.onclick = null;
    }
    
    
    document.getElementById('detalhesDataEnvio').textContent = new Date(adocao.dataEnvio).toLocaleString('pt-BR');
    document.getElementById('detalhesDataResposta').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleString('pt-BR') : 'Pendente';
    
    
    const dataBuscaContainer = document.getElementById('detalhesDataBuscaContainer');
    const dataFinalizacaoContainer = document.getElementById('detalhesDataFinalizacaoContainer');
    
    
    if (adocao.status === 'Aguardando buscar' && adocao.dataResposta) {
        const dataBusca = new Date(adocao.dataResposta).toLocaleString('pt-BR');
        document.getElementById('detalhesDataBusca').textContent = dataBusca;
        dataBuscaContainer.classList.remove('d-none');
    } else {
        dataBuscaContainer.classList.add('d-none');
    }
    
    
    if (adocao.status === 'Finalizada' && adocao.dataFinalizacao) {
        const dataFinalizacao = new Date(adocao.dataFinalizacao).toLocaleString('pt-BR');
        document.getElementById('detalhesDataFinalizacao').textContent = dataFinalizacao;
        dataFinalizacaoContainer.classList.remove('d-none');
    } else {
        dataFinalizacaoContainer.classList.add('d-none');
    }
    
    
    const obs = adocao.observacoes || adocao.observacaoAdminFormulario || adocao.observacoesCancelamento;
    if (obs) {
        document.getElementById('detalhesObservacoes').innerHTML = obs;
        document.getElementById('detalhesObservacoesProcesso').innerHTML = obs;
    } else {
        const vazio = '<div class="sem-observacoes">Sem observações adicionais.</div>';
        document.getElementById('detalhesObservacoes').innerHTML = vazio;
        document.getElementById('detalhesObservacoesProcesso').innerHTML = vazio;
    }
    
    
    const footer = document.querySelector('#modalDetalhesAdocao .modal-footer');
    const botaoVoltar = footer.querySelector('.botao-secundario');
    if (fromProfile) {
        if (!botaoVoltar) {
            footer.insertAdjacentHTML('afterbegin', `
                <button type="button" class="botao-secundario me-auto" onclick="voltarParaPerfil()">
                    <i class="fas fa-arrow-left me-2"></i>Voltar ao perfil
                </button>
            `);
        }
    } else if (botaoVoltar) {
        botaoVoltar.remove();
    }
    
    
    configurarNavegacaoAbas();
}


function configurarTimelineProgresso(adocao) {

    document.querySelectorAll('.timeline-progresso-item').forEach(el => el.classList.remove('ativo', 'concluido', 'atual', 'rejeitado'));
    document.querySelectorAll('.timeline-progresso-linha').forEach(el => el.classList.remove('ativa'));

    document.getElementById('timelineDataSolicitacao').textContent = new Date(adocao.dataEnvio).toLocaleDateString('pt-BR');

    document.getElementById('timelineSolicitacao').classList.add('concluido');
    
    
    switch(adocao.status) {
        case 'Pendente':
            break;
        case 'Rejeitada':
            document.getElementById('timelineAprovacao').classList.add('rejeitado');
            document.getElementById('timelineDataAprovacao').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            break;
        case 'Cancelada':
            if (adocao.dataResposta) {
                document.getElementById('timelineAprovacao').classList.add('concluido');
                document.getElementById('timelineDataAprovacao').textContent = new Date(adocao.dataResposta).toLocaleDateString('pt-BR');
                document.getElementById('timelineBusca').classList.add('rejeitado');
                document.getElementById('timelineDataBusca').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            } else {
                document.getElementById('timelineAprovacao').classList.add('rejeitado');
            }
            break;
        case 'Aprovado':
        case 'Em Processo':
            document.getElementById('timelineAprovacao').classList.add('concluido');
            document.getElementById('timelineDataAprovacao').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            document.querySelectorAll('.timeline-progresso-linha')[0].classList.add('ativa');
            break;
        case 'Aguardando buscar':
            document.getElementById('timelineAprovacao').classList.add('concluido');
            document.getElementById('timelineDataAprovacao').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            document.getElementById('timelineBusca').classList.add('atual');
            document.getElementById('timelineDataBusca').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            document.querySelectorAll('.timeline-progresso-linha')[0].classList.add('ativa');
            document.querySelectorAll('.timeline-progresso-linha')[1].classList.add('ativa');
            break;
        case 'Finalizada':
            document.getElementById('timelineAprovacao').classList.add('concluido');
            document.getElementById('timelineDataAprovacao').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            document.getElementById('timelineBusca').classList.add('concluido');
            document.getElementById('timelineDataBusca').textContent = adocao.dataResposta ? new Date(adocao.dataResposta).toLocaleDateString('pt-BR') : '';
            document.getElementById('timelineFinalizacao').classList.add('concluido');
            document.getElementById('timelineDataFinalizacao').textContent = adocao.dataFinalizacao ? new Date(adocao.dataFinalizacao).toLocaleDateString('pt-BR') : '';
            document.querySelectorAll('.timeline-progresso-linha').forEach(el => el.classList.add('ativa'));
            break;
    }
}


function voltarParaPerfil() {
    const detalhesEl = document.getElementById('modalDetalhesAdocao');
    bootstrap.Modal.getInstance(detalhesEl).hide();

    const handleHidden = () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('perfilUsuarioModal')).show();
        detalhesEl.removeEventListener('hidden.bs.modal', handleHidden);
    };
    detalhesEl.addEventListener('hidden.bs.modal', handleHidden);
}


function mostrarModalAcao(id, acao) {
    document.getElementById('idAdocaoAcao').value = id;
    document.getElementById('tipoAcao').value = acao;
    document.getElementById('observacaoAcao').value = '';
    document.getElementById('erroObservacao').style.display = 'none';

    const precisaObservacao = (acao === 'rejeitar' || acao === 'cancelar');
    document.getElementById('campoObservacao').style.display = precisaObservacao ? 'block' : 'none';
    
    
    let titulo = "Confirmar Ação";
    let mensagem = "Você está prestes a realizar uma ação. Deseja continuar?";
    let corCabecalho = "bg-primary text-white";
    
    switch(acao) {
        case 'aprovar':
            titulo = "Aprovar Adoção";
            mensagem = "Tem certeza que deseja aprovar esta adoção?";
            corCabecalho = "bg-success text-white";
            break;
        case 'rejeitar':
            titulo = "Rejeitar Adoção";
            mensagem = "Tem certeza que deseja rejeitar esta adoção? Por favor, informe o motivo.";
            corCabecalho = "bg-danger text-white";
            break;
        case 'aguardandoBuscar':
            titulo = "Marcar como Aguardando Retirada";
            mensagem = "Tem certeza que deseja marcar esta adoção como aguardando retirada pelo adotante?";
            corCabecalho = "bg-warning text-dark";
            break;
        case 'finalizar':
            titulo = "Finalizar Adoção";
            mensagem = "Tem certeza que deseja finalizar esta adoção, confirmando que o pet foi retirado pelo adotante?";
            corCabecalho = "bg-success text-white";
            break;
        case 'cancelar':
            titulo = "Cancelar Adoção";
            mensagem = "Tem certeza que deseja cancelar esta adoção? Por favor, informe o motivo.";
            corCabecalho = "bg-danger text-white";
            break;
    }
    
    
    document.getElementById('tituloModalAcaoAdocao').textContent = titulo;
    document.getElementById('textoConfirmacaoAcao').textContent = mensagem;
    const header = document.getElementById('modalAcaoHeader');
    header.className = 'modal-header ' + corCabecalho;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAcaoAdocao')).show();
}


async function executarAcao() {
    const id = document.getElementById('idAdocaoAcao').value;
    const acao = document.getElementById('tipoAcao').value;
    const observacao = document.getElementById('observacaoAcao').value;
    
    
    if ((acao === 'rejeitar' || acao === 'cancelar') && !observacao.trim()) {
        document.getElementById('erroObservacao').style.display = 'block';
        return;
    }
    
    
    const botaoConfirmar = document.getElementById('botaoConfirmarAcao');
    botaoConfirmar.disabled = true;
    botaoConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processando...';
    
    
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    
    
    let url = '';
    let metodo = 'POST';
    const dados = new URLSearchParams();
    dados.append('__RequestVerificationToken', token);
    
    switch(acao) {
        case 'aprovar':
            url = URL_API_APROVAR_ADOCAO + id;
            break;
        case 'rejeitar':
            url = URL_API_REJEITAR_ADOCAO + id;
            dados.append('motivo', observacao);
            break;
        case 'aguardandoBuscar':
            url = URL_API_AGUARDANDO_BUSCAR + id;
            break;
        case 'finalizar':
            url = URL_API_FINALIZAR_ADOCAO + id;
            if (observacao) {
                dados.append('observacao', observacao);
            }
            break;
        case 'cancelar':
            url = URL_API_CANCELAR_ADOCAO + id;
            dados.append('motivo', observacao);
            break;
    }
    
    
    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: dados
        });
        const resultado = await resposta.json();

        botaoConfirmar.disabled = false;
        botaoConfirmar.innerHTML = 'Confirmar';
        bootstrap.Modal.getInstance(document.getElementById('modalAcaoAdocao')).hide();

        if (resultado.sucesso) {
            toastr.success(resultado.mensagem);
            setTimeout(() => { window.location.reload(); }, 1500);
        } else {
            toastr.error(resultado.mensagem);
        }
    } catch (error) {
        botaoConfirmar.disabled = false;
        botaoConfirmar.innerHTML = 'Confirmar';
        toastr.error('Ocorreu um erro: ' + error);
    }
}


async function abrirPerfilUsuario(usuarioId) {
    document.getElementById('spinnerPerfilUsuario').style.display = '';
    document.getElementById('conteudoPerfilUsuario').style.display = 'none';

    try {
        const respUsuario = await fetch(`${URL_API_OBTER_PERFIL_USUARIO}?id=${usuarioId}`);
        const usuario = await respUsuario.json();
        if (usuario) {
            renderizarPerfilUsuario(usuario);
        } else {
            toastr.error('Não foi possível carregar os dados do usuário');
        }
    } catch (error) {
        toastr.error('Erro ao carregar perfil: ' + error);
    }

    try {
        const respEst = await fetch(`${URL_API_ESTATISTICAS_ADOCAO_USUARIO}?id=${usuarioId}`);
        const estatisticas = await respEst.json();
        preencherEstatisticasUsuario(estatisticas);
    } catch {}

    try {
        const respHist = await fetch(`${URL_API_HISTORICO_ADOCOES_USUARIO}?id=${usuarioId}`);
        const historico = await respHist.json();
        preencherHistoricoAdocoesUsuario(historico, usuarioId);
    } catch {}
}


function renderizarPerfilUsuario(usuario) {
    const nomeModal = document.getElementById('perfilUsuarioNome');
    const emailModal = document.getElementById('perfilUsuarioEmail');
    const inicialModal = document.getElementById('perfilUsuarioInicial');
    const containerFoto = document.querySelector('.perfil-foto-container');
    
    nomeModal.textContent = usuario.nome || 'Nome não disponível';
    emailModal.textContent = usuario.email || 'Email não disponível';
    
    
    const imgAnterior = containerFoto.querySelector('img');
    if (imgAnterior) {
        imgAnterior.remove();
    }
    
    
    if (usuario.fotoPerfil) {
        inicialModal.style.display = 'none';
        const img = document.createElement('img');
        img.src = `/imagens/perfil/${usuario.fotoPerfil}`;
        img.alt = usuario.nome;
        img.className = 'perfil-foto';
        containerFoto.appendChild(img);
    } else {
        inicialModal.style.display = 'flex';
        inicialModal.textContent = usuario.nome ? usuario.nome.charAt(0) : 'U';
    }
    
    
    document.getElementById('nomeCompletoUsuario').textContent = usuario.nome || '-';
    document.getElementById('emailUsuario').textContent = usuario.email || '-';
    document.getElementById('cpfUsuario').textContent = formatarCPF(usuario.cpf);
    document.getElementById('telefoneUsuario').textContent = formatarTelefone(usuario.telefone);
    
    
    if (usuario.dataNascimento) {
        const dataNascimento = new Date(usuario.dataNascimento);
        document.getElementById('dataNascimentoUsuario').textContent = dataNascimento.toLocaleDateString('pt-BR');
        
        
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const m = hoje.getMonth() - dataNascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
            idade--;
        }
        document.getElementById('idadeUsuario').textContent = idade + ' anos';
    } else {
        document.getElementById('dataNascimentoUsuario').textContent = '-';
        document.getElementById('idadeUsuario').textContent = '-';
    }
    
    
    if (usuario.dataCadastro) {
        const dataCadastro = new Date(usuario.dataCadastro);
        document.getElementById('dataCadastroUsuario').textContent = dataCadastro.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('dataCadastroUsuario').textContent = '-';
    }
    
    
    document.getElementById('logradouroUsuario').textContent = usuario.logradouro || '-';
    document.getElementById('numeroUsuario').textContent = usuario.numero || '-';
    document.getElementById('bairroUsuario').textContent = usuario.bairro || '-';
    document.getElementById('complementoUsuario').textContent = usuario.complemento || '-';
    document.getElementById('cepUsuario').textContent = formatarCEP(usuario.cep);
    document.getElementById('cidadeUsuario').textContent = usuario.cidade || '-';
    document.getElementById('estadoUsuario').textContent = usuario.estado || '-';
    
    
    document.getElementById('spinnerPerfilUsuario').style.display = 'none';
    document.getElementById('conteudoPerfilUsuario').style.display = '';
    
    
    const modal = new bootstrap.Modal(document.getElementById('perfilUsuarioModal'));
    modal.show();
}


function preencherEstatisticasUsuario(estatisticas) {
    document.getElementById('estatisticaTotal').textContent = estatisticas.total || 0;
    document.getElementById('estatisticaAprovadas').textContent = estatisticas.aprovadas || 0;
    document.getElementById('estatisticaRejeitadas').textContent = estatisticas.rejeitadas || 0;
    document.getElementById('estatisticaCanceladas').textContent = estatisticas.canceladas || 0;
    document.getElementById('estatisticaExpiradas').textContent = estatisticas.expiradas || 0;
}


function preencherHistoricoAdocoesUsuario(historico, usuarioId) {
    const container = document.getElementById('historicoAdocoesUsuarioContainer');

    container.innerHTML = '';

    if (!historico || historico.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-heart-broken fa-3x text-muted mb-3"></i>
                <p class="mb-0">Este usuário ainda não realizou nenhuma adoção.</p>
            </div>`;
        return;
    }

    const historicoContainer = document.createElement('div');
    historicoContainer.className = 'historico-adocoes-container';

    historico.forEach(function(item) {
        const dataAdocao = new Date(item.dataAdocao).toLocaleDateString('pt-BR');
        
        
        let classeStatus = "";
        switch(item.status.toLowerCase()) {
            case 'aprovado':
            case 'finalizada':
            case 'aguardando buscar':
                classeStatus = "aprovado";
                break;
            case 'rejeitada':
                classeStatus = "rejeitada";
                break;
            case 'cancelada':
                classeStatus = "cancelada";
                break;
            default:
                classeStatus = "pendente";
        }
        
        
        const template = `
            <div class="historico-adocao-item">
                <div class="historico-pet-img-container">
                    ${item.imagemPet ?
                        `<img src="${item.imagemPet}" alt="${item.nomePet}" class="historico-pet-img">` :
                        `<div class="historico-default-img"><i class="fas fa-paw"></i></div>`}
                </div>
                <div class="historico-pet-info">
                    <div class="historico-pet-nome">${item.nomePet || 'Pet não identificado'}</div>
                    <div class="historico-pet-data">
                        <span class="badge ${classeStatus}">${item.status}</span>
                        <span><i class="far fa-calendar-alt me-1"></i>${dataAdocao}</span>
                    </div>
                </div>
                <div class="historico-acoes">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalhes(${item.id}, true)" title="Ver detalhes da adoção">
                        <i class="fas fa-eye me-1"></i> Detalhes
                    </button>
                </div>
            </div>`;

        historicoContainer.insertAdjacentHTML('beforeend', template);
    });

    container.appendChild(historicoContainer);
}


function configurarNavegacaoAbas() {
    const abas = document.querySelectorAll('.detalhes-aba');
    const paineis = document.querySelectorAll('.detalhes-painel');

    abas.forEach(aba => {
        aba.onclick = e => {
            e.preventDefault();
            const painelAlvo = aba.dataset.painel;
            abas.forEach(a => a.classList.remove('ativa'));
            aba.classList.add('ativa');
            paineis.forEach(p => {
                p.classList.remove('ativo');
                p.style.display = 'none';
            });
            const painel = document.getElementById(painelAlvo);
            painel.classList.add('ativo');
            painel.style.display = '';
        };
    });

    if (!document.querySelector('.detalhes-aba.ativa') && abas.length > 0) {
        abas[0].classList.add('ativa');
        paineis.forEach(p => { p.classList.remove('ativo'); p.style.display = 'none'; });
        const primeiroPainel = abas[0].dataset.painel;
        const painel = document.getElementById(primeiroPainel);
        painel.classList.add('ativo');
        painel.style.display = '';
    }

    setTimeout(() => {
        const ativa = document.querySelector('.detalhes-aba.ativa');
        if (ativa) ativa.click();
    }, 50);
}