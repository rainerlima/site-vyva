// 1. Abertura do evento que espera o site carregar
document.addEventListener("DOMContentLoaded", function() {

    requestAnimationFrame(() => document.body.classList.add('site-pronto'));

    const botaoVoltarAoTopo = document.getElementById('voltar-ao-topo');
    const atualizarBotaoTopo = () => {
        botaoVoltarAoTopo?.classList.toggle('visivel', window.scrollY > 700);
    };

    window.addEventListener('scroll', atualizarBotaoTopo, { passive: true });
    botaoVoltarAoTopo?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    atualizarBotaoTopo();

    // Melhora o carregamento e a acessibilidade do catálogo.
    document.querySelectorAll('.produto img').forEach((imagem) => {
        imagem.loading = 'lazy';
        imagem.decoding = 'async';
        imagem.setAttribute('role', 'button');
        imagem.tabIndex = 0;
        imagem.setAttribute('aria-label', `Ampliar foto de ${imagem.alt || 'produto'}`);
        imagem.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                imagem.click();
            }
        });
    });

    document.querySelectorAll('.produto').forEach((produto) => {
        const nome = produto.querySelector('h3')?.textContent.trim() || 'produto';
        produto.dataset.nome = nome;
        produto.querySelectorAll('select').forEach((seletor, indice) => {
            if (!seletor.getAttribute('aria-label')) {
                seletor.setAttribute('aria-label', `${indice === 0 ? 'Cor' : 'Tamanho'} de ${nome}`);
            }
        });
    });

    const estadoCatalogo = {
        categoria: 'produto',
        busca: '',
        ordenacao: 'original',
        pagina: 1,
        itensPorPagina: 12
    };

    const produtosCatalogo = Array.from(document.querySelectorAll('.produto'));
    produtosCatalogo.forEach((produto, indice) => {
        produto.dataset.ordemOriginal = indice;
        produto.classList.add('revelar-produto');
    });

    const observadorProdutos = 'IntersectionObserver' in window
        ? new IntersectionObserver((entradas, observador) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('produto-visivel');
                    observador.unobserve(entrada.target);
                }
            });
        }, { rootMargin: '80px 0px', threshold: 0.08 })
        : null;

    produtosCatalogo.forEach((produto) => {
        if (observadorProdutos) observadorProdutos.observe(produto);
        else produto.classList.add('produto-visivel');
    });

    // 2. A Memória do Carrinho (com localStorage)
    let carrinho = JSON.parse(localStorage.getItem('carrinho_vyva')) || [];

    function salvarCarrinho() {
        localStorage.setItem('carrinho_vyva', JSON.stringify(carrinho));
    }
    
    // --- FUNÇÃO DE ATUALIZAÇÃO DO BOTÃO ---
    function atualizarBotaoFlutuante() {
        const btn = document.getElementById('btn-flutuante-carrinho');
        const spanQtd = document.getElementById('qtd-itens');
        const spanTotal = document.getElementById('valor-total');
        
        const quantidade = carrinho.length;
        const total = carrinho.reduce((soma, item) => soma + item.valor, 0);

        if (quantidade > 0 && btn) {
            btn.style.display = 'block';
            if (spanQtd) spanQtd.innerText = quantidade;
            if (spanTotal) spanTotal.innerText = total.toFixed(2).replace('.', ',');
        } else if (btn) {
            btn.style.display = 'none';
        }
    }

    // 3. Transformamos suas funções em globais usando "window."
    window.adicionarAoCarrinho = function(nome, preco, idCor, idTamanho) {
        const seletorCor = document.getElementById(idCor);
        const corEscolhida = seletorCor.options[seletorCor.selectedIndex].text;
        
        const tamanhoEscolhido = document.getElementById(idTamanho).value;

        carrinho.push({
            nomeItem: nome,
            valor: preco,
            cor: corEscolhida,
            tamanho: tamanhoEscolhido,
            quantidade: 1
        });

        salvarCarrinho();
        atualizarTelaDoCarrinho();
        atualizarBotaoFlutuante();

        const botaoAdicionar = document.activeElement?.classList.contains('btn-add')
            ? document.activeElement
            : null;
        if (botaoAdicionar) {
            const textoOriginal = botaoAdicionar.textContent.trim();
            botaoAdicionar.textContent = 'Adicionado ✓';
            botaoAdicionar.classList.add('item-adicionado');
            window.setTimeout(() => {
                botaoAdicionar.textContent = textoOriginal;
                botaoAdicionar.classList.remove('item-adicionado');
            }, 1200);
        }

        const carrinhoFlutuante = document.getElementById('btn-flutuante-carrinho');
        if (carrinhoFlutuante) {
            carrinhoFlutuante.classList.remove('carrinho-pulsar');
            requestAnimationFrame(() => carrinhoFlutuante.classList.add('carrinho-pulsar'));
        }
    };

    window.removerDoCarrinho = function(index) {
        carrinho.splice(index, 1);
        salvarCarrinho();
        atualizarTelaDoCarrinho();
        atualizarBotaoFlutuante();
    };

    window.mudarFoto = function(idDaImagem, novoCaminho) {
        document.getElementById(idDaImagem).src = novoCaminho;
    };

    window.enviarParaWhatsApp = function() {
        if (carrinho.length === 0) {
            alert("Seu carrinho está vazio! Escolha algumas peças da VYVA primeiro.");
            return;
        }

        const nome = document.getElementById('cliente-nome').value;
        const zap = document.getElementById('cliente-zap').value;
        const endereco = document.getElementById('cliente-endereco').value;
        const pagamento = document.getElementById('forma-pagamento').value;

        if (!nome.trim() || !zap.trim() || !endereco.trim()) {
            alert('Preencha nome, WhatsApp e endereço para finalizar o pedido.');
            const primeiroVazio = [
                document.getElementById('cliente-nome'),
                document.getElementById('cliente-zap'),
                document.getElementById('cliente-endereco')
            ].find(campo => !campo.value.trim());
            primeiroVazio?.focus();
            return;
        }

        let textoItens = "";
        let valorTotal = 0;

        carrinho.forEach(peca => {
            textoItens += `* ${peca.nomeItem} x1 — R$ ${peca.valor.toFixed(2).replace('.', ',')}\n`;
            textoItens += `   ↳ Cor: ${peca.cor}\n`;
            textoItens += `   ↳ Tamanho: ${peca.tamanho}\n\n`;
            valorTotal += peca.valor;
        });

        let infoParcelamento = "";
        if (valorTotal >= 500) {
            infoParcelamento = `Opção de crédito: Até 5x de R$ ${(valorTotal / 5).toFixed(2).replace('.', ',')} sem juros`;
        } else if (valorTotal >= 200) {
            infoParcelamento = `Opção de crédito: Até 2x de R$ ${(valorTotal / 2).toFixed(2).replace('.', ',')} sem juros`;
        } else {
            infoParcelamento = `Parcelamento em cartão disponível a partir de R$ 200`;
        }

        const mensagem = `*Pedido via Catálogo VYVA*\n\n` +
            `Nome: ${nome}\n` +
            `WhatsApp: ${zap}\n` +
            `Endereço: ${endereco}\n\n` +
            `💳 Forma de pagamento: ${pagamento}\n\n` +
            `*Itens do pedido:*\n${textoItens}` +
            `💰 *Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}* + frete a combinar\n` +
            `💳 *${infoParcelamento}*\n\n` +
            `💚 *Pagamento via PIX:*\n` +
            `Tipo: Celular\n` +
            `Chave: 71999924448\n` +
            `Recebedor: Yasmin Vitória Oliveira Carvalho`;

        const numeroLojista = "5571983154640";
        const urlWhatsApp = `https://wa.me/${numeroLojista}?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWhatsApp, '_blank');
    };

    // 4. Função interna do carrinho
    function atualizarTelaDoCarrinho() {
        const divItens = document.getElementById('itens-do-carrinho');
        const spanTotal = document.getElementById('valor-total-tela');

        if (!divItens) return;

        divItens.innerHTML = "";
        let valorTotal = 0;

        if (carrinho.length === 0) {
            divItens.innerHTML = '<p style="color: #888; font-size: 14px;">Seu carrinho está vazio.</p>';
            if (spanTotal) spanTotal.innerText = "0,00";
            return;
        }

        carrinho.forEach((peca, index) => {
            const bloquinhoDoItem = `
                <div style="border-bottom: 1px dashed #D4AF37; margin-bottom: 10px; padding-bottom: 10px; position: relative;">
                    <button onclick="removerDoCarrinho(${index})" aria-label="Remover ${peca.nomeItem} do carrinho" style="position: absolute; right: 0; top: 0; background: none; border: none; color: #ff4c4c; font-size: 16px; font-weight: bold; cursor: pointer; padding: 0; width: auto; box-shadow: none;">X</button>
                    <p style="margin: 0; font-weight: bold; color: #D4AF37;">1x ${peca.nomeItem}</p>
                    <p style="margin: 0; font-size: 12px; color: #b08d28;">Cor: ${peca.cor} | Tamanho: ${peca.tamanho}</p>
                    <p style="margin: 0; color: #f2ce63;">R$ ${peca.valor.toFixed(2).replace('.', ',')}</p>
                </div>
            `;
            divItens.innerHTML += bloquinhoDoItem;
            valorTotal += peca.valor;
        });

        if (spanTotal) spanTotal.innerText = valorTotal.toFixed(2).replace('.', ',');

        let textoParcelamento = "";
        if (valorTotal >= 500) {
            textoParcelamento = `Em até 5x de R$ ${(valorTotal / 5).toFixed(2).replace('.', ',')} sem juros`;
        } else if (valorTotal >= 200) {
            textoParcelamento = `Em até 2x de R$ ${(valorTotal / 2).toFixed(2).replace('.', ',')} sem juros`;
        } else {
            textoParcelamento = `Parcelamento no cartão a partir de R$ 200`;
        }

        divItens.innerHTML += `<p style="margin-top: 15px; font-size: 14px; color: #b08d28; font-weight: bold;">💳 ${textoParcelamento}</p>`;
    }

    // 5. Busca, filtros e ordenação do catálogo
    const normalizarTexto = (texto) => texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const obterPreco = (produto) => {
        const texto = produto.querySelector('.preco')?.textContent || '0';
        return Number(texto.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    };

    function renderizarPaginacao(totalPaginas) {
        const paginacao = document.getElementById('paginacao-produtos');
        if (!paginacao) return;

        if (totalPaginas <= 1) {
            paginacao.innerHTML = '';
            paginacao.hidden = true;
            return;
        }

        paginacao.hidden = false;
        const botoesNumericos = Array.from({ length: totalPaginas }, (_, indice) => {
            const pagina = indice + 1;
            const atual = pagina === estadoCatalogo.pagina;
            return `<button type="button" class="pagina-botao${atual ? ' atual' : ''}" data-pagina="${pagina}" ${atual ? 'aria-current="page"' : ''} aria-label="Ir para a página ${pagina}">${pagina}</button>`;
        }).join('');

        paginacao.innerHTML = `
            <button type="button" class="pagina-botao pagina-seta" data-pagina="${estadoCatalogo.pagina - 1}" aria-label="Página anterior" ${estadoCatalogo.pagina === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left" aria-hidden="true"></i>
            </button>
            ${botoesNumericos}
            <button type="button" class="pagina-botao pagina-seta" data-pagina="${estadoCatalogo.pagina + 1}" aria-label="Próxima página" ${estadoCatalogo.pagina === totalPaginas ? 'disabled' : ''}>
                <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </button>
        `;

        paginacao.querySelectorAll('.pagina-botao:not(:disabled)').forEach((botao) => {
            botao.addEventListener('click', () => {
                estadoCatalogo.pagina = Number(botao.dataset.pagina);
                aplicarFiltrosCatalogo();
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function aplicarFiltrosCatalogo() {
        const coluna = document.querySelector('.coluna-produtos');
        const termo = normalizarTexto(estadoCatalogo.busca);

        const ordenados = [...produtosCatalogo].sort((a, b) => {
            const diferencaEstoque = Number(a.classList.contains('esgotado')) - Number(b.classList.contains('esgotado'));
            if (diferencaEstoque !== 0) return diferencaEstoque;
            if (estadoCatalogo.ordenacao === 'menor-preco') return obterPreco(a) - obterPreco(b);
            if (estadoCatalogo.ordenacao === 'maior-preco') return obterPreco(b) - obterPreco(a);
            if (estadoCatalogo.ordenacao === 'nome') {
                return a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR');
            }
            return Number(a.dataset.ordemOriginal) - Number(b.dataset.ordemOriginal);
        });

        const correspondentes = ordenados.filter((produto) => {
            const correspondeCategoria = estadoCatalogo.categoria === 'produto' || produto.classList.contains(estadoCatalogo.categoria);
            const correspondeBusca = !termo || normalizarTexto(produto.textContent).includes(termo);
            return correspondeCategoria && correspondeBusca;
        });

        const totalPaginas = Math.max(1, Math.ceil(correspondentes.length / estadoCatalogo.itensPorPagina));
        estadoCatalogo.pagina = Math.min(Math.max(1, estadoCatalogo.pagina), totalPaginas);
        const inicio = (estadoCatalogo.pagina - 1) * estadoCatalogo.itensPorPagina;
        const produtosDaPagina = new Set(correspondentes.slice(inicio, inicio + estadoCatalogo.itensPorPagina));
        const paginacao = document.getElementById('paginacao-produtos');

        ordenados.forEach((produto) => {
            const visivel = produtosDaPagina.has(produto);
            produto.hidden = !visivel;
            produto.style.display = visivel ? '' : 'none';
            if (visivel) {
                produto.classList.remove('filtro-entrada');
                requestAnimationFrame(() => produto.classList.add('filtro-entrada'));
            }
            coluna.insertBefore(produto, paginacao);
        });

        renderizarPaginacao(correspondentes.length ? totalPaginas : 0);

        document.querySelectorAll('.chip-filtro[data-categoria]').forEach((botao) => {
            const ativo = botao.dataset.categoria === estadoCatalogo.categoria;
            botao.classList.toggle('ativo', ativo);
            botao.setAttribute('aria-pressed', String(ativo));
        });

        const resultado = document.getElementById('resultado-produtos');
        if (resultado) {
            const quantidade = correspondentes.length;
            const textoQuantidade = quantidade === 1 ? '1 peça encontrada' : `${quantidade} peças encontradas`;
            resultado.textContent = quantidade && totalPaginas > 1
                ? `${textoQuantidade} • Página ${estadoCatalogo.pagina} de ${totalPaginas}`
                : textoQuantidade;
        }
    }

    window.filtrarProdutos = function(categoria) {
        estadoCatalogo.categoria = categoria;
        estadoCatalogo.pagina = 1;
        aplicarFiltrosCatalogo();
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.querySelectorAll('.chip-filtro[data-categoria]').forEach((botao) => {
        botao.addEventListener('click', () => window.filtrarProdutos(botao.dataset.categoria));
    });

    document.getElementById('busca-produtos')?.addEventListener('input', (evento) => {
        estadoCatalogo.busca = evento.target.value;
        estadoCatalogo.pagina = 1;
        aplicarFiltrosCatalogo();
    });

    document.getElementById('ordenar-produtos')?.addEventListener('change', (evento) => {
        estadoCatalogo.ordenacao = evento.target.value;
        estadoCatalogo.pagina = 1;
        aplicarFiltrosCatalogo();
    });

    aplicarFiltrosCatalogo();

    // Função para levar o cliente até a área do carrinho
    window.abrirCarrinhoMobile = function() {
        const areaCarrinho = document.querySelector('.carrinho-area');
        if (areaCarrinho) areaCarrinho.scrollIntoView({ behavior: 'smooth' });
    };

    // --- DETALHES ORGANIZADOS POR ELEMENTO ---
    window.abrirDetalhesDoElemento = function(botao) {
        const conteudoOculto = botao.nextElementSibling.innerHTML;
        const modalInfo = document.getElementById('modal-info');
        const modalDetalhes = document.getElementById('modal-detalhes');
        
        if (modalInfo) modalInfo.innerHTML = conteudoOculto;
        if (modalDetalhes) modalDetalhes.style.display = 'block';
    };

    window.fecharModal = function() {
        const modalDetalhes = document.getElementById('modal-detalhes');
        if (modalDetalhes) modalDetalhes.style.display = 'none';
    };

    // --- MODAL DE ZOOM DA FOTO ---
    window.abrirModalFoto = function(caminhoImagem) {
        const modal = document.getElementById('modal-foto');
        const modalContent = modal.querySelector('div');
        
        // Restaura a estrutura original caso tenha sido alterada por um vídeo antes
        modalContent.innerHTML = `
            <button type="button" onclick="fecharModalFoto()" aria-label="Fechar imagem ampliada" style="position: absolute; top: -46px; right: 0; color: #fff; background: transparent; font-size: 30px; cursor: pointer; width:44px; padding:0;">&times;</button>
            <img id="img-modal-zoom" src="${caminhoImagem}" alt="Imagem ampliada do produto" style="width: 100%; max-height: 80vh; border-radius: 8px; border: 2px solid #D4AF37;">
        `;
        
        modal.style.display = 'flex';
        document.body.classList.add('modal-ativo');
    };

    window.fecharModalFoto = function() {
        const modal = document.getElementById('modal-foto');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-ativo');
        }
    };

    // Fecha o modal de zoom se clicar fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-foto');
        if (event.target === modal) {
            window.fecharModalFoto();
        }
    });

    // Chamada inicial para carregar o localStorage salvo na tela
    atualizarTelaDoCarrinho();
    atualizarBotaoFlutuante();

    // --- MODAL DE VÍDEO ---
    window.abrirModalVideo = function(caminhoVideo) {
        const modal = document.getElementById('modal-foto');
        const modalContent = modal.querySelector('div');
        
        modalContent.innerHTML = `
            <span onclick="fecharModalFoto()" style="position: absolute; top: -40px; right: 0; color: #fff; font-size: 30px; font-weight: bold; cursor: pointer; z-index: 10000;">&times;</span>
            <video src="${caminhoVideo}" controls autoplay style="width: 100%; max-height: 80vh; border-radius: 8px; border: 2px solid #D4AF37;"></video>
        `;
        
        modal.style.display = 'flex';
        document.body.classList.add('modal-ativo');
    };

    // --- FUNÇÕES DO GUIA DE MEDIDAS ---
    window.abrirGuiaMedidas = function() {
        const modal = document.getElementById('modal-guia-medidas');
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    window.fecharGuiaMedidas = function() {
        const modal = document.getElementById('modal-guia-medidas');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Fecha o modal do guia ao clicar fora da caixinha
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('modal-guia-medidas');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- FUNÇÕES DO MENU LATERAL (HAMBÚRGUER) ---
    window.abrirMenuLateral = function() {
        const menu = document.getElementById('menu-lateral');
        if (menu) {
            menu.style.display = 'flex';
            document.querySelector('.btn-hamburguer')?.setAttribute('aria-expanded', 'true');
        }
    };

    window.fecharMenuLateral = function() {
        const menu = document.getElementById('menu-lateral');
        if (menu) {
            menu.style.display = 'none';
            document.querySelector('.btn-hamburguer')?.setAttribute('aria-expanded', 'false');
        }
    };

    // Fecha o menu lateral se clicar fora da gaveta preta
    window.addEventListener('click', function(event) {
        const menu = document.getElementById('menu-lateral');
        if (event.target === menu) {
            menu.style.display = 'none';
        }
    });

    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            window.fecharModalFoto();
            window.fecharModal();
            window.fecharGuiaMedidas();
            window.fecharMenuLateral();
        }
    });

});
