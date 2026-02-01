const usuario = sessionStorage.getItem("user");
if (!sessionStorage.getItem("auth")) window.location.href = "index.html";

if (usuario !== "admin") {
  document.getElementById("btnNovo").style.display = "none";
}

carregarClientes();
setupForm();
addEmail();     
addTelefone(); 

function showMsg(texto, tipo) {
  const msg = document.getElementById("msg");
  msg.className = "msg " + (tipo === "ok" ? "ok" : "err");
  msg.innerText = texto;
  msg.style.display = "block";

  msg.scrollIntoView({ behavior: "smooth", block: "nearest" });

  setTimeout(() => {
    msg.style.display = "none";
  }, 3000);
}


function carregarClientes() {
  fetch(API_BASE + "/clientes", { headers: getAuthHeader() })
    .then(async res => {
      if (!res.ok) throw new Error("Falha ao listar clientes");
      return res.json();
    })
    .then(lista => {
      const tabela = document.getElementById("tabela");
      tabela.innerHTML = "";

      lista.forEach(c => {
		const acoes = `
		  <button onclick="verDetalhes(${c.id})">Ver mais</button>
		  ${usuario === "admin" ? `
		    <button onclick="abrirEditar(${c.id})">Editar</button>
		    <button onclick="excluir(${c.id})">Excluir</button>
		  ` : ""}
		`;

		tabela.innerHTML += `
		  <tr>
		    <td>${c.id}</td>
		    <td>${c.nome}</td>
		    <td>${formatCPF(c.cpf)}</td>
			<td>${formatCEP(c.cep)}</td>
		    <td>${acoes}</td>
		  </tr>
		`;
      });
    })
    .catch(() => showMsg("Erro ao carregar lista.", "err"));
}

function excluir(id) {
  if (!confirm("Excluir cliente " + id + "?")) return;

  fetch(API_BASE + "/clientes/" + id, {
    method: "DELETE",
    headers: getAuthHeader()
  }).then(async res => {
    if (res.status === 204) {
      showMsg("Cliente excluído.", "ok");
      carregarClientes();
    } else {
      showMsg("Sem permissão ou erro ao excluir.", "err");
    }
  });
}

/* ===== MODAL ===== */
function abrirModalNovo() {
  if (usuario !== "admin") return;
  document.getElementById("cpf").disabled = false;
  limparForm();
  document.getElementById("clienteId").value = "";
  document.getElementById("modalTitulo").innerText = "Novo Cliente";
  document.getElementById("msg").style.display = "none";
  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("msg").style.display = "none";
}

function limparForm() {
  document.getElementById("formCliente").reset();
  document.getElementById("emails").innerHTML = "";
  document.getElementById("telefones").innerHTML = "";
  addEmail();
  addTelefone();
}

/* ===== EMAILS DINÂMICOS ===== */
function addEmail(valor = "") {
  const box = document.getElementById("emails");
  const div = document.createElement("div");
  div.className = "row-email";
  div.innerHTML = `
    <div>
      <label>E-mail</label>
	  <input class="email" type="email"
	    placeholder="ex: nome@email.com"
	    value="${valor}"
	    oninput="validarEmailInput(this)"
	    required />
    </div>
    <div>
      <label>&nbsp;</label>
      <button type="button" class="secondary" onclick="this.parentElement.parentElement.remove()">-</button>
    </div>
  `;
  box.appendChild(div);
}

/* ===== TELEFONES DINÂMICOS ===== */
function addTelefone(numero = "", tipo = "CELULAR") {
  const box = document.getElementById("telefones");
  const div = document.createElement("div");
  div.className = "row";

  div.innerHTML = `
    <div>
      <label>Telefone</label>
      <input class="telefone" placeholder="(99)99999-9999" value="${numero}"
        oninput="this.dataset.touched='1'; this.value=this.value.replace(/\\D/g,''); validarTelefoneRow(this.closest('.row'))"
        required />
    </div>

    <div>
      <label>Tipo</label>
      <select class="tipo"
        onchange="this.dataset.touched='1'; validarTelefoneRow(this.closest('.row'))"
        required>
        <option value="CELULAR" ${tipo==="CELULAR" ? "selected" : ""}>CELULAR</option>
        <option value="RESIDENCIAL" ${tipo==="RESIDENCIAL" ? "selected" : ""}>RESIDENCIAL</option>
        <option value="COMERCIAL" ${tipo==="COMERCIAL" ? "selected" : ""}>COMERCIAL</option>
      </select>
    </div>

    <div>
      <label>&nbsp;</label>
      <button type="button" class="secondary" onclick="this.closest('.row').remove()">-</button>
    </div>
  `;

  const telInput = div.querySelector(".telefone");
  const tipoSelect = div.querySelector(".tipo");

  telInput.dataset.touched = "0";
  tipoSelect.dataset.touched = "0";

  box.appendChild(div);
}


/* ===== SUBMIT DO FORM ===== */
function setupForm() {
  const form = document.getElementById("formCliente");

  // valida enquanto digita (básico)
  ["nome","cpf","cep","uf","cidade","bairro","logradouro"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      el.classList.remove("valid");
    });
  });

  // ViaCEP no CEP (quando completar 8 dígitos ou ao sair do campo)
  const cepEl = document.getElementById("cep");
  cepEl.addEventListener("input", () => {
    if (cepEl.value.trim().length === 8) buscarEnderecoPorCep();
  });
  cepEl.addEventListener("blur", () => {
    if (cepEl.value.trim().length === 8) buscarEnderecoPorCep();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // valida antes de enviar
    if (!validarCamposBasicos()) {
      showMsg("Corrija os campos destacados antes de salvar.", "err");
      return;
    }

    salvarCliente();
  });
}

function salvarCliente() {
  const payload = {
    nome: document.getElementById("nome").value.trim(),
    cpf: document.getElementById("cpf").value.trim(),
    cep: document.getElementById("cep").value.trim(),
    logradouro: document.getElementById("logradouro").value.trim(),
    bairro: document.getElementById("bairro").value.trim(),
    cidade: document.getElementById("cidade").value.trim(),
    uf: document.getElementById("uf").value.trim().toUpperCase(),
    complemento: document.getElementById("complemento").value.trim(),
    emails: Array.from(document.querySelectorAll(".email")).map(i => ({ email: i.value.trim() })),
    telefones: Array.from(document.querySelectorAll(".row")).map(row => ({
      telefone: row.querySelector(".telefone").value.trim(),
      tipo: row.querySelector(".tipo").value
    }))
  };
	
  // Telefones visual
  document.querySelectorAll(".telefone").forEach(inp => inp.classList.remove("invalid","valid"));
  document.querySelectorAll(".email").forEach(inp => inp.classList.remove("invalid","valid"));

  // valida emails e telefones antes de enviar
  for (const inp of document.querySelectorAll(".email")) {
    validarEmailInput(inp);
    if (inp.classList.contains("invalid")) {
      showMsg("Corrija os e-mails inválidos.", "err");
      return;
    }
  }

  for (const row of document.querySelectorAll(".row")) {
    validarTelefoneRow(row, true); 
    if (row.querySelector(".telefone").classList.contains("invalid") ||
        row.querySelector(".tipo").classList.contains("invalid")) {
      showMsg("Corrija os telefones inválidos.", "err");
      return;
    }
  }

	
  const id = document.getElementById("clienteId").value;
  const isEdicao = !!id;

  fetch(API_BASE + "/clientes" + (isEdicao ? ("/" + id) : ""), {
    method: isEdicao ? "PUT" : "POST",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(async res => {
    const body = await res.json().catch(() => null);

    if (res.ok) {
      showMsg(isEdicao ? "Cliente atualizado com sucesso." : "Cliente criado com sucesso.", "ok");
      fecharModal();
      carregarClientes();
    } else {
      showMsg(body?.message || "Erro ao salvar cliente.", "err");
    }
  })
  .catch(() => showMsg("Erro de rede ao salvar.", "err"));
}

function abrirModalDetalhes() {
  document.getElementById("modalDetalhes").style.display = "flex";
}
function fecharModalDetalhes() {
  document.getElementById("modalDetalhes").style.display = "none";
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function verDetalhes(id) {
  fetch(API_BASE + "/clientes/" + id, { headers: getAuthHeader() })
    .then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Erro ao buscar detalhes.");
      }
      return res.json();
    })
    .then(c => {
      const emails = (c.emails || []).map(e => `<span class="badge">${escapeHtml(e.email)}</span>`).join("");
	  const tels = (c.telefones || []).map(t =>`<span class="badge">${escapeHtml(t.tipo)}: ${escapeHtml(formatTelefone(t.telefone))}</span>`).join("");

      document.getElementById("detalhesBody").innerHTML = `
        <div class="details-grid">
          <div class="kv"><b>ID</b>${c.id ?? "-"}</div>
          <div class="kv"><b>CPF</b>${escapeHtml(formatCPF(c.cpf))}</div>

          <div class="kv full"><b>Nome</b>${escapeHtml(c.nome)}</div>

          <div class="kv"><b>CEP</b>${escapeHtml(formatCEP(c.cep))}</div>
          <div class="kv"><b>UF</b>${escapeHtml(c.uf)}</div>

          <div class="kv"><b>Cidade</b>${escapeHtml(c.cidade)}</div>
          <div class="kv"><b>Bairro</b>${escapeHtml(c.bairro)}</div>

          <div class="kv full"><b>Logradouro</b>${escapeHtml(c.logradouro)}</div>
          <div class="kv full"><b>Complemento</b>${escapeHtml(c.complemento || "-")}</div>

          <div class="list-box full">
            <b style="display:block; margin-bottom:6px;">E-mails</b>
            ${emails || "<span class='badge'>Nenhum</span>"}
          </div>

          <div class="list-box full">
            <b style="display:block; margin-bottom:6px;">Telefones</b>
            ${tels || "<span class='badge'>Nenhum</span>"}
          </div>
        </div>
      `;
      abrirModalDetalhes();
    })
    .catch(err => showMsg(err.message, "err"));
}

function validarCamposBasicos() {
  let ok = true;

  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const cep = document.getElementById("cep").value.trim();
  const ufEl = document.getElementById("uf");
  const uf = ufEl.value.trim().toUpperCase();
  ufEl.value = uf;
  const cidade = document.getElementById("cidade").value.trim();
  const bairro = document.getElementById("bairro").value.trim();
  const logradouro = document.getElementById("logradouro").value.trim();

  // Nome
  if (nome.length < 3) { setError("nome", "Informe um nome com pelo menos 3 caracteres."); ok = false; }
  else markValid("nome");

  // CPF
  if (!cpfValido(cpf)) { setError("cpf", "CPF não válido"); ok = false; }
  else markValid("cpf");

  // CEP
  if (!/^\d{8}$/.test(cep)) { setError("cep", "CEP deve ter exatamente 8 dígitos."); ok = false; }
  else markValid("cep");

  // UF
  if (!/^[A-Z]{2}$/.test(uf)) { setError("uf", "UF inválida. Ex: SP, RJ, MG."); ok = false; } 
  else markValid("uf");

  // Cidade
  if (!cidade) { setError("cidade", "Cidade é obrigatória."); ok = false; }
  else markValid("cidade");

  // Bairro
  if (!bairro) { setError("bairro", "Bairro é obrigatório."); ok = false; }
  else markValid("bairro");

  // Logradouro
  if (!logradouro) { setError("logradouro", "Logradouro é obrigatório."); ok = false; }
  else markValid("logradouro");

  return ok;
}

function setLoadingCep(loading) {
  const cep = document.getElementById("cep");
  if (loading) {
    cep.classList.add("valid");
  }
}

function buscarEnderecoPorCep() {
  const cep = document.getElementById("cep").value.trim();

  if (!/^\d{8}$/.test(cep)) {
    setError("cep", "CEP inválido (8 dígitos).");
    return;
  }

  clearError("cep");
  setLoadingCep(true);

  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(res => res.json())
    .then(data => {
      if (data.erro) {
        setError("cep", "CEP não encontrado.");
        return;
      }

      // Preenche
      document.getElementById("logradouro").value = data.logradouro || "";
      document.getElementById("bairro").value = data.bairro || "";
      document.getElementById("cidade").value = data.localidade || "";
      document.getElementById("uf").value = (data.uf || "").toUpperCase();

      // Marca como válidos se vierem preenchidos
      if (data.logradouro) markValid("logradouro");
      if (data.bairro) markValid("bairro");
      if (data.localidade) markValid("cidade");
      if (data.uf) markValid("uf");

      markValid("cep");
      showMsg("Endereço preenchido pelo CEP.", "ok");
    })
    .catch(() => {
      setError("cep", "Falha ao consultar ViaCEP.");
    })
    .finally(() => setLoadingCep(false));
}

function setError(inputId, msg) {
  const el = document.getElementById(inputId);
  const err = document.getElementById("err_" + inputId);

  if (err) {
    err.innerText = msg;
    err.style.display = "block";
  }
  if (el) {
    el.classList.add("invalid");
    el.classList.remove("valid");
  }
}

function clearError(inputId) {
  const el = document.getElementById(inputId);
  const err = document.getElementById("err_" + inputId);

  if (err) {
    err.innerText = "";
    err.style.display = "none";
  }
  if (el) {
    el.classList.remove("invalid");
  }
}

function markValid(inputId) {
  const el = document.getElementById(inputId);
  if (el) {
    el.classList.remove("invalid");
    el.classList.add("valid");
  }
  clearError(inputId);
}

function cpfValido(cpf) {
  cpf = (cpf || "").replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; 

  let soma = 0, resto;

  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.substring(10, 11));
}

function validarEmailInput(input) {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
  input.classList.toggle("invalid", !ok);
  input.classList.toggle("valid", ok);
}

function validarTelefoneRow(row, forcar = false) {
  const tel = row.querySelector(".telefone");
  const tipo = row.querySelector(".tipo");

  const touchedTel = forcar || tel.dataset.touched === "1";
  const touchedTipo = forcar || tipo.dataset.touched === "1";

  const telOk = /^\d{8,11}$/.test(tel.value.trim());
  if (touchedTel) {
    tel.classList.toggle("invalid", !telOk);
    tel.classList.toggle("valid", telOk);
  } else {
    tel.classList.remove("invalid", "valid");
  }

  const tipoOk = (tipo.value || "").trim() !== "";
  if (touchedTipo) {
    tipo.classList.toggle("invalid", !tipoOk);
    tipo.classList.toggle("valid", tipoOk);
  } else {
    tipo.classList.remove("invalid", "valid");
  }
}

function formatCPF(cpf) {
  const v = String(cpf || "").replace(/\D/g, "");
  if (v.length !== 11) return cpf || "";
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCEP(cep) {
  const v = String(cep || "").replace(/\D/g, "");
  if (v.length !== 8) return cep || "";
  return v.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function formatTelefone(tel) {
  const v = String(tel || "").replace(/\D/g, "");
  if (v.length === 8) {
    // 9999-9999
    return v.replace(/(\d{4})(\d{4})/, "$1-$2");
  }
  if (v.length === 11) {
    // (99)99999-9999
    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return tel || "";
}

/* ===== EDITAR  ===== */
function abrirEditar(id) {
  if (usuario !== "admin") return;

  limparForm();
  document.getElementById("msg").style.display = "none";
  document.getElementById("modalTitulo").innerText = "Editar Cliente";
  document.getElementById("clienteId").value = id;

  fetch(API_BASE + "/clientes/" + id, { headers: getAuthHeader() })
    .then(async res => {
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || "Erro ao buscar cliente.");
      return body;
    })
    .then(c => {
      document.getElementById("nome").value = c.nome || "";
      document.getElementById("cpf").value = (c.cpf || "").replace(/\D/g, "");
	  document.getElementById("cpf").disabled = true;
      document.getElementById("cep").value = (c.cep || "").replace(/\D/g, "");
      document.getElementById("uf").value = (c.uf || "");
      document.getElementById("cidade").value = c.cidade || "";
      document.getElementById("bairro").value = c.bairro || "";
      document.getElementById("logradouro").value = c.logradouro || "";
      document.getElementById("complemento").value = c.complemento || "";

      // emails
      document.getElementById("emails").innerHTML = "";
      (c.emails && c.emails.length ? c.emails : [{ email: "" }]).forEach(e => {
        addEmail(e.email || "");
      });

      // telefones
      document.getElementById("telefones").innerHTML = "";
      (c.telefones && c.telefones.length ? c.telefones : [{ telefone: "", tipo: "" }]).forEach(t => {
        addTelefone((t.telefone || "").replace(/\D/g,""), (t.tipo || ""));
      });

      // abre modal
      document.getElementById("modal").style.display = "flex";
    })
    .catch(err => showMsg(err.message, "err"));
}
