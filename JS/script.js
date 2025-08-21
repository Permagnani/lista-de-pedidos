// === Utilidade: formata data/hora pt-BR no fuso de São Paulo =================
function formatarDataHoraBR(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(date).replace(",", "");
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

    // se você adicionar <span id="resumoData"> no resumo, já atualiza aqui também
    const spanResumo = document.getElementById("resumoData");
    if (spanResumo) spanResumo.textContent = formatarDataHoraBR(window.pedidoTimestamp);
  }
  return window.pedidoTimestamp;
}

// === Funções auxiliares ======================================================

// Lê os itens de uma seção (entre um <h2> e o próximo <h2>) e retorna [{label, quantidade}]
function lerItensDaSecao(categoriaH2) {
  const itens = [];
  let el = categoriaH2.nextElementSibling;

  while (el && el.tagName !== "H2") {
    if (el.classList && el.classList.contains("item")) {
      const input = el.querySelector("input[type='number']");
      const quantidade = parseInt(input?.value || "0", 10);
      if (quantidade > 0) {
        // Extrai o texto da label SEM pegar o conteúdo do <details>
        const labelEl = el.querySelector("label");
        let label = "";
        if (labelEl) {
          // Pega apenas o nó de texto principal da label (antes de <details>)
          label = (labelEl.childNodes[0]?.textContent || labelEl.textContent || "").trim();
        }
        // Remove o emoji ℹ️ caso ainda apareça
        label = label.replace(/ℹ️/g, "").trim();

        itens.push({ label, quantidade });
      }
    }
    el = el.nextElementSibling;
  }

  return itens;
}

// === Fluxo principal =========================================================

function revisarPedido() {
  const nome = document.getElementById("nome").value.trim();
  const lojaSelect = document.getElementById("loja");
  const loja = lojaSelect.options[lojaSelect.selectedIndex].value;

  if (!nome) {
    alert("Por favor, preencha seu nome.");
    return;
  }

  if (!loja) {
    alert("Por favor, selecione a loja.");
    return;
  }

  // ADIÇÃO: gera/exibe a data/hora e preenche o hidden (mantém o mesmo carimbo depois)
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

  if (!temPedido) {
    alert("Por favor, insira a quantidade de pelo menos um item.");
    return;
  }

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

function enviarWhatsApp() {
  const nome = document.getElementById("nome").value.trim();
  const lojaSelect = document.getElementById("loja");
  const loja = lojaSelect.options[lojaSelect.selectedIndex].value;

  const formulario = document.getElementById("formulario");
  const categorias = formulario.querySelectorAll("h2");

  // Reutiliza o MESMO carimbo gerado no revisar (sem force, para não mudar)
  const dt = carimbarDataDoPedido();
  const dataFmt = formatarDataHoraBR(dt); // "dd/mm/aaaa hh:mm"

  let texto = `*Pedido Cana Mania*\n`;
  texto += `📅 *Data:* ${dataFmt}\n`; // ADIÇÃO: data na mensagem
  texto += `👤 *Nome:* ${nome}\n🏪 *Loja:* ${loja}\n📦 *Itens:*\n`;

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

  if (!temPedido) {
    alert("Por favor, insira a quantidade de pelo menos um item.");
    return;
  }

  const telefone = "5511937143006"; // Coloque o número correto aqui
  const textoEncoded = encodeURIComponent(texto);
  const link = `https://wa.me/${telefone}?text=${textoEncoded}`;
  window.open(link, "_blank");
}

