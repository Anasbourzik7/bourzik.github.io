let pursuer1, pursuer2;
let target;
let obstacles = [];
const flock = [];
let vehicules = [];
let diddyimage;
let followerImage;
let imageBoid;
let alignSlider, cohesionSlider, separationSlider;
let labelNbBoids;
let diddy;
let mode = "default"; // Le mode  par défaut
let minDistance = 80; // Distance minimale entre les véhicules
let isLeaderMode = false; // leadermode
let guide; 


const obstacleInterval = 7000; // 7 secondes


// PRELOAD
function preload() {
  boidImage = loadImage('assets/boids/justin_bieber.png');
  diddyimage = loadImage('assets/leader/diddy.png');
  followerImage = loadImage('assets/followers/police.jpg');
  obstacleImg = loadImage('assets/obstacle/fbi.png');
  //eatSound = loadSound('assets/sounds/eat.mp3');  

}


function addObstacle() {
  obstacles.push(new Obstacle(random(width), random(height), random(90, 100), "green"));
}
// SETUP
function setup() {
  createCanvas(windowWidth, windowHeight);
  pursuer2 = new Vehicle(random(width), random(height));

  // Ajouter un véhicule de départ
  pursuer1 = new Vehicle(100, 100, followerImage);
  vehicules.push(pursuer1);
  obstacles.push(new Obstacle(width / 2, height / 2, 100, "green"));

  // Créer des sliders
  const posYSliderDeDepart = 10;
  creerUnSlider("Vitesse Justin bieber", flock, 0, 40, 3, 0.1, 10, 10, "maxSpeed");
  creerUnSlider("Size Justin Bieber", flock, 4, 40, 6, 1, 10, 40, "r");

  // Créations de Justin Bieber
  for (let i = 0; i < 20; i++) {
    const b = new Boid(random(width), random(height), boidImage);
    b.r = (40);
    flock.push(b);
  }

  // Créer un objet Vehicle à une position donnée
  follower = new Vehicle(width / 2, height / 2); // Position initiale au centre

  // Créer un label avec le nombre de boids
  labelNbBoids = createP("Nombre de boids : " + flock.length);
  labelNbBoids.style('color', 'white');
  labelNbBoids.position(10, posYSliderDeDepart + 70);

  // Diddy prédateur
  diddy = new Boid(width / 2, height / 2, diddyimage);
  diddy.r = 60;
  diddy.maxSpeed = 7;
  diddy.maxForce = 0.5;

  setInterval(addObstacle, obstacleInterval);

}

//FCT DES SLIDERS
function creerUnSlider(label, tabVehicules, min, max, val, step, posX, posY, propriete) {
  let slider = createSlider(min, max, val, step);
  let labelP = createP(label);
  labelP.position(posX, posY);
  labelP.style('color', 'white');

  slider.position(posX + 150, posY + 17);
  let valueSpan = createSpan(slider.value());
  valueSpan.position(posX + 300, posY + 17);
  valueSpan.style('color', 'white');
  valueSpan.html(slider.value());

  slider.input(() => {
    valueSpan.html(slider.value());
    tabVehicules.forEach(vehicle => {
      vehicle[propriete] = slider.value();
    });
  });
}

// DRAW
function draw() {
  // Effet de traînée 
  background(0);

  if (isLeaderMode) {
    target.leaderBehavior =( createVector(mouseX, mouseY), vehicules); // La cible suit la souris
  }

  fill(255); // Couleur bleue
  text("L  --> ", 20, height - 20);
  text("S  -->", 180, height - 20);
  text("V  -->", 340, height - 20);
  text("O  -->", 520, height - 20);
  text("M  -->", 700, height - 20);

  // Texte des actions en jaune
  fill(255, 255, 0); // Couleur jaune
  text("Leader Mode", 60, height - 20); // L = Leader Mode
  text("Snake Mode", 220, height - 20); // S = Snake Mode
  text("Ajouter Véhicule", 380, height - 20); // V = Ajouter Véhicule
  text("Ajouter Obstacle", 560, height - 20); // O = Ajouter Obstacle
  text("Menu", 740, height - 20); // O = Ajouter Obstacle

  // Position horizontale et verticale
  text(guide, 20, height - 20); // 20px du bord gauche, 20px du bas

  // mettre à jour le nombre de boids
  labelNbBoids.html("Nombre de boids : " + flock.length);

  // Position de la cible basée sur la souris
  target = createVector(mouseX, mouseY);

  // Dessin des obstacles
  obstacles.forEach(obstacle => {
    obstacle.show();
  });

  // Mise à jour et affichage des véhicules
  vehicules.forEach(vehicule => {
    vehicule.applyBehaviors(target, obstacles, vehicules);
    vehicule.update();
    vehicule.show();
  });

    // Afficher tous les obstacles ajoutés
    obstacles.forEach(obstacle => {
      obstacle.show();
    });

  // Mode SNAKE
  vehicules.forEach((vehicule, index) => {
    let steeringForce;
    switch (mode) {
      case "snake":
        if (index === 0) {
          // Le premier véhicule suit la position de diddy
          steeringForce = vehicule.arrive(target, 60);
        } else {
          // Les autres suivent le véhicule précédent
          let vehiculePrecedent = vehicules[index - 1];
          steeringForce = vehicule.arrive(vehiculePrecedent.pos, 70);

          // Force de séparation pour maintenir une distance minimale
          let separationForce = vehicule.separate(vehiculePrecedent);
          steeringForce.add(separationForce);
        }
        break;
      case "default":
        // Mode "texte", suivre la position de diddy
        let targetTexte = createVector(target.x, target.y);
        steeringForce = vehicule.arrive(target, 60);
        break;
    }
    vehicule.applyForce(steeringForce);
    vehicule.update();
    vehicule.show();
  });

  // Diddy suit la souris
  target.x = mouseX;
  target.y = mouseY;
  image(diddyimage, target.x - diddy.r / 2, target.y - diddy.r / 2, diddy.r, diddy.r);

  // Diddy mange les boids
  for (let i = flock.length - 1; i >= 0; i--) {
    let boid = flock[i];
    let d = p5.Vector.dist(target, boid.pos);
    if (d < diddy.r / 2) {
      flock.splice(i, 1);
      
    }
  }

  // Dessiner les boids
  for (let boid of flock) {
    boid.flock(flock);
    boid.fleeWithTargetRadius(target); // Les boids fuient aussi la position de diddy
    boid.update();
    boid.show();
  }

  // Vérifier si tous les boids sont mangés et rediriger
  if (flock.length === 0) {
    window.location.href = 'gameover.html';  // Rediriger vers newgame.html
  }
}

// KEYS
function keyPressed() {
      // ajout police
  if (key == "v" || key === 'V') {
    let newVehicle = new Vehicle(random(width), random(height), followerImage); // Assurez-vous que l'image est définie
    vehicules.push(newVehicle);  }
        // DEBUG
  if (key == "d" || key === 'D'){
    Vehicle.debug = !Vehicle.debug;
  } 
  if (key === 'm'|| key === 'M')  {
    // Rediriger vers newgame.js
    window.location.href = 'newgame.html';  // Assurez-vous que le fichier newgame.html existe et est accessible
  }
      // Snake MODE
else if (key === 's' || key === 'S') {
    mode = (mode === "default") ? "snake" : "default";
  }     // FBI ajout aleatoire
else if (key == "o" || key === 'O') {
    obstacles.push(new Obstacle(random(width), random(height), random(80, 100), "green"));
  } else if (key === 'l' || key === 'L') {
    isLeaderMode = !isLeaderMode;

  }
}

