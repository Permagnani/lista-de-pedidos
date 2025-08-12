function revisarPedido() {
  const nome = document.getElementById("nome").value.trim();
  const loja = document.getElementById("loja").value.trim();

  if (!nome) {
    alert("Por favor, preencha seu nome.");
    return;
  }

  if (!loja) {
    alert("Por favor, selecione a loja.");
    return;
  }



  const formulario = document.getElementById("formulario");
  const categorias = formulario.querySelectorAll("h2");
  const listaResumo = document.getElementById("listaResumo");
  listaResumo.innerHTML = "";

  let temPedido = false;

  categorias.forEach((categoria) => {
    let elementos = [];
    let el = categoria.nextElementSibling;

    while (el && el.tagName !== "H2") {
      if (el.classList.contains("item")) {
        elementos.push(el);
      }
      el = el.nextElementSibling;
    }

    let itensCategoria = [];

    elementos.forEach((itemDiv) => {
      const input = itemDiv.querySelector("input[type='number']");
      const quantidade = parseInt(input.value);
      if (quantidade > 0) {
        let label = itemDiv.querySelector("label").innerText.replace(/ℹ️/g, "").trim();
        itensCategoria.push({ label, quantidade });
        temPedido = true;
      }
    });

    if (itensCategoria.length > 0) {
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
  const loja = document.getElementById("loja").value.trim();

  const formulario = document.getElementById("formulario");
  const categorias = formulario.querySelectorAll("h2");

  let texto = `*Pedido Cana Mania*\n`;
  texto += `👤 *Nome:* ${nome}\n🏪 *Loja:* ${loja}\n📦 *Itens:*\n`;

  let temPedido = false;

  categorias.forEach((categoria) => {
    let elementos = [];
    let el = categoria.nextElementSibling;

    while (el && el.tagName !== "H2") {
      if (el.classList.contains("item")) {
        elementos.push(el);
      }
      el = el.nextElementSibling;
    }

    let itensCategoria = [];

    elementos.forEach((itemDiv) => {
      const input = itemDiv.querySelector("input[type='number']");
      const quantidade = parseInt(input.value);
      if (quantidade > 0) {
        // Pega só o texto do label (sem detalhes)
        let labelEl = itemDiv.querySelector("label");
        let label = labelEl.firstChild.textContent.trim();
        itensCategoria.push({ label, quantidade });
        temPedido = true;
      }
    });

    if (itensCategoria.length > 0) {
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

  const telefone = "5511951755620"; // Coloque o número correto aqui
  const textoEncoded = encodeURIComponent(texto);
  const link = `https://wa.me/${telefone}?text=${textoEncoded}`;
  window.open(link, "_blank");
}


