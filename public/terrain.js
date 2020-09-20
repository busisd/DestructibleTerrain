const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
});

document.body.appendChild(app.view);


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


app.stage.interactive = true;
app.stage.on(
  "pointerdown",
  ({data: {button, global: {x, y}}}) => {
    console.log(button, x, y);

    circleFor(x, y, 40, (curX, curY) => mapContext.clearRect(curX, curY, 1, 1));

    newTexture.update();
  }
);

// app.ticker.add((delta) => {

// });
