// 1. Abertura do evento que espera o site carregar
document.addEventListener("DOMContentLoaded", function() {

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

        const numeroLojista = "557183154640"; 
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
                    <button onclick="removerDoCarrinho(${index})" style="position: absolute; right: 0; top: 0; background: none; border: none; color: #ff4c4c; font-size: 16px; font-weight: bold; cursor: pointer; padding: 0; width: auto; box-shadow: none;">X</button>
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

    // 5. Função de Filtrar Produtos
    window.filtrarProdutos = function(categoria) {
        const produtos = document.querySelectorAll('.produto');
        
        produtos.forEach(produto => {
            if (categoria === 'produto') {
                produto.style.display = ''; 
            } else {
                if (produto.classList.contains(categoria)) {
                    produto.style.display = '';
                } else {
                    produto.style.display = 'none';
                }
            }
        });
    };

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
            <span onclick="fecharModalFoto()" style="position: absolute; top: -40px; right: 0; color: #fff; font-size: 30px; font-weight: bold; cursor: pointer;">&times;</span>
            <img id="img-modal-zoom" src="${caminhoImagem}" style="width: 100%; max-height: 80vh; border-radius: 8px; border: 2px solid #D4AF37;">
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

    // --- ORGANIZAR PRODUTOS ESGOTADOS PARA O FINAL ---
    const colunaProdutos = document.querySelector('.coluna-produtos');
    if (colunaProdutos) {
        const produtos = Array.from(colunaProdutos.querySelectorAll('.produto'));
        
        const disponiveis = produtos.filter(p => !p.classList.contains('esgotado'));
        const esgotados = produtos.filter(p => p.classList.contains('esgotado'));
        
        colunaProdutos.innerHTML = '';
        disponiveis.forEach(p => colunaProdutos.appendChild(p));
        esgotados.forEach(p => colunaProdutos.appendChild(p));
    }

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
        }
    };

    window.fecharMenuLateral = function() {
        const menu = document.getElementById('menu-lateral');
        if (menu) {
            menu.style.display = 'none';
        }
    };

    // Fecha o menu lateral se clicar fora da gaveta preta
    window.addEventListener('click', function(event) {
        const menu = document.getElementById('menu-lateral');
        if (event.target === menu) {
            menu.style.display = 'none';
        }
    });

});