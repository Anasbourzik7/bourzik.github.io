  function findProjection(pos, a, b) {
    let v1 = p5.Vector.sub(a, pos);
    let v2 = p5.Vector.sub(b, pos);
    v2.normalize();
    let sp = v1.dot(v2);
    v2.mult(sp);
    v2.add(pos);
    return v2;
  }
  class Vehicle {
    static debug = false;
    constructor(x, y, img) {
      this.pos = createVector(x, y);
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      this.maxSpeed = 10;
      this.maxForce = 0.6;
      this.r = 16; // Rayon de référence
      this.rayonZoneDeFreinage = 100;
      this.img = img;  // L'image du véhicule
      this.scale = 2;  // Facteur d'échelle pour l'image
        // Pour évitement d'obstacle
        this.distanceAhead = 50;
        this.largeurZoneEvitementDevantVaisseau = this.r / 2;    
        // chemin derrière vaisseaux
        this.path = [];
        this.pathMaxLength = 30;
        // Paramètres pour separate (on pourra ajouter un curseur)
        this.distanceSeparation = this.r;

      this.color = "white";
      // à peu près en secondes
      this.dureeDeVie = 5;
  
      this.r_pourDessin = 16;
      // rayon du véhicule pour l'évitement
      this.r = this.r_pourDessin * 3;
  
      // Pour évitement d'obstacle
      this.distanceAhead = 50;
      this.largeurZoneEvitementDevantVaisseau = this.r / 2;
  
      // chemin derrière vaisseaux
      this.path = [];
      this.pathMaxLength = 30;
  
      // Paramètres pour separate (on pourra ajouter un curseur)
      this.distanceSeparation = this.r;
    }
    // seek & avoid
    applyBehaviors(target, obstacles, vehicles, leaderPos = null) {
      if (leaderPos) {
        this.leaderBehavior(leaderPos, vehicles);
      } else {
        let seekForce = this.arrive(target);
        let avoidForce = this.avoid(obstacles, vehicles);
        let separateForce = this.separate(vehicles);
    
        seekForce.mult(0.7);
        avoidForce.mult(2);
        separateForce.mult(0.7);
    
        this.applyForce(seekForce);
        this.applyForce(avoidForce);
        this.applyForce(separateForce);
      }
    }
    
    getObstacleLePlusProche(obstacles) {
      let plusPetiteDistance = 100000000;
      let obstacleLePlusProche = undefined;
  
      obstacles.forEach(o => {
        // Je calcule la distance entre le vaisseau et l'obstacle
        const distance = this.pos.dist(o.pos);
  
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          obstacleLePlusProche = o;
        }
      });
  
      return obstacleLePlusProche;
    }
    avoid(obstacles, considereVehiculesCommeObstacles = false) {
      // On calcule un point devant le véhicule courant
      // on l'appelle ahead
      let ahead = this.vel.copy();
      ahead.mult(this.distanceAhead);
      // On calcule ahead2 à mi-distance
      let ahead2 = this.vel.copy();
      ahead2.mult(this.distanceAhead / 2);
  
      if (Vehicle.debug) {
        // on dessine le vecteur vitesse en jaune
        this.drawVector(this.pos, ahead, "yellow");
        this.drawVector(this.pos, ahead2, "lightblue");
      }
      // Pour le dessiner, il faut lui ajouter la position du véhicule
      ahead.add(this.pos);
      ahead2.add(this.pos);
  
      if (Vehicle.debug) {
        // on le dessine en rouge
        fill("red");
        circle(ahead.x, ahead.y, 10);
        fill("green");
        circle(ahead2.x, ahead2.y, 10);
      }
      // On cherche l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
  
      // on considère aussi les autres véhicules comme des obstacles potentiels
      let vehiculeLePlusProche, distance4 = 100000000;
  
      if (considereVehiculesCommeObstacles) {
        vehiculeLePlusProche = this.getVehiculeLePlusProche(vehicules);
        // on considère aussi le véhicule le plus proche
        if (vehiculeLePlusProche !== undefined) {
          distance4 = this.pos.dist(vehiculeLePlusProche.pos)
        }
      }
  
      // On calcule la distance entre la position de l'obstacle le plus proche
      // et le point ahead
      let distance = ahead.dist(obstacleLePlusProche.pos);
      let distance2 = ahead2.dist(obstacleLePlusProche.pos);
      // on prend aussi le vaisseau lui-même
      let distance3 = this.pos.dist(obstacleLePlusProche.pos)
  
  
      // distance = la plus petite des deux
      distance = min(distance, distance2);
      distance = min(distance, distance3);
      distance = min(distance, distance4);
  
      if (distance === distance4) {
        obstacleLePlusProche = vehiculeLePlusProche;
      }
  
  
      // si distance < rayon de l'obstacle + rayon du véhicule
      // Alors il y a collision possible, on calcule la force d'évitement
      if (distance < obstacleLePlusProche.r + this.r / 2) {
        // collision possible, on calcule le vecteur qui va 
        // du centre de l'obstacle jusqu'au point ahead, il représente
        // la direction dans laquelle on doit aller pour éviter l'obstacle
        // c'est la force ou la vitesse désirée ?
        let desiredSpeed;
  
        if (distance === distance2) {
          // c'est le point ahead2 le plus proche
          // c'est le point au bout, ahead, le plus proche
          desiredSpeed = p5.Vector.sub(ahead2, obstacleLePlusProche.pos);
        } else if (distance === distance3) {
          // c'est le vaisseau le plus proche
          desiredSpeed = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
        } else if (distance === distance4) {
          // l'obstacle le plus proche est un véhicule
          desiredSpeed = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
        } else {
          // c'est le point au bout, ahead, le plus proche
          desiredSpeed = p5.Vector.sub(ahead, obstacleLePlusProche.pos);
        }
  
        if (Vehicle.debug) {
          this.drawVector(obstacleLePlusProche.pos, desiredSpeed, "pink");
        }
  
        // on calcule la force
        // 1 - on la met au maximum
        desiredSpeed.setMag(this.maxSpeed);
        // 2 - formule magique : force = vitesse desiree - vitesse actuelle
        let force = p5.Vector.sub(desiredSpeed, this.vel);
  
        // on la limite
        force.limit(this.maxForce);
  
        // et on la renvoie
        return force;
      }
  
      return createVector(0, 0);
  
    }
    evade(vehicle) {
      let pursuit = this.pursue(vehicle);
      pursuit.mult(-1);
      return pursuit;
    }
    separate(vehicules) {
      let desiredSeparation = this.distanceSeparation;  // Distance minimale de séparation
      let steer = createVector(0, 0);  // Vecteur de direction à appliquer
      let count = 0;  // Compteur pour la normalisation
    
      // Parcourir tous les autres véhicules
      for (let other of vehicules) {
        // Calculer la distance entre ce véhicule et les autres
        
        let d = this.pos.dist(other.pos);
        
        // Vérifier si la distance est inférieure à la distance de séparation
        if (d > 0 && d < desiredSeparation) {
          let diff = p5.Vector.sub(this.pos, other.pos);  // Calculer la différence de position
          diff.normalize();  // Normaliser pour ne pas influer sur la distance
          diff.div(d);  // L'inverse de la distance pour augmenter l'effet quand on est proche
          steer.add(diff);  // Ajouter à la direction de fuite
          count++;  // Incrémenter le compteur
        }
      }
    
      // Si des véhicules proches ont été trouvés, ajuster la direction
      if (count > 0) {
        steer.div(count);  // Moyenne des forces de séparation
      }
    
      // Appliquer un ajustement à la force
      if (steer.mag() > 0) {
        steer.setMag(this.maxSpeed);  // Appliquer la vitesse maximale
        steer.sub(this.vel);  // Calculer la différence avec la vitesse actuelle
        steer.limit(this.maxForce);  // Limiter la force pour éviter des accélérations trop fortes
      }
    
      return steer;
    }
    avoidCorrige(obstacles) {
      // calcul d'un vecteur ahead devant le véhicule
      // il regarde par exemple 50 frames devant lui
      let ahead = this.vel.copy();
      ahead.mult(30);
      //on calcue ahead2 deux fois plus petit
      let ahead2 = ahead.copy();
      ahead2.mult(0.5);
  
      // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
      this.drawVector(this.pos, ahead, "yellow");
  
      // Calcul des coordonnées du point au bout de ahead
      let pointAuBoutDeAhead = this.pos.copy().add(ahead);
      let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);
  
      // Detection de l'obstacle le plus proche
      let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);
  
      // Si pas d'obstacle, on renvoie un vecteur nul
      if (obstacleLePlusProche == undefined) {
        return createVector(0, 0);
      }
  
      // On calcule la distance entre le cercle et le bout du vecteur ahead
      let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
      let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
      let distance = min(distance1, distance2);
  
  
      // On dessine le point au bout du vecteur ahead pour debugger
      fill("red");
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
      fill("blue");
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
  
      // On dessine la zone d'évitement
      // Pour cela on trace une ligne large qui va de la position du vaisseau
      // jusqu'au point au bout de ahead
      stroke(100, 100);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
  
      // si la distance est < rayon de l'obstacle
      // il y a collision possible et on dessine l'obstacle en rouge
  
      if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau + this.r) {
        // collision possible 
  
        // calcul de la force d'évitement. C'est un vecteur qui va
        // du centre de l'obstacle vers le point au bout du vecteur ahead
        let force;
        if (distance1 < distance2) {
          force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
        }
        else {
          force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
        }
        // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");
  
        // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
        // on limite ce vecteur à la longueur maxSpeed
        // force est la vitesse désirée
        force.setMag(this.maxSpeed);
        // on calcule la force à appliquer pour atteindre la cible avec la formule
        // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
        force.sub(this.vel);
        // on limite cette force à la longueur maxForce
        force.limit(this.maxForce);
        return force;
      } else {
        // pas de collision possible
        return createVector(0, 0);
      }
    } 
    // les bords du canvas
    boundaries() {
      const d = 25;
  
      let desired = null;
  
      // si le véhicule est trop à gauche ou trop à droite
      if (this.pos.x < d) {
        desired = createVector(this.maxSpeed, this.vel.y);
      } else if (this.pos.x > width - d) {
        desired = createVector(-this.maxSpeed, this.vel.y);
      }
  
      if (this.pos.y < d) {
        desired = createVector(this.vel.x, this.maxSpeed);
      } else if (this.pos.y > height - d) {
        desired = createVector(this.vel.x, -this.maxSpeed);
      }
  
      if (desired !== null) {
        desired.normalize();
        desired.mult(this.maxSpeed);
        const steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
      }
      return createVector(0, 0);
    }
    getVehiculeLePlusProche(vehicules) {
      let plusPetiteDistance = Infinity;
      let vehiculeLePlusProche;
  
      vehicules.forEach(v => {
        if (v != this) {
          // Je calcule la distance entre le vaisseau et le vehicule
          const distance = this.pos.dist(v.pos);
          if (distance < plusPetiteDistance) {
            plusPetiteDistance = distance;
            vehiculeLePlusProche = v;
          }
        }
      });
  
      return vehiculeLePlusProche;
    }
    getClosestObstacle(pos, obstacles) {
      // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
      let closestObstacle = null;
      let closestDistance = 1000000000;
      for (let obstacle of obstacles) {
        let distance = pos.dist(obstacle.pos);
        if (closestObstacle == null || distance < closestDistance) {
          closestObstacle = obstacle;
          closestDistance = distance;
        }
      }
      return closestObstacle;
    }
    arrive(target, d = 0) {
      return this.seek(target, true, d);
    }
    seek(target, arrival = false, d = 0) {
      let desiredSpeed = p5.Vector.sub(target, this.pos);
      let desiredSpeedMagnitude = this.maxSpeed;
  
      if (arrival) {
        if (Vehicle.debug) {
          noFill();
          stroke("white")
          circle(this.x, this.y, this.rayonZoneDeFreinage * 2);
        }
  
        const dist = p5.Vector.dist(this.pos, target);
        if (dist < this.rayonZoneDeFreinage) {
          desiredSpeedMagnitude = map(dist, d, this.rayonZoneDeFreinage, 0, this.maxSpeed);
        }
      }
  
      desiredSpeed.setMag(desiredSpeedMagnitude);
      let force = p5.Vector.sub(desiredSpeed, this.vel);
      force.limit(this.maxForce);
  
      if (Vehicle.debug) {
        stroke("green");
        line(this.pos.x, this.pos.y, this.pos.x + force.x * 10, this.pos.y + force.y * 10);
      }
  
      return force;
    }
    fleeWithTargetRadius(target) {
      let desired = p5.Vector.sub(this.pos, target);
      let d = desired.mag();
      if (d < this.r) {
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        this.applyForce(steer);
      }
    }
    // != seek
    flee(target) {
      return this.seek(target.pos).mult(-1);
    }
    /* Poursuite d'un point devant la target !*/
    pursue(vehicle) {
      let target = vehicle.pos.copy();
      let prediction = vehicle.vel.copy();
      prediction.mult(10);
      target.add(prediction);
      fill(0, 255, 0);
      circle(target.x, target.y, 16);
      return this.seek(target);
    }
    // Comportement Separation :
    separate(boids) {
      let desiredseparation = this.distanceSeparation;
      let steer = createVector(0, 0, 0);
      let count = 0;
      // On examine les autres boids pour voir s'ils sont trop près
      for (let i = 0; i < boids.length; i++) {
        let other = boids[i];
        let d = p5.Vector.dist(this.pos, other.pos);
        // Si la distance est supérieure à 0 et inférieure à une valeur arbitraire (0 quand on est soi-même)
        if (d > 0 && d < desiredseparation) {
          // Calculate vector pointing away from neighbor
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.normalize();
          diff.div(d); // poids en fonction de la distance. Plus le voisin est proche, plus le poids est grand
          steer.add(diff);
          count++; // On compte le nombre de voisins
        }
      }
      // On moyenne le vecteur steer en fonction du nombre de voisins
      if (count > 0) {
        steer.div(count);
      }
  
      // si la force de répulsion est supérieure à 0
      if (steer.mag() > 0) {
        // On implemente : Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
      }
      return steer;
    }
    // applyForce 
    applyForce(force) {
      this.acc.add(force);
    }
    update() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.acc.set(0, 0);
    }
    ajoutePosAuPath() {
      // on rajoute la position courante dans le tableau
      this.path.push(this.pos.copy());
  
      // si le tableau a plus de 50 éléments, on vire le plus ancien
      if (this.path.length > this.pathMaxLength) {
        this.path.shift();
      }
    }
  // leader
  leaderBehavior(leaderPos, vehicles) {
    console.log("Distance to leader:", p5.Vector.dist(this.pos, leaderPos));
    let distanceToLeader = p5.Vector.dist(this.pos, leaderPos);
  
    if (distanceToLeader > this.r * 2) {
      let followLeaderForce = this.seek(leaderPos);
      this.applyForce(followLeaderForce);
    } else {
      vehicles.forEach(other => {
        if (other !== this) {
          let distanceToOther = p5.Vector.dist(this.pos, other.pos);
          if (distanceToOther < this.distanceSeparation) {
            let separateForce = this.separate(vehicles);
            this.applyForce(separateForce);
          }
        }
      });
    }
  }
  
  
    // On dessine le véhicule, le chemin etc.
    show() {
      imageMode(CENTER);
      image(this.img, this.pos.x, this.pos.y, 100, 100); // Taille réduite à 40x40
    }
    drawVehicle() {
      // formes fil de fer en blanc
      stroke(255);
      // épaisseur du trait = 2
      strokeWeight(2);
      // formes pleines
      fill(this.color);
      // position et rotation du repère de référence)
      push();
      // on déplace le repère de référence.
      translate(this.pos.x, this.pos.y);
      // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
      rotate(this.vel.heading());
      // CERCLE DEBUGG
      
      if (Vehicle.debug) {
        stroke(255);
        noFill();
        circle(0, 0, this.r);
      }
      // draw velocity vector
      pop();
      this.drawVector(this.pos, this.vel, color(255, 0, 0));
  
    
    }
    drawPath() {
      push();
      stroke(255);
      noFill();
      strokeWeight(1);
      fill(this.color);
      // dessin du chemin
      this.path.forEach((p, index) => {
        if (!(index % 5)) {circle(p.x, p.y, 1);}});
      pop(); }
    drawVector(pos, v, color) {
      push();
      // Dessin du vecteur vitesse
      strokeWeight(3);
      stroke(color);
      line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
      // dessine une petite fleche au bout du vecteur vitesse
      let arrowSize = 5;
      translate(pos.x + v.x, pos.y + v.y);
      rotate(v.heading());
      translate(-arrowSize / 2, 0);
      triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
      pop(); }
      edges() {
      if (this.pos.x > width + this.r) {
        this.pos.x = -this.r;
      } else if (this.pos.x < -this.r) {
        this.pos.x = width + this.r;
      }
      if (this.pos.y > height + this.r) {
        this.pos.y = -this.r;
      } else if (this.pos.y < -this.r) {
        this.pos.y = height + this.r;
      } } }
  class Target extends Vehicle {
    constructor(x, y) {
      super(x, y);
      this.vel = p5.Vector.random2D();
      this.vel.mult(5);
    }
  
    show() {
      push();
      stroke(255);
      strokeWeight(2);
      fill("#F063A4");
      push();
      translate(this.pos.x, this.pos.y);
      circle(0, 0, this.r * 2);
      pop();
      pop();
    } }