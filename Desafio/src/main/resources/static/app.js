const API_BASE = "http://localhost:8080"; 

function setAuth(username, password) {
  sessionStorage.setItem("auth", btoa(username + ":" + password));
  sessionStorage.setItem("user", username);
}

function getAuthHeader() {
  const auth = sessionStorage.getItem("auth");
  return { "Authorization": "Basic " + auth };
}

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    document.getElementById("erro").innerText = "Preencha usuário e senha.";
    return;
  }

  setAuth(user, pass);

  fetch(API_BASE + "/clientes", { headers: getAuthHeader() })
    .then(res => {
      if (res.ok) window.location.href = "dashboard.html";
      else {
        sessionStorage.clear();
        document.getElementById("erro").innerText = "Login inválido.";
      }
    });
}

function logout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}
