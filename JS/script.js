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
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(wd);
}

const NUMERO_SEG_SEX = '5511937143006';
const NUMERO_SAB_DOM = '5511968408559';

function getNumeroDestino() {
  const d = getDiaSaoPaulo();
  return (d === 0 || d === 6) ? NUMERO_SAB_DOM : NUMERO_SEG_SEX;
}

// === Carimbo fixo de data do pedido =============================
function carimbarDataDoPedido(force = false) {
  if (!window.pedidoTimestamp || force) {
    window.pedidoTimestamp = new Date();

    const hidden = document.getElementById("timestampPedido");
    if (hidden) hidden.value = window.pedidoTimestamp.toISOString();

    const alvo = document.getElementById("dataPedido");
    if (alvo) alvo.textContent = "Data do pedido: " + formatarDataHoraBR(window.pedidoTimestamp);

    const spanResumo = document.getElementById("resumoData");
    if (spanResumo) spanResumo.textContent = formatarDataHoraBR(window.pedidoTimestamp);
  }
  return window.pedidoTimestamp;
}

/* =========================
   Leitura de itens por seção
   ========================= */
// Retorna apenas label + quantidade
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

        itens.push({ label, quantidade });
      }
    }
    el = el.nextElementSibling;
  }

  return itens;
}

/* =========================
   Resumo do pedido (SEM PREÇO)
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

  categorias.forEach((categoria) => {
    const itensCategoria = lerItensDaSecao(categoria);
    if (itensCategoria.length > 0) {
      temPedido = true;

      const liCategoria = document.createElement("li");
      liCategoria.style.marginTop = "1em";
      liCategoria.style.fontWeight = "bold";
      liCategoria.textContent = categoria.innerText;

      const ulItens = document.createElement("ul");

      itensCategoria.forEach(({ label, quantidade }) => {
        const liItem = document.createElement("li");
        liItem.textContent = `${label}: ${quantidade}`;
        ulItens.appendChild(liItem);
      });

      liCategoria.appendChild(ulItens);
      listaResumo.appendChild(liCategoria);
    }
  });

  if (!temPedido) return alert("Por favor, insira a quantidade de pelo menos um item.");

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
   WhatsApp (SEM PREÇO)
   ========================= */
function enviarWhatsApp() {
  const nome = document.getElementById("nome").value.trim();
  const loja = document.getElementById("loja").value;
  const categorias = document.querySelectorAll("#formulario h2");

  const dt = carimbarDataDoPedido();
  const dataFmt = formatarDataHoraBR(dt);

  let texto = `*Pedido Cana Mania*\n`;
  texto += `📅 *Data:* ${dataFmt}\n`;
  texto += `👤 *Nome:* ${nome}\n🏪 *Loja:* ${loja}\n`;

  let temPedido = false;

  categorias.forEach((categoria) => {
    const itensCategoria = lerItensDaSecao(categoria);
    if (itensCategoria.length > 0) {
      temPedido = true;
      texto += `\n*${categoria.innerText}*\n`;
      itensCategoria.forEach(({ label, quantidade }) => {
        texto += `- ${label}: ${quantidade}\n`;
      });
    }
  });

  if (!temPedido) return alert("Por favor, insira a quantidade de pelo menos um item.");

  const telefone = getNumeroDestino();
  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
  window.open(link, "_blank");
}

/* =========================
   Barra fixa inferior (QUANTIDADE)
   ========================= */
function atualizarBarraTotalInstantaneo(qtd) {
  let bar = document.getElementById('totalBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'totalBar';
    Object.assign(bar.style, {
      position: 'sticky',
      bottom: '0',
      background: '#e6258c',
      color: '#fff',
      padding: '6px 10px',
      fontSize: '1em',
      fontWeight: 'bold',
      textAlign: 'center',
      zIndex: '20'
    });
    document.getElementById('formulario')?.appendChild(bar);
  }
  bar.textContent = `🧾 Total de itens: ${qtd}`;
}

function calcularTotaisInstantaneo() {
  const categorias = document.querySelectorAll("#formulario h2");
  let qtd = 0;

  categorias.forEach(categoria => {
    const itens = lerItensDaSecao(categoria);
    itens.forEach(it => qtd += it.quantidade);
  });

  return qtd;
}

function bindInputsParaBarra() {
  const inputs = document.querySelectorAll('#formulario .item input[type="number"]');
  const recalc = () => atualizarBarraTotalInstantaneo(calcularTotaisInstantaneo());
  inputs.forEach(inp => {
    inp.addEventListener('input', recalc);
    inp.addEventListener('change', recalc);
  });
  recalc();
}

document.addEventListener('DOMContentLoaded', () => {
  bindInputsParaBarra();
});
