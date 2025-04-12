...

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Tsihoharana - Messagerie Privée</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #e0c3fc, #8ec5fc);
      padding: 30px;
      color: #333;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 3.5em;
      color: #6a11cb;
      letter-spacing: 1px;
    }
    .center-box {
      max-width: 700px;
      margin: auto;
    }
    .form-box, .chat-box, .user-list-box {
      background: white;
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      animation: fadeIn 0.5s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    input, button {
      padding: 12px;
      margin: 10px 0;
      width: 100%;
      border-radius: 10px;
      border: 1px solid #ccc;
      font-size: 1em;
    }
    button {
      background: #6a11cb;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover { background: #2575fc; }
    .search-bar input {
      width: 80%;
      display: inline-block;
    }
    .search-bar button {
      width: 18%;
      display: inline-block;
    }
    .user-card {
      display: flex;
      align-items: center;
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background: #f4f8ff;
      cursor: pointer;
      transition: 0.3s;
    }
    .user-card:hover { background: #e6efff; }
    .avatar {
      width: 70px;
      height: 70px;
      background: #6a11cb;
      color: white;
      font-weight: bold;
      font-size: 1.8em;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      position: relative;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
    .avatar::after {
      content: '+';
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: #2575fc;
      color: white;
      width: 22px;
      height: 22px;
      font-size: 16px;
      border-radius: 50%;
      text-align: center;
      line-height: 22px;
      cursor: pointer;
    }
    .chat-message {
      background: #d1e7ff;
      padding: 12px 18px;
      border-radius: 18px;
      margin: 10px 0;
      max-width: 80%;
      animation: fadeIn 0.4s ease;
    }
    .chat-input {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .chat-input input {
      flex: 1;
    }
  </style>
</head>
<body>
  <h1>Tsihoharana</h1>
  <div class="center-box">
    <div class="form-box" id="authBox">
      <h2>Connexion ou Inscription</h2>
      <input type="text" id="authUser" placeholder="Nom d'utilisateur">
      <input type="password" id="authPass" placeholder="Mot de passe">
      <button onclick="register()">S'inscrire</button>
      <button onclick="login()">Se connecter</button>
    </div>

    <div class="user-list-box" id="userListBox" style="display:none;">
      <div class="search-bar">
        <input type="text" id="searchUser" placeholder="Rechercher un utilisateur...">
        <button onclick="searchUser()">Rechercher</button>
      </div>
      <div id="userResults"></div>
    </div>

    <div class="chat-box" id="chatBox" style="display:none;">
      <h2 id="chatWith"></h2>
      <div id="chatMessages"></div>
      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="Tape ton message...">
        <button onclick="sendMessage()">Envoyer</button>
      </div>
    </div>
  </div>

  <audio id="messageSound" src="https://cdn.pixabay.com/audio/2022/03/15/audio_775b4dc1b0.mp3"></audio>

  <script>
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let avatars = JSON.parse(localStorage.getItem('avatars') || '{}');
    let currentUser = localStorage.getItem('currentUser') || '';
    let chattingWith = '';

    if (currentUser) {
      document.getElementById('authBox').style.display = 'none';
      document.getElementById('userListBox').style.display = 'block';
      updateUserList();
    }

    function register() {
      const u = document.getElementById('authUser').value.trim();
      const p = document.getElementById('authPass').value;
      if (!u || !p) return alert("Champs manquants.");
      if (users[u]) return alert("Utilisateur existe déjà.");
      users[u] = { password: p };
      localStorage.setItem('users', JSON.stringify(users));
      alert("Inscription réussie ! Connecte-toi.");
    }

    function login() {
      const u = document.getElementById('authUser').value.trim();
      const p = document.getElementById('authPass').value;
      if (!users[u] || users[u].password !== p) return alert("Identifiants invalides.");
      currentUser = u;
      localStorage.setItem('currentUser', u);
      document.getElementById('authBox').style.display = 'none';
      document.getElementById('userListBox').style.display = 'block';
      updateUserList();
    }

    function updateUserList() {
      const result = document.getElementById('userResults');
      result.innerHTML = '';
      for (let u in users) {
        if (u !== currentUser) {
          const div = document.createElement('div');
          div.className = 'user-card';
          const avatar = avatars[u] ? `<img src="${avatars[u]}" />` : u.charAt(0).toUpperCase();
          div.innerHTML = `<div class='avatar' onclick="uploadAvatar('${u}')">${avatar}</div><div>${u}</div>`;
          div.onclick = () => startChat(u);
          result.appendChild(div);
        }
      }
    }

    function uploadAvatar(user) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = e => {
          avatars[user] = e.target.result;
          localStorage.setItem('avatars', JSON.stringify(avatars));
          updateUserList();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }

    function searchUser() {
      const q = document.getElementById('searchUser').value.toLowerCase();
      const cards = document.querySelectorAll('.user-card');
      cards.forEach(c => {
        const name = c.innerText.toLowerCase();
        c.style.display = name.includes(q) ? 'flex' : 'none';
      });
    }

    function startChat(user) {
      chattingWith = user;
      document.getElementById('chatWith').innerText = `Discussion avec ${user}`;
      document.getElementById('chatMessages').innerHTML = '';
      document.getElementById('chatBox').style.display = 'block';
    }

    function sendMessage() {
      const input = document.getElementById('chatInput');
      const msg = input.value.trim();
      if (!msg) return;
      const div = document.createElement('div');
      div.className = 'chat-message';
      div.innerText = msg;
      document.getElementById('chatMessages').appendChild(div);
      input.value = '';
      document.getElementById('messageSound').play();
      setTimeout(() => div.remove(), 7000);
    }
  </script>
</body>
</html>


