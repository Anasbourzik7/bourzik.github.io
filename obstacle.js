class Obstacle {
  constructor(x, y, r, couleur) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = couleur;
  }

  show() {
    push();
    imageMode(CENTER);
    image(obstacleImg, this.pos.x, this.pos.y, this.r * 2, this.r * 2);
    pop();
  }
  
}

