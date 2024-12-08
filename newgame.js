let gameStarted = false; // Variable pour savoir si le jeu a commencé

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  if (!gameStarted) {
    showStartScreen(); // Afficher la page de démarrage
  } else {
    startGame(); // Commencer le jeu
  }
}

// Fonction pour afficher la page de démarrage avec un bouton
function showStartScreen() {
  textSize(40);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Bienvenue dans le jeu", width / 2, height / 3);
  
  // Créer un bouton "New Game"
  textSize(30);
  fill(255, 255, 0); // Couleur du bouton (jaune)
  rectMode(CENTER);
  rect(width / 2, height / 2 + 50, 200, 50, 10); // Zone du bouton
  fill(0); // Texte en noir
  text("New Game", width / 2, height / 2 + 50); // Texte du bouton
}

// Fonction pour démarrer le jeu
function startGame() {
  // Ici, vous placez votre code de jeu réel
  fill(255);
  textSize(20);
  text("Le jeu commence !", width / 2, height / 2);
}

// Vérifier si l'utilisateur clique sur le bouton
function mousePressed() {
  if (!gameStarted) {
    // Vérifier si le clic est dans la zone du bouton
    if (mouseX > width / 2 - 100 && mouseX < width / 2 + 100 && mouseY > height / 2 + 25 && mouseY < height / 2 + 75) {
      gameStarted = true; // Le jeu commence
    }
  }
}
