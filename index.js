var ctx = canvasPlus('canvas'), // canvas context
canvas = document.getElementById('canvas'), // canvas element
keys = { // object containing keyCodes for common keys
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  SPACE: 32
},
width = canvas.width,
scale = width / 20, // size of one square/jewel
grid = [], // grid containing all jewels on screen
gridTemp = [], // grid containing all jewels on screen except current falling block
block,
next = [], // array containing next 3 blocks
i,
selected, // x and y values jewel selected for swap
game = true, // boolean for whether or not game is running
score = 0,
multiplier = 1,
clone = function (arr) { // function for cloning bi-dimensional arrays
  var retval = [],
  i,
  j;
  for (i = 0; i < arr.length; i += 1) {
    retval[i] = [];
    for (j = 0; j < arr[i].length; j += 1) {
      retval[i][j] = arr[i][j];    
    }
  }
  return retval;
},
drawBG = function () { // draws background, text, and 3 next blocks
  var i;
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.font = '14px Arial, Helvetica, sans-serif';
  for (i = 5 * scale; i <= 15 * scale; i += scale) {
    ctx.drawLine(i, 0, i, width);  
  }
  for (i = 0; i < width; i += scale) {
    ctx.drawLine(5 * scale, i, 15 * scale, i);  
  }
  ctx.fillText('Score: ' + score, 10, 20);
  ctx.fillText('Multiplier: x' + multiplier, 10, 35);
  ctx.font = '20px Arial, Helvetica, sans-serif';
  ctx.fillText('Next:', 15 * scale + 10, 26);
  if (game) {
    for (i = 0; i < next.length; i += 1) {
      next[i].draw(15 * scale + 10, i * scale * 4 + 30);  
    }
  }
},
Jewel = function () { // individual square/jewel
  var images = ['red', 'purple', 'green', 'yellow', 'cyan'],
  img = new Image();
  this.type = Math.floor(Math.random() * 5); // random number between 0 and 4
  img.src = 'gems/' + images[this.type] + '.png';
  this.draw = function () {
	ctx.drawImage(img, 0, 0, scale, scale);
  };
},
drawJewels = function (matches) { // if matches property is defined, draws cracks on given jewels
  var i,
  j;
  ctx.clear();
  drawBG();
  for (i = 0; i < 20; i += 1) {
    for (j = 0; j < 10; j += 1) {
      if (grid[i][j] instanceof Jewel) {
        ctx.save();
        ctx.translate((5 + j) * scale, i * scale);
        grid[i][j].draw();
        ctx.restore();
      }
    }
  }
  if (matches) {
	for (i = 0; i < matches.length; i += 1) {
      x = matches[i][1];
      y = matches[i][0];
      ctx.save();
	  ctx.translate((5 + x) * scale, y * scale);
	  ctx.lineWidth = 1;
	  ctx.drawLine(scale / 2, 0, scale / 4, scale / 3);
	  ctx.drawLine(scale / 3, scale / 3, 2 * scale / 3, 2 * scale / 3);
	  ctx.drawLine(2 * scale / 3, 2 * scale / 3, scale / 2, scale);
	  ctx.restore();
    }  
  }
  if (selected) { // draws focus square around selected jewel
    ctx.save();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 3;
    ctx.drawRect('stroke', (selected.x + 5) * scale, selected.y * scale, scale, scale);
    ctx.restore();
  }
},
gameOver = function () { 
  if (!confirm('Game Over!  Play again?')) {
    dropBlock = clearInterval(dropBlock);
    game = false;
  }
  else {
    for (i = 0; i < 20; i += 1) {
      grid[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    next = [new Block(), new Block(), new Block()];
    gridTemp = clone(grid);
    score = 0;
    multiplier = 1;
    drawBG();
    createBlock();
  }
},
Block = function () { // block consisting of 4 jewels
  var i,
  j;
  this.type = Math.floor(Math.random() * 7); // random number between 0 and 6
  this.grid = [[0, 0, 0, 0],
               [0, 0, 0, 0],
               [0, 0, 0, 0],
               [0, 0, 0, 0]];
  this.pos = [-1, 3]; // position on main grid
  this.newBlock = true; // true if block has yet to be placed
  if (this.type === 0) { // ....
    this.grid[1][0] = new Jewel();
    this.grid[1][1] = new Jewel();
    this.grid[1][2] = new Jewel();
    this.grid[1][3] = new Jewel();
  }
  if (this.type === 1) { // :..
    this.grid[1][0] = new Jewel();
    this.grid[2][0] = new Jewel();
    this.grid[2][1] = new Jewel();
    this.grid[2][2] = new Jewel();
  }
  if (this.type === 2) { // ..:
    this.grid[1][2] = new Jewel();
    this.grid[2][0] = new Jewel();
    this.grid[2][1] = new Jewel();
    this.grid[2][2] = new Jewel();
  }
  if (this.type === 3) { // ::
    this.grid[1][1] = new Jewel();
    this.grid[2][1] = new Jewel();
    this.grid[1][2] = new Jewel();
    this.grid[2][2] = new Jewel();
  }
  if (this.type === 4) { // .:*
    this.grid[1][1] = new Jewel();
    this.grid[1][2] = new Jewel();
    this.grid[2][0] = new Jewel();
    this.grid[2][1] = new Jewel();
  }
  if (this.type === 5) { // .:.
    this.grid[2][0] = new Jewel();
    this.grid[2][1] = new Jewel();
    this.grid[2][2] = new Jewel();
    this.grid[1][1] = new Jewel();
  }
  if (this.type === 6) { // *:.
    this.grid[1][0] = new Jewel();
    this.grid[1][1] = new Jewel();
    this.grid[2][1] = new Jewel();
    this.grid[2][2] = new Jewel();
  }
  this.rotate = function (reverse) { // rotate block given direction parameter
    var orig = clone(this.grid);
    if (reverse) {
      for (i = 0; i < 4; i += 1) {
        for (j = 0; j < 4; j += 1) {
          this.grid[i][j] = orig[j][3 - i]; 
        }
      }
    }
    else {
      for (i = 0; i < 4; i += 1) {
        for (j = 0; j < 4; j += 1) {
          this.grid[i][j] = orig[3 - j][i]; 
        }
      }
    }
  };
  this.draw = function (xOffset, yOffset) { // draw block (for purpose of displaying next blocks
    for (i = 0; i < 4; i += 1) {
      for (j = 0; j < 4; j += 1) {
        if (this.grid[i][j] instanceof Jewel) {
          ctx.save();
          ctx.translate(j * scale + xOffset, i * scale + yOffset);
          this.grid[i][j].draw();
          ctx.restore();
        }
      }
    }
  };
  this.appendGrid = function (matches) { // appends grid with current block, matches argument is passed to drawJewels()
    grid = clone(gridTemp);
    for (i = 0; i < 4; i += 1) {
      for (j = 0; j < 4; j += 1) {
        if (this.grid[i][j] instanceof Jewel) {
          if (j + this.pos[1] < 0) { // if block has hit left edge
            this.pos[1] = -j;
            this.appendGrid();
          }
          if (j + this.pos[1] > 9) { // if block has hit right edge
            this.pos[1] = 9 - j;
            this.appendGrid();
          }
          if (this.newBlock && grid[i + this.pos[0]][j + this.pos[1]] instanceof Jewel) { // if there is no room for new block to be placed
            gameOver();
            return false;
          }
          if (i + this.pos[0] > 19 || grid[i + this.pos[0]][j + this.pos[1]] instanceof Jewel) { // if block has hit downward boundary
            this.pos[0] -= 1;
            this.appendGrid();
            return false;
          }
          grid[i + this.pos[0]][j + this.pos[1]] = this.grid[i][j];
        }
      }
    }
    this.newBlock = false; // once having been placed on the grid, block is no longer new
    drawJewels(matches);
    return true;
  };
  this.checkGrid = function () {
    for (i = 0; i < 4; i += 1) {
      for (j = 0; j < 4; j += 1) { 
        if (this.grid[i][j] instanceof Jewel) {
          if (gridTemp[i + this.pos[0]][j + this.pos[1]] instanceof Jewel) {
            return false;    
          }
        }
      }
    }
    return true;
  };
},
checkMatches = function () {
  var i,
  j,
  matches = [];
  for (i = 0; i < 20; i += 1) {
    for (j = 0; j < 8; j += 1) { // checks for matches going horizontally
      if (gridTemp[i][j] instanceof Jewel && gridTemp[i][j].type === gridTemp[i][j + 1].type && gridTemp[i][j].type === gridTemp[i][j + 2].type) {
        matches.push([i, j]);
        matches.push([i, j + 1]);
        matches.push([i, j + 2]);
      }
    }
  }
  for (i = 0; i < 18; i += 1) {
    for (j = 0; j < 10; j += 1) { // checks for matches going vertically
      if (gridTemp[i][j] instanceof Jewel && gridTemp[i][j].type === gridTemp[i + 1][j].type && gridTemp[i][j].type === gridTemp[i + 2][j].type) {
        matches.push([i, j]);
        matches.push([i + 1, j]);
        matches.push([i + 2, j]);
      }
    }
  }
  return matches;
},
removeMatches = function (checkMultiplier) { // checkMultiplier is true if multiplier should be increased or decreased according to matches
  var matches = checkMatches(),
  x,
  y,
  i,
  j,
  points = 10;
  setTimeout(function () { // draws crack graphic in jewels
    block.appendGrid(matches);
  }, 150);
  setTimeout(function () { // removes jewels
    for (i = 0; i < matches.length; i += 1) {
      score += points * multiplier;
      x = matches[i][1];
      y = matches[i][0];
      gridTemp[y][x] = 0;
      for (j = y - 1; j >= 0; j -= 1) {
        gridTemp[j + 1][x] = gridTemp[j][x];
        gridTemp[j][x];
      }
    }
    if (checkMultiplier) {
      if (matches.length > 0) {
        multiplier *= 2;    
      }
      else if (multiplier > 1) {
        multiplier /= 2;    
      }
    }
    block.appendGrid();
    if (matches.length > 0) {
      removeMatches();  
    }
  }, 300);
},
createBlock = function () {
  removeMatches(true);
  block = next.shift();
  next.push(new Block());
  block.appendGrid();
},
moveBlock = function (dir) { // dir is keyCode value or special value "drop"
  var drop;
  if (game) {
    if (dir === 'drop' || dir === keys.S) {
      block.pos[0] += 1;  
    }
    if (dir === keys.A) {
      block.pos[1] -= 1;
      if (!block.checkGrid()) {
        block.pos[1] += 1;
      }
    }
    if (dir === keys.D) {
      block.pos[1] += 1;
      if (!block.checkGrid()) {
        block.pos[1] -= 1;
      }
    }
    if (dir === keys.W) {
      block.rotate(false);
      if (!block.checkGrid()) {
        block.rotate(true);
      }
    }
    if (dir === keys.SPACE) {
      do {
        drop = moveBlock('drop');
      } while (drop);
    }
    if (!block.appendGrid()) { // if block has hit downward boundary
      gridTemp = clone(grid);
      createBlock();
      return false;
    }
    return true;
  }
},
dropBlock,
start = function () {
  document.onkeydown = function (e) {
    moveBlock(e.keyCode);    
  };
  canvas.onclick = function (e) {
    var y, x, temp, oldGrid, oldGridTemp;
    if (game) {
      y = Math.floor(ctx.mouseY(e) / scale);
      x = Math.floor(ctx.mouseX(e) / scale) - 5;
      if (!selected) {
        if (gridTemp[y][x] instanceof Jewel) {
          selected = {x: x, y: y};
        }
      }
      else if (gridTemp[selected.y][selected.x] && gridTemp[y][x] && ((Math.abs(y - selected.y) === 1 && x === selected.x) || (Math.abs(x - selected.x) === 1 && y === selected.y))) {
        temp = grid[y][x];
        oldGrid = clone(grid);
        oldGridTemp = clone(gridTemp);
        grid[y][x] = grid[selected.y][selected.x];
        grid[selected.y][selected.x] = temp;
        gridTemp[y][x] = gridTemp[selected.y][selected.x];
        gridTemp[selected.y][selected.x] = temp;
        if (checkMatches().length === 0) {
          grid = oldGrid;
          gridTemp = oldGridTemp;
        }
        removeMatches();
        selected = null;
      }
      else {
        selected = null;  
      }
      block.appendGrid();
    }
  };
  for (i = 0; i < 20; i += 1) {
    grid[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  gridTemp = clone(grid);
  next = [new Block(), new Block(), new Block()];
  drawBG();
  createBlock();
  dropBlock = setInterval(function () {moveBlock('drop');}, 750);
};
document.getElementById('start').onclick = function () {
  if (this.innerHTML === 'Start') {
	start();
	this.innerHTML = 'Pause';
  }
  else if (this.innerHTML === 'Pause') {
	ctx.clear();
	game = false;
	this.innerHTML = 'Resume';
  }
  else if (this.innerHTML === 'Resume') {
	game = true;
	drawJewels();
	this.innerHTML = 'Pause';
	this.onclick = pause;
  }
};