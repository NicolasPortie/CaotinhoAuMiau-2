
document.addEventListener('DOMContentLoaded', function() {
    
    configurarLimpezaErrosFormulario();
    configurarToastr();
    inicializarBootstrap();
    inicializarModalColaborador();
    
    
    if (typeof VMasker !== 'undefined') {
        document.querySelectorAll('.mascara-cpf').forEach(el => VMasker(el).maskPattern('999.999.999-99'));
        document.querySelectorAll('.mascara-telefone').forEach(el => VMasker(el).maskPattern('(99) 99999-9999'));
    }
    
    
    preencherDropdownCargos();
    
    
    const btnNovoColaborador = document.getElementById('btnNovoColaborador');
    if (btnNovoColaborador) {
        btnNovoColaborador.addEventListener('click', function() {
            abrirModalColaborador('criar');
        });
    }
    
    
    const btnFiltrar = document.getElementById('btnFiltrarColaboradores');
    if (btnFiltrar) btnFiltrar.addEventListener('click', filtrarColaboradores);
    const btnLimpar = document.getElementById('btnLimparFiltros');
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);
    
    
    const formColaborador = document.getElementById('formularioColaborador');
    if (formColaborador) {
        formColaborador.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validarFormularioColaborador()) {
                enviarFormularioColaborador();
            }
        });
    }
    
    
    const botaoConfirmarDesativar = document.getElementById('botaoConfirmarDesativar');
    if (botaoConfirmarDesativar) botaoConfirmarDesativar.addEventListener('click', async function() {
        const id = document.getElementById('idDesativar').value;
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
        try {
            const response = await fetch(`/Admin/Colaboradores/DesativarColaborador/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.sucesso) {
                mostrarNotificacao(data.mensagem, 'success');
                const modalDesativar = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDesativar'));
                modalDesativar.hide();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                mostrarNotificacao(data.mensagem, 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        }
    });
    const botaoConfirmarExcluir = document.getElementById('botaoConfirmarExcluir');
    if (botaoConfirmarExcluir) botaoConfirmarExcluir.addEventListener('click', async function() {
        const id = document.getElementById('idExcluir').value;
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
        try {
            const response = await fetch(`/Admin/Colaboradores/ExcluirColaborador/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            if (data.sucesso) {
                mostrarNotificacao(data.mensagem, 'success');
                const modalExcluir = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluir'));
                modalExcluir.hide();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                mostrarNotificacao(data.mensagem, 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        }
    });
    
    document.querySelectorAll('.pagination .page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = link.getAttribute('href');
            if (url) {
                window.location.href = url;
            }
        });
    });
});






function configurarLimpezaErrosFormulario() {
    document.querySelectorAll('input, select, textarea').forEach(el => {
        ['input', 'change', 'focus'].forEach(evt => {
            el.addEventListener(evt, () => {
                el.classList.remove('is-invalid');
                const feedback = document.getElementById(el.id + '-erro');
                if (feedback) feedback.textContent = '';
            });
        });
    });

    document.addEventListener('click', function(e) {
        const alvo = e.target.closest('.mensagem-erro');
        if (alvo) {
            alvo.textContent = '';
            const campo = alvo.parentElement.querySelector('input, select, textarea');
            if (campo) campo.classList.remove('is-invalid');
        }
    });
}


function configurarToastr() {
    toastr.options = {
        "closeButton": true,
        "positionClass": "toast-top-right",
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
}


function inicializarBootstrap() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}


function inicializarModalColaborador() {
    const modalEl = document.getElementById('modalColaborador');
    if (!modalEl) return;

    modalEl.addEventListener('show.bs.modal', function() {
        if (typeof VMasker !== 'undefined') {
            modalEl.querySelectorAll('.mascara-cpf').forEach(el => VMasker(el).maskPattern('999.999.999-99'));
            modalEl.querySelectorAll('.mascara-telefone').forEach(el => VMasker(el).maskPattern('(99) 99999-9999'));
        }

        modalEl.querySelectorAll('.form-floating').forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 50);
        });
    });

    modalEl.addEventListener('hidden.bs.modal', function() {
        limparFormularioColaborador();

        modalEl.querySelectorAll('.form-floating').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
        });
    });

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            alternarVisibilidadeSenha(btn.dataset.target);
        });
    });

    const imagemInput = document.getElementById('colaboradorImagem');
    const avatarContainer = document.querySelector('.admin-avatar-container');
    if (imagemInput && avatarContainer) {
        imagemInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();

                avatarContainer.querySelectorAll('img, .success-overlay, .loading-overlay').forEach(el => el.remove());
                const loading = document.createElement('div');
                loading.className = 'loading-overlay';
                loading.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
                avatarContainer.appendChild(loading);

                reader.onload = function(event) {
                    setTimeout(() => {
                        loading.remove();

                        const img = document.createElement('img');
                        img.src = event.target.result;
                        avatarContainer.appendChild(img);

                        const success = document.createElement('div');
                        success.className = 'success-overlay';
                        success.innerHTML = '<i class="bi bi-check-lg"></i>';
                        avatarContainer.appendChild(success);

                        setTimeout(() => {
                            success.remove();
                        }, 1300);
                    }, 500);
                };

                reader.readAsDataURL(file);
            }
        });
    }

    const colaboradorAtivo = document.getElementById('colaboradorAtivo');
    if (colaboradorAtivo) {
        colaboradorAtivo.addEventListener('change', function() {
            const label = colaboradorAtivo.closest('.form-check')?.querySelector('.form-check-label');
            if (!label) return;
            if (colaboradorAtivo.checked) {
                label.textContent = 'Colaborador ativo';
                label.style.color = 'var(--success)';
            } else {
                label.textContent = 'Colaborador inativo';
                label.style.color = '#6c757d';
            }
        });
    }
}






function abrirModalColaborador(modo, id = null) {
    limparFormularioColaborador();
    const modalEl = document.getElementById('modalColaborador');
    const header = modalEl.querySelector('.modal-header');

    header.style.background = '';
    
    switch (modo) {
        case 'criar':
            
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--primary-gradient');
            document.getElementById('tituloModalColaborador').innerHTML = '<i class="fas fa-user-plus me-2 text-white"></i> Novo Colaborador';
            document.getElementById('colaboradorId').value = '0';

            document.getElementById('formularioColaborador').setAttribute('action', '/Admin/Colaboradores/CadastrarColaborador');

            document.getElementById('containerSenhaAtual').style.display = 'none';
            document.getElementById('containerSenha').style.display = '';
            document.getElementById('linhaConfirmarSenha').style.display = '';

            const ativo = document.getElementById('colaboradorAtivo');
            if (ativo) {
                ativo.checked = true;
                ativo.dispatchEvent(new Event('change'));
            }

            habilitarCamposFormulario(true);

            document.querySelectorAll('.botao-modo-edicao').forEach(el => el.style.display = '');
            document.querySelectorAll('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            document.getElementById('botaoSalvarColaborador').innerHTML = '<i class="fas fa-save me-2"></i> Cadastrar';
            break;
            
        case 'editar':
            
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--success-gradient');
            if (!id) {
                console.error('ID do colaborador não fornecido para edição');
                return;
            }
            
            document.getElementById('tituloModalColaborador').innerHTML = '<i class="fas fa-user-edit me-2 text-white"></i> Editar Colaborador';
            document.getElementById('colaboradorId').value = id;

            document.getElementById('formularioColaborador').setAttribute('action', '/Admin/Colaboradores/AtualizarColaborador');

            document.getElementById('containerSenhaAtual').style.display = '';
            document.getElementById('containerSenha').style.display = '';
            document.getElementById('linhaConfirmarSenha').style.display = '';

            habilitarCamposFormulario(true);

            document.querySelectorAll('.botao-modo-edicao').forEach(el => el.style.display = '');
            document.querySelectorAll('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            document.getElementById('botaoSalvarColaborador').innerHTML = '<i class="fas fa-save me-2"></i> Salvar Alterações';
            
            
            carregarDadosColaborador(id);
            break;
            
        case 'visualizar':
            
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--accent-gradient');
            if (!id) {
                console.error('ID do colaborador não fornecido para visualização');
                return;
            }
            
            document.getElementById('tituloModalColaborador').innerHTML = '<i class="fas fa-eye me-2 text-white"></i> Detalhes do Colaborador';
            document.getElementById('colaboradorId').value = id;

            document.getElementById('containerSenhaAtual').style.display = 'none';
            document.getElementById('containerSenha').style.display = 'none';
            document.getElementById('linhaConfirmarSenha').style.display = 'none';

            habilitarCamposFormulario(false);

            document.querySelectorAll('.botao-modo-edicao').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            
            
            carregarDadosColaborador(id);
            break;
            
        default:
            console.error('Modo inválido para o modal de colaborador');
            return;
    }
    
    
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}


function habilitarCamposFormulario(habilitar) {
    document.querySelectorAll('#formularioColaborador input, #formularioColaborador select, #formularioColaborador textarea').forEach(campo => {
        campo.readOnly = !habilitar;
        campo.disabled = !habilitar;
    });

    if (habilitar && document.getElementById('colaboradorId').value !== '0') {
        const email = document.getElementById('colaboradorEmail');
        if (email) email.readOnly = true;
    }
}


async function carregarDadosColaborador(id) {
    try {
        
        const response = await fetch(`/Admin/Colaboradores/ObterColaborador/${id}`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.sucesso) {
            
            const colaborador = data.dados;

            document.getElementById('nomeColaborador').value = colaborador.nome;
            document.getElementById('emailColaborador').value = colaborador.email;
            const cpfInput = document.getElementById('cpfColaborador');
            cpfInput.value = colaborador.cpf;
            cpfInput.dispatchEvent(new Event('input'));
            const telInput = document.getElementById('telefoneColaborador');
            telInput.value = colaborador.telefone;
            telInput.dispatchEvent(new Event('input'));
            document.getElementById('cargoColaborador').value = colaborador.cargo;
            const ativo = document.getElementById('colaboradorAtivo');
            if (ativo) {
                ativo.checked = colaborador.ativo;
                ativo.dispatchEvent(new Event('change'));
            }

            if (colaborador.imagemUrl) {
                const avatarContainer = document.querySelector('.admin-avatar-container');
                if (avatarContainer) {
                    avatarContainer.querySelectorAll('img').forEach(el => el.remove());
                    const img = document.createElement('img');
                    img.src = colaborador.imagemUrl;
                    avatarContainer.appendChild(img);
                }
            }
        } else {
            console.error("Erro ao obter dados:", data.mensagem || "Erro desconhecido");
            mostrarNotificacao(`Erro ao carregar dados: ${data.mensagem || 'Erro desconhecido'}`, 'error');
        }
    } catch (error) {
        console.error("Erro ao carregar dados do colaborador:", error);
        mostrarNotificacao(`Erro ao carregar dados: ${error.message}`, 'error');
    }
}


function limparFormularioColaborador() {
    const form = document.getElementById('formularioColaborador');
    if (form) form.reset();

    document.querySelectorAll('#formularioColaborador input, #formularioColaborador select, #formularioColaborador textarea').forEach(el => {
        el.classList.remove('is-valid', 'is-invalid');
    });
    document.querySelectorAll('.mensagem-erro').forEach(el => { el.textContent = ''; el.style.display = 'none'; });

    const avatarContainer = document.querySelector('.admin-avatar-container');
    if (avatarContainer) avatarContainer.querySelectorAll('img, .success-overlay, .loading-overlay').forEach(el => el.remove());
}


function alternarVisibilidadeSenha(targetId) {
    const input = document.getElementById(targetId);
    const toggleBtn = document.querySelector('button[data-target="' + targetId + '"]');
    if (!input || !toggleBtn) return;

    input.type = input.type === 'password' ? 'text' : 'password';

    const icon = toggleBtn.querySelector('i');
    if (icon) icon.classList.toggle('bi-eye');
    if (icon) icon.classList.toggle('bi-eye-slash');

    toggleBtn.classList.add('btn-clicked');
    setTimeout(() => toggleBtn.classList.remove('btn-clicked'), 200);
}






function validarFormularioColaborador() {
    let formValido = true;
    const camposObrigatorios = [
        {id: 'nomeColaborador', min: 3, mensagem: 'O nome deve ter pelo menos 3 caracteres'},
        {id: 'emailColaborador', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensagem: 'Digite um email válido'},
        {id: 'cpfColaborador', mensagem: 'CPF inválido'},
        {id: 'telefoneColaborador', mensagem: 'Telefone inválido'},
        {id: 'cargoColaborador', mensagem: 'Selecione um cargo'}
    ];
    
    
    const isCriacao = document.getElementById('colaboradorId').value === '0';
    
    
    if (isCriacao) {
        camposObrigatorios.push(
            {id: 'senhaColaborador', min: 6, mensagem: 'A senha deve ter pelo menos 6 caracteres'}
        );
    }
    
    
    camposObrigatorios.forEach(campo => {
        const campoEl = document.getElementById(campo.id);
        if (!campoEl) {
            console.warn(`Campo de validação '${campo.id}' não encontrado, pulando.`);
            return;
        }
        let valido = true;

        if (campoEl.offsetParent === null) {
            return;
        }

        const valor = campoEl.value != null ? campoEl.value.toString() : '';
        if (campo.min && valor.trim().length < campo.min) {
            valido = false;
        }
        
        if (campo.regex && !campo.regex.test(valor.trim())) {
            valido = false;
        }
        
        if (campo.id === 'cpfColaborador') {
            const cpfDigitos = removerMascara(valor);
            if (cpfDigitos.length !== 11) {
                valido = false;
            }
        }
        
        if (campo.id === 'telefoneColaborador' && valor) {
            const telefone = removerMascara(valor);
            valido = telefone.length >= 10;
        }
        
        
        if (campo.id === 'senhaColaborador' && isCriacao) {
            const senha = valor;
            const confirmarSenha = document.getElementById('confirmarSenhaColaborador').value;
            
            if (senha !== confirmarSenha) {
                const conf = document.getElementById('confirmarSenhaColaborador');
                conf.classList.add('is-invalid');
                const erro = document.getElementById('confirmarSenhaColaborador-erro');
                if (erro) { erro.textContent = 'As senhas não coincidem'; erro.style.display = 'block'; }
                formValido = false;
            } else {
                const conf = document.getElementById('confirmarSenhaColaborador');
                conf.classList.remove('is-invalid');
                const erro = document.getElementById('confirmarSenhaColaborador-erro');
                if (erro) { erro.textContent = ''; erro.style.display = 'none'; }
            }
        }

        if (!valido) {
            campoEl.classList.add('is-invalid');
            const erroEl = document.getElementById(campo.id + '-erro');
            if (erroEl) { erroEl.textContent = campo.mensagem; erroEl.style.display = 'block'; }
            formValido = false;
        } else {
            campoEl.classList.remove('is-invalid');
            const erroEl = document.getElementById(campo.id + '-erro');
            if (erroEl) { erroEl.textContent = ''; erroEl.style.display = 'none'; }
        }
    });
    
    return formValido;
}

function removerMascara(valor) {
    return valor.replace(/[^\d]/g, '');
}

async function enviarFormularioColaborador() {
    try {
        const form = document.getElementById('formularioColaborador');

        const cpfInput = document.getElementById('cpfColaborador');
        if (cpfInput) {
            cpfInput.value = removerMascara(cpfInput.value);
        }
        const telInput = document.getElementById('telefoneColaborador');
        if (telInput) {
            telInput.value = removerMascara(telInput.value);
        }
        const formData = new FormData(form);
        const url = form.getAttribute('action');
        const btnSalvar = document.getElementById('botaoSalvarColaborador');

        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Salvando...';
        btnSalvar.disabled = true;
        
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();

        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;

        if (data.sucesso) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalColaborador')).hide();
            mostrarNotificacao(data.mensagem || 'Operação realizada com sucesso!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            mostrarNotificacao(data.mensagem || 'Ocorreu um erro ao processar a solicitação', 'error');

            if (data.erros) {
                Object.keys(data.erros).forEach(campo => {
                    const campoEl = document.getElementById(campo);
                    const mensagem = data.erros[campo];
                    if (campoEl) {
                        campoEl.classList.add('is-invalid');
                        const erro = document.getElementById(campo + '-erro');
                        if (erro) { erro.textContent = mensagem; erro.style.display = 'block'; }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Erro ao enviar formulário:", error);
        mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        const btnSalvar = document.getElementById('botaoSalvarColaborador');
        if (btnSalvar) {
            btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i>Salvar';
            btnSalvar.disabled = false;
        }
    }
}






function visualizarDetalhesColaborador(id) {
    abrirModalColaborador('visualizar', id);
}


function editarColaborador(id) {
    abrirModalColaborador('editar', id);
}


function confirmarDesativacaoColaborador(id) {
    Swal.fire({
        title: 'Confirmar desativação',
        text: 'Deseja realmente desativar este colaborador?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, desativar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            alterarStatusColaborador(id, false);
        }
    });
}


let statusAction = '';

function abrirModalStatus(id, nome, acao) {
    const modalEl = document.getElementById('modalStatus');
    modalEl.dataset.action = acao;
    statusAction = acao;
    document.getElementById('idStatus').value = id;
    document.getElementById('nomeColaboradorStatus').textContent = nome;

    const header = modalEl.querySelector('.modal-header');
    const titleIcon = modalEl.querySelector('.modal-title i');
    const titleText = modalEl.querySelector('#tituloStatus');
    const confirmBtn = document.getElementById('botaoConfirmarStatus');

    if (acao === 'ativar') {
        header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--success-gradient');
        if (titleIcon) titleIcon.setAttribute('class', 'fas fa-user-check me-2');
        if (titleText) titleText.textContent = 'Confirmar Ativação';
        if (confirmBtn) {
            confirmBtn.setAttribute('class', 'botao-primario');
            confirmBtn.innerHTML = '<i class="fas fa-user-check me-2"></i>Ativar';
        }
    } else {
        header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--danger-gradient');
        if (titleIcon) titleIcon.setAttribute('class', 'fas fa-user-slash me-2');
        if (titleText) titleText.textContent = 'Confirmar Status';
        if (confirmBtn) {
            confirmBtn.setAttribute('class', 'botao-perigo');
            confirmBtn.innerHTML = '<i class="fas fa-user-slash me-2"></i>Inativar';
        }
    }
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}


document.addEventListener('click', async function(e) {
    if (!e.target.closest('#botaoConfirmarStatus')) return;
    const id = document.getElementById('idStatus').value;
    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
    const url = statusAction === 'ativar'
        ? `/Admin/Colaboradores/AtivarColaborador/${id}`
        : `/Admin/Colaboradores/DesativarColaborador/${id}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token
            }
        });
        const data = await response.json();
        if (data.sucesso) {
            mostrarNotificacao(data.mensagem, 'success');
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalStatus')).hide();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            mostrarNotificacao(data.mensagem, 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarNotificacao('Erro na comunicação com o servidor', 'error');
    }
});






function filtrarColaboradores() {
    const filtroNome = document.getElementById('filtroNome').value.trim();
    const filtroCargo = document.getElementById('filtroCargo').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    
    
    let url = '/Admin/Colaboradores?';
    
    if (filtroNome) {
        url += `nome=${encodeURIComponent(filtroNome)}&`;
    }
    
    if (filtroCargo) {
        url += `cargo=${encodeURIComponent(filtroCargo)}&`;
    }
    
    if (filtroStatus) {
        url += `status=${encodeURIComponent(filtroStatus)}&`;
    }
    
    
    window.location.href = url.slice(0, -1); 
}


function limparFiltros() {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroCargo').value = '';
    document.getElementById('filtroStatus').value = '';
    
    window.location.href = '/Admin/Colaboradores';
}


function preencherDropdownCargos() {
    try {
        const dropdownCargo = document.getElementById('colaboradorCargo');
        const filtroDropdownCargo = document.getElementById('filtroCargo');

        if (!dropdownCargo && !filtroDropdownCargo) {
            return;
        }

        fetch('/Admin/Colaboradores/ObterCargos')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.sucesso) {
                    const cargos = data.dados;

                    if (dropdownCargo) {
                        dropdownCargo.innerHTML = '<option value="">Selecione um cargo</option>';
                        cargos.forEach(cargo => {
                            const option = document.createElement('option');
                            option.value = cargo.id;
                            option.textContent = cargo.nome;
                            dropdownCargo.appendChild(option);
                        });
                    }

                    if (filtroDropdownCargo) {
                        const valorAtual = filtroDropdownCargo.value;
                        filtroDropdownCargo.innerHTML = '<option value="">Todos os cargos</option>';
                        cargos.forEach(cargo => {
                            const opt = document.createElement('option');
                            opt.value = cargo.id;
                            opt.textContent = cargo.nome;
                            filtroDropdownCargo.appendChild(opt);
                        });
                        if (valorAtual) {
                            filtroDropdownCargo.value = valorAtual;
                        }
                    }
                } else {
                    console.error("Erro ao obter cargos:", data.mensagem || "Erro desconhecido");
                }
            })
            .catch(error => {
                console.error("Erro ao carregar cargos:", error);
            });
    } catch (error) {
        console.error("Erro ao preencher dropdown de cargos:", error);
    }
}






function mostrarNotificacao(mensagem, tipo = 'success') {
    
    const existingNotificacao = document.querySelector('.notificacao');
    if (existingNotificacao) {
        existingNotificacao.remove();
    }
    
    
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    
    let icone = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle';
    let titulo = tipo === 'success' ? 'Sucesso!' : 'Erro';
    
    
    notificacao.innerHTML = `
        <div class="notificacao-icone">
            <i class="bi ${icone}"></i>
        </div>
        <div class="notificacao-conteudo">
            <h5 class="mb-0 fw-bold">${titulo}</h5>
            <p>${mensagem}</p>
        </div>
        <button class="notificacao-fechar">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    document.body.appendChild(notificacao);
    
    
    setTimeout(() => {
        notificacao.classList.add('notificacao-show');
    }, 10);
    
    
    const closeBtn = notificacao.querySelector('.notificacao-fechar');
    closeBtn.addEventListener('click', function() {
        notificacao.classList.remove('notificacao-show');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    });
    
    
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.classList.remove('notificacao-show');
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.remove();
                }
            }, 300);
        }
    }, 5000);
}


function formatarData(dataStr) {
    if (!dataStr) return '';
    
        const data = new Date(dataStr);
    
    if (isNaN(data.getTime())) {
        return '';
    }
    
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        year: 'numeric'
        });
}


function abrirModalDesativar(id, nome) {
    document.getElementById('idDesativar').value = id;
    document.getElementById('nomeColaboradorDesativacao').textContent = nome;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDesativar')).show();
}

function abrirModalExcluir(id, nome) {
    document.getElementById('idExcluir').value = id;
    document.getElementById('nomeColaboradorExclusao').textContent = nome;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluir')).show();
}

