# 🚀 Desafio SEA Tecnologia – Cadastro de Clientes

Este projeto foi desenvolvido como solução para o **Desafio Técnico da SEA Tecnologia**, com o objetivo de criar uma aplicação completa de **cadastro, consulta, edição e exclusão de clientes**.

---

## 📌 Objetivo do Desafio

Construir uma aplicação que permita:

- Autenticação de usuários com **perfis diferentes**
- Cadastro de clientes com **validações de negócio**
- Consulta detalhada dos dados
- Controle de acesso por perfil
- Interface simples utilizando **HTML, CSS e JavaScript puro**
- Backend em **Spring Boot**, seguindo boas práticas

---

## 🧩 Funcionalidades Implementadas

### 🔐 Autenticação e Perfis
- Login via **Spring Security (HTTP Basic)**
- Perfis:
  - **ADMIN**
    - Cadastrar clientes
    - Editar clientes
    - Excluir clientes
    - Visualizar clientes
  - **PADRAO**
    - Apenas visualizar clientes
- Login controlado pelo `index.html`
- Logout com limpeza de sessão

---

### 👤 Cadastro de Clientes
Campos obrigatórios:
- Nome
- CPF (único)
- Endereço completo:
  - CEP
  - Logradouro
  - Bairro
  - Cidade
  - UF
  - Complemento
- E-mails (1 ou mais)
- Telefones (1 ou mais) com tipo:
  - CELULAR
  - FIXO
  - COMERCIAL

---

### ✅ Validações de Negócio
Implementadas no **ClienteService**:
- CPF não pode ser duplicado
- Combinação **Telefone + Tipo** não pode se repetir
- Campos obrigatórios não podem ser vazios
- CPF válido (11 dígitos)
- CEP válido (8 dígitos)

Erros tratados de forma centralizada via:
- `ApiExceptionHandler`

As mensagens de erro retornam para o frontend e são exibidas diretamente no formulário.

---

### 🧠 Regras Importantes
- CPF **não pode ser alterado** após o cadastro
- Usuário PADRAO **não vê botões de edição/exclusão**
- Validações visuais no frontend
- Campos só ficam vermelhos após interação do usuário
- Máscaras aplicadas **apenas no frontend**:
  - CPF → `000.000.000-00`
  - CEP → `00000-000`
  - Telefone → `(00) 00000-0000`
- Backend recebe **somente números**

---

### 🌎 Integração Externa
- **ViaCEP API**
  - Auto-preenchimento de endereço a partir do CEP

---

## 🖥️ Frontend
- HTML + CSS + JavaScript puro
- Modal para:
  - Novo Cliente
  - Edição de Cliente
  - Visualização de Detalhes (Ver mais)
- Sem uso de frameworks JS
- UX focado em clareza e validação visual

---

## ⚙️ Backend
- Java + Spring Boot
- Spring Security
- JPA / Hibernate
- H2 Database (ambiente de teste)
- Arquitetura em camadas:
  - Controller
  - Service
  - Repository
  - DTOs
  - Exception Handler

---

## 🔑 Usuários para Teste

| Usuário | Senha        | Perfil  |
|-------|--------------|---------|
| admin | 123qwe!@#    | ADMIN   |
| padrao | 123qwe123   | PADRAO  |
