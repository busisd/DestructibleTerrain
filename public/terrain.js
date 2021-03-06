const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);

document.body.oncontextmenu = function (e) {
  e.preventDefault();
};

pixelMap = document.createElement('canvas');
pixelMap.width = GAME_WIDTH;
pixelMap.height = GAME_HEIGHT;
mapContext = pixelMap.getContext("2d");
mapContext.fillStyle = "rgba("+0+","+0+","+0+","+1.0+")";

for (let i=0; i<GAME_HEIGHT*GAME_WIDTH; i++) {
  let curX = i%GAME_WIDTH;
  let curY = Math.floor(i/GAME_WIDTH);
  if (curY > Math.sin(curX/GAME_WIDTH*2*Math.PI)*50+200)
    mapContext.fillRect(curX, curY, 1, 1);
}

var newTexture = PIXI.Texture.from(pixelMap);
var new1 = PIXI.Sprite.from(newTexture);
new1.x = 0;
new1.y = 0;
app.stage.addChild(new1);

function circleFor(baseX, baseY, radius, fxn) {
  const radiusSquared = radius ** 2;
  let dataArr = [];

  for (let curY=baseY-radius; curY<=baseY+radius; curY++) {
    const curWidth = Math.floor(Math.sqrt(radiusSquared - (baseY-curY)**2));

    for (let curX=baseX-curWidth; curX<=baseX+curWidth; curX++) {  
      fxn(curX, curY, dataArr);
    }
  }

  return dataArr;
}

function explodeAt(x, y, radius) {
  circleFor(x, y, radius, (curX, curY) => mapContext.clearRect(curX, curY, 1, 1));
  newTexture.update();
}

const avgPoint2D = (points) => {
  finalPoint = [0,0];
  for (point of points) {
    finalPoint[0] += point[0];
    finalPoint[1] += point[1];
  }

  finalPoint[0]/=points.length;
  finalPoint[1]/=points.length;

  return finalPoint;
}

const dotProd2D = (vec1, vec2) => (
  vec1[0]*vec2[0] + vec1[1]*vec2[1]
);

const multiplyVect2D = (vec, num) => (
  [vec[0]*num, vec[1]*num]
);

const vectMagnitude2D = vec => (
  Math.sqrt(vec[0]**2 + vec[1]**2)
);

const normalizeVect2D = vec => {
  const magnitude = vectMagnitude2D(vec);
  return [vec[0]/magnitude, vec[1]/magnitude];
}

const subtractVect2D = (vec1, vec2) => (
  [vec1[0]-vec2[0], vec1[1]-vec2[1]]
)

const pointsToVect = (p1, p2) => (
  [p2[0]-p1[0], p2[1]-p1[1]]
);

const fireballGraphics = new PIXI.Graphics();
app.stage.addChild(fireballGraphics);
class Fireball {
  constructor(xPos, yPos) {
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = xPos;
    this.y = yPos;
    this.radius = 7;
    this.color = 0xAA0000;
    this.alive = true;
    this.timeAlive = 0;
    this.explodeTime = 3000;
    this.bounciness = .6;
    this.explosionRadius = 50;
  }
  
  remove() {
    fireballList.splice(fireballList.indexOf(this), 1);
  }

  explode() {
    explodeAt(Math.floor(this.x), Math.floor(this.y), this.explosionRadius);
  }

  accelerate(delta) {
    this.yVelocity += .1 * delta;
  }

  checkTimeout() {
    if (this.timeAlive > this.explodeTime) {
      this.alive = false;
      this.explode();
    }
  }

  checkOutOfBounds() {
    if (this.x < -this.radius || this.x > GAME_WIDTH + this.radius || this.y < -this.radius || this.y > GAME_HEIGHT + this.radius) {
      this.alive = false;
    }
  }

  checkCollision() {
    const data = circleFor(Math.floor(this.x), Math.floor(this.y), this.radius, (x, y, dataArr) => {
      if (mapContext.getImageData(x,y,1,1).data[3] > 0) {
        dataArr.push([x,y]);
      }
    });

    if (data.length > 0) {
      const collisionPoint = avgPoint2D(data);
      const bounceVect = pointsToVect(collisionPoint, [this.x, this.y]);

      const bounceVectMagnitude = vectMagnitude2D(bounceVect);
      if (bounceVectMagnitude < .05 * this.radius) {
        this.xVelocity = 0;
        this.yVelocity = 0;
        return;
      }

      const bounceVectNormalized = normalizeVect2D(bounceVect);
      const dotProd = dotProd2D([this.xVelocity, this.yVelocity], bounceVectNormalized);
      const multipliedBounceVect = multiplyVect2D(bounceVectNormalized, 2*dotProd);
      const finalVelocity = subtractVect2D([this.xVelocity, this.yVelocity], multipliedBounceVect);
      const finalVelocityLossOfEnergy = multiplyVect2D(finalVelocity, this.bounciness);

      this.xVelocity = finalVelocityLossOfEnergy[0];
      this.yVelocity = finalVelocityLossOfEnergy[1];

      const bounceVectCorrection = multiplyVect2D(bounceVect, 1 - (bounceVectMagnitude/(this.radius+1)));
      this.x += bounceVectCorrection[0];
      this.y += bounceVectCorrection[1];
    }
  }

  move() {
    this.x += this.xVelocity;
    this.y += this.yVelocity;
  }

  draw() {
    fireballGraphics.beginFill(this.color);
    fireballGraphics.drawCircle(this.x, this.y, this.radius);
    fireballGraphics.endFill();
  }

  update(delta, deltaMS) {
    this.timeAlive += deltaMS;
    this.checkOutOfBounds();
    if (!this.alive) {
      this.remove();
      return;
    }
    this.accelerate(delta);
    this.checkTimeout();
    if (!this.alive) {
      this.remove();
      return;
    }
    this.checkCollision();
    this.move(delta);
    this.draw();
  }
}

class ContactFireball extends Fireball {
  constructor(xPos, yPos) {
    super(xPos, yPos);
    this.color = 0xFF0000;
    this.explosionRadius = 35;
    this.radius = 5;
  }

  checkCollision() {
    const data = circleFor(Math.floor(this.x), Math.floor(this.y), this.radius, (x, y, dataArr) => {
      if (mapContext.getImageData(x,y,1,1).data[3] > 0) {
        dataArr.push([x,y]);
      }
    });

    if (data.length > 0) {
      this.alive = false;
    }
  }

  update(delta) {
    this.checkOutOfBounds();
    if (!this.alive) {
      this.remove();
      return;
    }

    this.accelerate(delta);

    this.checkCollision();
    if (!this.alive) {
      this.explode();
      this.remove();
      return;
    }

    this.move(delta);
    this.draw();
  }
}

app.stage.interactive = true;
app.stage.on(
  "pointerdown",
  ({data: {button, global: {x, y}}}) => {
    if (button == 1) {
      explodeAt(x, y, 40);
    } else if (button == 0) {
      const newFB = new Fireball(Math.floor(x), Math.floor(y));
      fireballList.push(newFB);
    } else if (button == 2) {
      const newFB = new ContactFireball(Math.floor(x), Math.floor(y));
      fireballList.push(newFB);
    }
  }
);

var fireballList = [];

app.ticker.add((delta) => {
  fireballGraphics.clear();
  for (curFireball of fireballList) {
    curFireball.update(delta, app.ticker.deltaMS);
  }
});
