// === Utilidade: formata data/hora pt-BR no fuso de São Paulo =================
function formatarDataHoraBR(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(date).replace(",", "");
}

// ======= Roteamento de número por dia (America/Sao_Paulo) =======
function getDiaSaoPaulo() {
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short'
  }).format(new Date());
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wd); // 0=Dom ... 6=Sáb
}

// Configure aqui os números (sem mexer no resto do fluxo)
const NUMERO_SEG_SEX = '5511937143006'; // Segunda a Sexta
const NUMERO_SAB_DOM = '5511968408559'; // Sábado e Domingo

function getNumeroDestino() {
  const d = getDiaSaoPaulo();
  return (d === 0 || d === 6) ? NUMERO_SAB_DOM : NUMERO_SEG_SEX;
}

// Helper: data (e hora) no fuso de São Paulo
function dataHojeBR() {
  const agora = new Date();
  const opcoesData = { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" };
  const opcoesHora = { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" };
  const data = new Intl.DateTimeFormat("pt-BR", opcoesData).format(agora);
  const hora = new Intl.DateTimeFormat("pt-BR", opcoesHora).format(agora);
  return `${data} ${hora}`;
}

// === Carimbo: gera e fixa data/hora do pedido (uma vez) ======================
function carimbarDataDoPedido(force = false) {
  if (!window.pedidoTimestamp || force) {
    window.pedidoTimestamp = new Date();
    const iso = window.pedidoTimestamp.toISOString();

    // salva a versão ISO no campo oculto
    const hidden = document.getElementById("timestampPedido");
    if (hidden) hidden.value = iso;

    // mostra no parágrafo acima do formulário
    const alvo = document.getElementById("dataPedido");
    if (alvo) {
      alvo.textContent = "Data do pedido: " + formatarDataHoraBR(window.pedidoTimestamp);
    }

    // se existir <span id="resumoData"> no resumo, atualiza também
    const spanResumo = document.getElementById("resumoData");
    if (spanResumo) spanResumo.textContent = formatarDataHoraBR(window.pedidoTimestamp);
  }
  return window.pedidoTimestamp;
}

// ===================== PREÇOS (use ponto para decimais) =====================
const prices = {
  // Cana
  caldo_de_cana: 100.00,
  palitinho_c_50: 35.00,
  palitinho_classico: 8.10,
  palitinho_morango: 8.10,
  palitinho_maracuja: 8.10,
  palitinho_abacaxi: 8.10,
  palitinho_manga: 8.10,
  palitinho_limao: 8.10,
  melaco_de_cana: 9.80,
  rapadura: 17.00,

  // Polpas
  polpa_de_morango: 22.50,
  polpa_de_maracuja: 27.60,
  polpa_de_manga: 10.40,
  polpa_de_abacaxi: 15.10,
  polpa_detox: 3.40,
  polpa_orange: 3.30,
  polpa_pre_treino: 3.89,
  polpa_pos_treino: 3.00,

  // Frutas
  abacaxi: 12.00,
  manga: 4.00,
  limao_taiti: 3.60,
  limao_siciliano_p: 17.25,
  limao_siciliano_g: 14.50,
  caixa_de_morango: 0,
  bandeja_de_morango: 0,
  banana: 0,
  meia_duzia_de_banana: 0,

  // Embalagens
  copo_350ml: 622.68,
  copo_250ml: 384.29,
  tampa_bolha: 202.00,

  // Bebidas
  rum_bacardi_carta_ouro: 47.49,
  vodka_smirnoff: 38.44,
  cachaca_sagatiba: 30.00,
  agua_mineral: 21.94,
  leite_de_coco: 8.98,

  // Alimentos em pó
  matcha: 180.00,
  cafe_soluvel: 6.63,
  cacau_em_po: 19.43,

  // Descartáveis
  canudo: 150.00,
  guardanapo: 84.00,
  perflex: 148.50,
  luva_p: 34.96,
  luva_m: 34.96,
  luva_g: 34.96,
  touca: 40.36,
  pazinha_sobremesa: 27.00,
  copo_p_degustacao: 3.54,
  caixa_de_bobina_para_maquininha_57x15: 181.87,
  caixa_de_bobina_para_impressora_termica_80x40: 56.29,
  saco_de_lixo_60l: 53.30,
  saco_de_lixo_verde: 7.50,

  // Limpeza
  veja: 6.78,
  esponja: 8.84,
  alcool_liquido: 6.20,
  alcool_em_gel: 12.41,
  limpa_vidro: 27.35,
  refil_detergente: 8.90,
  refil_cloro: 4.60,
  refil_desinfetante: 4.60,
};

const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Helpers para mapear label -> chave de preço
function baseName(texto) {
  // pega só o que vem antes de "("; ex.: "Caldo de cana (cx)" -> "Caldo de cana"
  return (texto || '').split('(')[0].trim();
}
function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
function keyFromLabel(label) {
  return slugify(baseName(label));
}

// === Badges de preço unitário nas labels =========================
function priceFromLabelEl(labelEl) {
  // pega apenas o texto principal da label (antes de <details>)
  const baseTxt = (labelEl?.childNodes[0]?.textContent || labelEl?.textContent || "").replace(/ℹ️/g, "").trim();
  const key = keyFromLabel(baseTxt); // usa baseName + slugify
  return Number(prices[key] ?? 0);
}

function ensurePriceBadge(labelEl, unit) {
  let badge = labelEl.querySelector('.badge-preco');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'badge-preco';
    labelEl.appendChild(badge);
    // estilos inline para não depender do CSS
    Object.assign(badge.style, {
      marginLeft: '6px',
      fontSize: '0.85em',
      fontWeight: '600',
      padding: '2px 6px',
      borderRadius: '6px',
      border: '1px solid #d5ecd8',
      background: '#eef7ee',
      color: '#0a7d2f'
    });
  }
  if (unit > 0) {
    badge.textContent = `• ${fmtBRL.format(unit)} un.`;
    badge.style.border = '1px solid #d5ecd8';
    badge.style.background = '#eef7ee';
    badge.style.color = '#0a7d2f';
  } else {
    badge.textContent = '• Preço não definido';
    badge.style.border = '1px solid #f1dcc5';
    badge.style.background = '#fff7ed';
    badge.style.color = '#b45309';
  }
}

function renderAllUnitBadges() {
  document.querySelectorAll('#formulario .item label').forEach(labelEl => {
    const unit = priceFromLabelEl(labelEl);
    ensurePriceBadge(labelEl, unit);
  });
}


/* =========================
   Leitura de itens por seção
   ========================= */
// Lê os itens de uma seção (entre um <h2> e o próximo <h2>)
// e retorna [{label, quantidade, unit, subtotal}]
function lerItensDaSecao(categoriaH2) {
  const itens = [];
  let el = categoriaH2.nextElementSibling;

  while (el && el.tagName !== "H2") {
    if (el.classList && el.classList.contains("item")) {
      const input = el.querySelector("input[type='number']");
      const quantidade = parseInt(input?.value || "0", 10);
      if (quantidade > 0) {
        const labelEl = el.querySelector("label");
        let label = (labelEl?.childNodes[0]?.textContent || labelEl?.textContent || "").trim();
        label = label.replace(/ℹ️/g, "").trim();

        const key = keyFromLabel(label);
        const unit = Number(prices[key] ?? 0);
        const subtotal = unit * quantidade;

        itens.push({ label, quantidade, unit, subtotal });
      }
    }
    el = el.nextElementSibling;
  }

  return itens;
}

/* =========================
   Resumo (itens + qtd + total por categoria + total geral)
   ========================= */
function revisarPedido() {
  const nome = document.getElementById("nome").value.trim();
  const loja = document.getElementById("loja").value;

  if (!nome) return alert("Por favor, preencha seu nome.");
  if (!loja) return alert("Por favor, selecione a loja.");

  carimbarDataDoPedido();

  const formulario = document.getElementById("formulario");
  const categorias = formulario.querySelectorAll("h2");
  const listaResumo = document.getElementById("listaResumo");
  listaResumo.innerHTML = "";

  let temPedido = false;
  let totalGeral = 0;

  categorias.forEach((categoria) => {
    const itensCategoria = lerItensDaSecao(categoria);
    if (itensCategoria.length > 0) {
      temPedido = true;

      // Bloco da categoria
      const liCategoria = document.createElement("li");
      liCategoria.style.marginTop = "1em";
      liCategoria.style.fontWeight = "bold";
      liCategoria.textContent = categoria.innerText;

      const ulItens = document.createElement("ul");
      itensCategoria.forEach(({ label, quantidade }) => {
        const liItem = document.createElement("li");
        liItem.textContent = `${label}: ${quantidade}`; // mantém itens + quantidades
        ulItens.appendChild(liItem);
      });

      // Total da categoria
      const totalCategoria = itensCategoria.reduce((acc, it) => acc + it.subtotal, 0);
      totalGeral += totalCategoria;

      const liTotalCat = document.createElement("li");
      liTotalCat.style.marginTop = "6px";
      liTotalCat.style.fontWeight = "600";
      liTotalCat.textContent = `Total da categoria: ${fmtBRL.format(totalCategoria)}`;
      ulItens.appendChild(liTotalCat);

      liCategoria.appendChild(ulItens);
      listaResumo.appendChild(liCategoria);
    }
  });

  if (!temPedido) return alert("Por favor, insira a quantidade de pelo menos um item.");

  // Total geral
  const liTotal = document.createElement("li");
  liTotal.style.marginTop = "12px";
  liTotal.innerHTML = `<strong>Total Geral:</strong> ${fmtBRL.format(totalGeral)}`;
  listaResumo.appendChild(liTotal);

  document.getElementById("resumoNome").textContent = nome;
  document.getElementById("resumoLoja").textContent = loja;

  formulario.classList.add("hidden");
  document.getElementById("resumo").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function editarPedido() {
  document.getElementById("formulario").classList.remove("hidden");
  document.getElementById("resumo").classList.add("hidden");
}

/* =========================
   WhatsApp (itens + qtd + total por categoria + total geral)
   ========================= */
function enviarWhatsApp() {
  const nome = document.getElementById("nome").value.trim();
  const loja = document.getElementById("loja").value;

  const formulario = document.getElementById("formulario");
  const categorias = formulario.querySelectorAll("h2");

  // Usa o MESMO carimbo do revisar
  const dt = carimbarDataDoPedido();
  const dataFmt = formatarDataHoraBR(dt);

  let texto = `*Pedido Cana Mania*\n`;
  texto += `📅 *Data:* ${dataFmt}\n`;
  texto += `👤 *Nome:* ${nome}\n🏪 *Loja:* ${loja}\n`;

  let temPedido = false;
  let totalGeral = 0;

  categorias.forEach((categoria) => {
    const itensCategoria = lerItensDaSecao(categoria);
    if (itensCategoria.length > 0) {
      temPedido = true;

      texto += `\n*${categoria.innerText}*\n`;
      itensCategoria.forEach(({ label, quantidade }) => {
        texto += `- ${label}: ${quantidade}\n`; // mantém itens + quantidades
      });

      const totalCategoria = itensCategoria.reduce((acc, it) => acc + it.subtotal, 0);
      totalGeral += totalCategoria;
      texto += `Total da categoria: ${fmtBRL.format(totalCategoria)}\n`;
    }
  });

  if (!temPedido) return alert("Por favor, insira a quantidade de pelo menos um item.");

  texto += `\n💰 *Total Geral:* ${fmtBRL.format(totalGeral)}`;

  const telefone = getNumeroDestino(); // seg-sex vs sáb/dom (SP)
  const textoEncoded = encodeURIComponent(texto);
  const link = `https://wa.me/${telefone}?text=${textoEncoded}`;
  window.open(link, "_blank");
}

/* =========================
   Barra fixa de total (ao digitar)
   ========================= */

// Cria (se precisar) e atualiza a barra
function atualizarBarraTotalInstantaneo(total) {
  let bar = document.getElementById('totalBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'totalBar';
    // estilos da barra
    Object.assign(bar.style, {
      position: 'sticky',
      bottom: '0',
      left: '0',
      right: '0',
      background: '#e6258c',       // magenta
      color: '#fff',
      padding: '6px 10px',         // barra menor
      fontSize: '1em',
      fontWeight: 'bold',
      textAlign: 'center',
      zIndex: '20'
    });
    const form = document.getElementById('formulario');
    form && form.appendChild(bar);
  }
  bar.textContent = `💰 Total: ${fmtBRL.format(total)}`;
}


// Soma tudo que está digitado no formulário agora
function calcularTotaisInstantaneo() {
  const formulario = document.getElementById("formulario");
  if (!formulario) return { total: 0, qtd: 0 };

  const categorias = formulario.querySelectorAll("h2");
  let totalGeral = 0;
  let qtdItens = 0;

  categorias.forEach((categoria) => {
    const itens = lerItensDaSecao(categoria); // já traz unit e subtotal
    itens.forEach(({ quantidade, subtotal }) => {
      qtdItens += quantidade;
      totalGeral += subtotal;
    });
  });

  return { total: totalGeral, qtd: qtdItens };
}

// Atualiza a barra quando digitar números
function bindInputsParaBarra() {
  const inputs = document.querySelectorAll('#formulario .item input[type="number"]');
  const recalc = () => {
    const { total, qtd } = calcularTotaisInstantaneo();
    atualizarBarraTotalInstantaneo(total, qtd);
  };
  inputs.forEach(inp => {
    inp.addEventListener('input', recalc);
    inp.addEventListener('change', recalc);
  });

  // estado inicial
  recalc();
}

// Inicializa a barra ao carregar a página

document.addEventListener('DOMContentLoaded', () => {
  bindInputsParaBarra();
  renderAllUnitBadges();
});
