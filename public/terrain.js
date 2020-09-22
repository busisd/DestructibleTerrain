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
  for (let curY=baseY-radius; curY<=baseY+radius; curY++) {
    const curWidth = Math.floor(Math.sqrt(radiusSquared - (baseY-curY)**2));

    for (let curX=baseX-curWidth; curX<=baseX+curWidth; curX++) {  
      fxn(curX, curY);
    }
  }
}


const fireballGraphics = new PIXI.Graphics();
app.stage.addChild(fireballGraphics);


class FireBall {
  constructor(xPos, yPos) {
    this.xVelocity = 0;
    this.yVelocity = 0;
    this.x = xPos;
    this.y = yPos;
    this.radius = 10;
    this.color = 0xFF0000;
    this.alive = true;
  }
  
  remove() {
    fireballList.splice(fireballList.indexOf(this), 1);
  }

  accelerate(delta) {
    this.yVelocity += .1 * delta;
  }

  checkCollision() {
    if (this.x < -this.radius || this.x > GAME_WIDTH + this.radius || this.y < -this.radius || this.y > GAME_HEIGHT + this.radius) {
      this.alive = false;
      return;
    }

    circleFor(Math.floor(this.x), Math.floor(this.y), this.radius, (x, y) => {
      if (mapContext.getImageData(x,y,1,1).data[3] > 0) {
        this.alive = false;
      }
    });
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

  update(delta) {
    this.accelerate(delta);
    this.checkCollision();
    if (this.alive) {
      this.move(delta);
      this.draw();
    } else {
      this.remove();
    }
  }
}

app.stage.interactive = true;
app.stage.on(
  "pointerdown",
  ({data: {button, global: {x, y}}}) => {
    if (button != 0) {
      circleFor(x, y, 40, (curX, curY) => mapContext.clearRect(curX, curY, 1, 1));
      newTexture.update();
    } else {
      const newFB = new FireBall(Math.floor(x), Math.floor(y));
      fireballList.push(newFB);
    }
  }
);

const fb1 = new FireBall(20, 100);
var fireballList = [fb1];

app.ticker.add((delta) => {
  fireballGraphics.clear();
  for (curFireball of fireballList) {
    curFireball.update(delta);
  }
});
