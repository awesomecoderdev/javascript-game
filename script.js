class Brick {
	constructor(game, x, y) {
		this.game = game;
		this.x = x;
		this.y = y;
		this.width = 50;
		this.height = 22;
		this.velocityX = 0;
		this.velocityY = 0;
	}
	update() {}
	draw(ctx) {
		var gradient = ctx.createLinearGradient(0, 0, 150, 150);
		gradient.addColorStop(0, "rgb(100, 0, 0)");
		gradient.addColorStop(1, "rgb(200, 30, 10)");
		ctx.fillStyle = gradient;

		//ctx.fillStyle = 'darkred';
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.rect(this.x, this.y, this.width, this.height);
		ctx.stroke();
	}
}

const Waiting = 0;
const Playing = 1;
const Paused = 2;
const GameOver = 3;
const LevelComplete = 4;
const GameComplete = 5;

class Ball {
	constructor(game) {
		this.game = game;
		this.radius = 8.0;
		this.x = 100;
		this.y = 420;
		this.directionX = 0.0;
		this.directionY = 0.0;
		this.velocityX = 0.0;
		this.velocityY = 0.0;
		this.attached = true;
	}
	isAttached() {
		return this.attached;
	}
	launch() {
		if (this.attached == true) {
			this.attached = false;
			this.directionX = 0.0;
			this.directionY = 1.0;
			this.velocityX = 3.0;
			this.velocityY = 3.0;
		}
	}
	checkForBorderCollision() {
		if (this.y + this.radius >= this.game.height) {
			this.directionY *= -1;
			// update the position as well so that it doesn't get stuck
			this.y = this.game.height - this.radius;
			this.game.life--;
			this.attached = true;
			if (!this.game.life) {
				this.game.currentState = GameOver;
			}
		} else if (this.y - this.radius <= 0) {
			this.directionY *= -1;
			// update the position as well so that it doesn't get stuck
			this.y = this.radius;
		}
		if (this.x + this.radius >= this.game.width) {
			this.directionX *= -1;
			// update the position as well so that it doesn't get stuck
			this.x = this.game.width - this.radius;
		} else if (this.x - this.radius <= 0) {
			this.directionX *= -1;
			// update the position as well so that it doesn't get stuck
			this.x = this.radius;
		}
	}
	collisionWithWall(wall) {
		const ballWidth = this.radius * 2;
		const ballHeight = this.radius * 2;

		const xv = this.x - this.radius;
		const yv = this.y - this.radius;

		let collision = false;

		if (
			xv + ballWidth + this.velocityX * this.directionX > wall.x &&
			xv + this.velocityX * this.directionX < wall.x + wall.width &&
			yv + ballHeight > wall.y &&
			yv < wall.y + wall.height
		) {
			this.directionX *= -1;
			collision = true;
		}
		if (
			xv + ballWidth > wall.x + wall.velocityX &&
			xv < wall.x + wall.velocityX + wall.width &&
			yv + ballHeight + this.velocityY * this.directionY > wall.y &&
			yv + this.velocityY * this.directionY < wall.y + wall.height
		) {
			// Hit Position based angle
			if (wall.isPaddle) {
				const playerSize = wall.width / 2;
				const hitPos = this.x - (wall.x + playerSize);
				let normalized = Math.atan(hitPos);
				if (normalized > 1) {
					normalized -= 1;
				} else if (normalized < -1) {
					normalized += 1;
				}
				//console.log(normalized);
				this.directionX = normalized;
			}

			this.directionY *= -1;
			collision = true;
		}
		return collision;
	}
	bounce() {
		// Bounce off game world borders
		this.checkForBorderCollision();
		// Bounce off the paddle
		this.collisionWithWall(this.game.paddle);
		// Bounce off the bricks and remove them
		for (const [i, brick] of this.game.bricks.entries()) {
			const remove = this.collisionWithWall(brick);
			if (remove == true) {
				this.game.bricks.splice(i, 1);
				this.game.totalScore += 5;
			}
		}
		if (this.game.bricks.length < 1) {
			this.game.currentState = GameComplete;
		}
	}
	update() {
		if (this.attached == true) {
			this.x = this.game.paddle.x + this.game.paddle.width / 2;
			this.y = this.game.paddle.y - this.radius - 1.0;
		} else {
			this.bounce();
			this.x += this.velocityX * this.directionX;
			this.y += this.velocityY * this.directionY;
		}
	}
	draw(ctx) {
		ctx.save();
		ctx.shadowColor = "rgb(190, 190, 190)";
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 10;

		ctx.fillStyle = "white";
		//ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2);
		ctx.beginPath();
		ctx.ellipse(
			this.x,
			this.y,
			this.radius,
			this.radius,
			Math.PI / 4,
			0,
			2 * Math.PI
		);
		ctx.fill();

		ctx.strokeStyle = "gray";
		ctx.beginPath();
		ctx.ellipse(
			this.x,
			this.y,
			this.radius,
			this.radius,
			Math.PI / 4,
			0,
			2 * Math.PI
		);
		ctx.stroke();
		ctx.restore();
	}
}

class Paddle {
	constructor(game) {
		this.game = game;
		this.width = 100;
		this.height = 10;
		this.x = 100.0;
		this.y = this.game.height - this.height - 10;
		this.slideSpeed = 7.0;
		this.velocityX = 0;
		this.velocityY = 0;
	}
	isPaddle() {
		return true;
	}
	update() {
		if (this.game.pressedKeys["ArrowLeft"] == true) {
			this.velocityX = -this.slideSpeed;
		} else if (this.game.pressedKeys["ArrowRight"] == true) {
			this.velocityX = this.slideSpeed;
		} else {
			this.velocityX = 0.0;
		}
		this.x += this.velocityX;
		this.y += this.velocityY;
		// Make sure the paddle doesn't go beyond our game world :)
		if (this.x <= 0) {
			this.x = 0;
		} else if (this.x + this.width >= this.game.width) {
			this.x = this.game.width - this.width;
		}
	}
	draw(ctx) {
		ctx.fillStyle = "#10b981";
		ctx.beginPath();
		ctx.roundRect(this.x, this.y, this.width, this.height, [10]);
		ctx.fill();
	}
}

class InputHandler {
	constructor(game) {
		this.game = game;
		window.addEventListener("keydown", (e) => {
			this.game.pressedKeys[e.code] = true;
		});
		window.addEventListener("keyup", (e) => {
			this.game.keyUp(e.code);
			this.game.pressedKeys[e.code] = false;
		});
	}
}

class UI {
	constructor(game) {
		this.game = game;
		this.width = game.width;
		this.height = game.height;
	}
	draw(ctx) {
		const currentState = this.game.currentState;
		if (currentState == Waiting) {
			ctx.fillStyle = "white";
			ctx.font = "bold 40px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"Press space to start game!",
				this.width / 2,
				this.height / 2
			);
		} else if (currentState == Playing || currentState == Paused) {
			// Draw life bars
			ctx.fillStyle = "white";
			ctx.font = "bold 20px Arial";
			ctx.textAlign = "left";
			ctx.fillText("Life : ", 20, 30);

			for (let i = 0; i < this.game.life; i++) {
				ctx.fillStyle = "#f4f4f5";
				ctx.beginPath();
				ctx.ellipse(
					100 + 35 * i,
					23,
					7,
					7,
					Math.PI / 4,
					0,
					2 * Math.PI
				);
				ctx.fill();

				ctx.strokeStyle = "gray";
				ctx.beginPath();
				ctx.ellipse(
					100 + 35 * i,
					23,
					7,
					7,
					Math.PI / 4,
					0,
					2 * Math.PI
				);
				ctx.stroke();
			}

			// Show current total score
			ctx.fillStyle = "white";
			ctx.font = "bold 20px Arial";
			ctx.textAlign = "right";
			ctx.fillText(
				"Current score : " + this.game.totalScore,
				this.width - 30,
				30
			);

			if (currentState == Paused) {
				//const blur = 10;
				const color = "rgba(255, 255, 255, 0.6)";

				ctx.fillStyle = color;
				//ctx.filter = "blur(4px)";
				//ctx.fillRect( -this.width + blur, -this.height + blur, this.width - blur * 2, this.height - blur * 2 );
				ctx.fillRect(0, 0, this.width, this.height);

				ctx.fillStyle = "red";
				ctx.font = "bold 40px Arial";
				ctx.textAlign = "center";
				//ctx.filter = "none";
				ctx.fillText(
					"To go back press space",
					this.width / 2,
					this.height / 2
				);
			} else {
				if (this.game.ball.isAttached()) {
					ctx.fillStyle = "white";
					ctx.font = "bold 30px Arial";
					ctx.textAlign = "center";
					ctx.fillText(
						"To play press ↑",
						this.width / 2,
						this.height / 2
					);
				}
			}
		} else if (currentState == GameOver) {
			ctx.fillStyle = "red";
			ctx.font = "bold 40px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"You have lost :(",
				this.width / 2,
				this.height / 2 - 20
			);

			// Show the total score
			ctx.fillStyle = "white";
			ctx.font = "20px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"Your total score " + this.game.totalScore,
				this.width / 2,
				this.height / 2 + 20
			);
		} else if (currentState == GameComplete) {
			ctx.fillStyle = "white";
			ctx.font = "bold 40px Arial";
			ctx.textAlign = "center";
			ctx.fillText("you won!!!!", this.width / 2, this.height / 2 - 20);

			// Show the total score
			ctx.fillStyle = "white";
			ctx.font = "20px Arial";
			ctx.textAlign = "center";
			ctx.fillText(
				"Your total score " + this.game.totalScore,
				this.width / 2,
				this.height / 2 + 20
			);
		}
	}
}

class Game {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.ui = new UI(this);
		this.paddle = new Paddle(this);
		this.ball = new Ball(this);
		this.bricks = [];
		this.input = new InputHandler(this);
		this.pressedKeys = [];
		this.currentState = Waiting;
		this.newGame();
	}
	loadBricks() {
		let x = 50;
		let y = 50;
		const gap = 4;
		for (let i = 0; i < 17; i++) {
			let width = 0;
			for (let j = 0; j < 8; j++) {
				const brick = new Brick(this, x, y);
				width = brick.width;
				this.bricks.push(brick);
				y += brick.height + gap;
			}
			x += width + gap;
			y = 50;
		}
	}
	newGame() {
		this.paddle = new Paddle(this);
		this.ball = new Ball(this);
		this.bricks = [];
		this.currentState = Waiting;
		this.totalScore = 0;
		this.life = 3;
		this.loadBricks();
	}
	keyUp(key) {
		if (key == "Space") {
			if (this.currentState == Waiting || this.currentState == Paused) {
				this.currentState = Playing;
			} else if (this.currentState == Playing) {
				this.currentState = Paused;
			} else if (
				this.currentState == GameOver ||
				this.currentState == GameComplete
			) {
				this.newGame();
			}
		} else if (key == "ArrowUp") {
			this.ball.launch();
		}
	}
	update() {
		if (this.currentState == Playing) {
			for (const brick of this.bricks) {
				brick.update();
			}
			this.paddle.update();
			this.ball.update();
		}
	}
	drawGame(ctx) {
		for (const brick of this.bricks) {
			brick.draw(ctx);
		}
		this.paddle.draw(ctx);
		this.ball.draw(ctx);

		// Draw bottom danger zone
		ctx.save();
		ctx.shadowColor = "rgb(230, 150, 30)";
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = -3;
		ctx.shadowBlur = 15;

		ctx.fillStyle = "rgb(255, 150, 30)";
		ctx.fillRect(0, this.height - 8, this.width, 8);
		ctx.restore();
	}
	draw(ctx) {
		if (this.currentState == Playing || this.currentState == Paused) {
			this.drawGame(ctx);
		}
		this.ui.draw(ctx);
	}
}

window.addEventListener("load", () => {
	const breakElement = document.getElementById("break");
	const ctx = breakElement.getContext("2d");

	breakElement.width = 1000;
	breakElement.height = 650;

	const game = new Game(breakElement.width, breakElement.height);

	mainLoop = () => {
		ctx.clearRect(0, 0, breakElement.width, breakElement.height);
		game.update();
		game.draw(ctx);
		requestAnimationFrame(mainLoop);
	};
	mainLoop();
});
