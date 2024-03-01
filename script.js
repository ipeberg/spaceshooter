const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isGameRunning = false;
let animationFrameId;
let score = 0;

class PlayerSpaceship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.movingForward = false;
        this.width = 50;
        this.height = 50;
        this.bullets = [];
        this.health = 100;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
        this.bullets.forEach(bullet => bullet.draw());
    }

    update() {
        if (this.movingForward) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.isInsideCanvas());
    }

    shoot() {
        this.bullets.push(new Bullet(this.x, this.y, this.angle, 'yellow'));
    }

    takeDamage(amount) {
        this.health -= amount;
        updateHealthBar();
        if (this.health <= 0) {
            gameOver();
        }
    }
}

class Bullet {
    constructor(x, y, angle, color = 'yellow') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 10;
        this.radius = 5;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    isInsideCanvas() {
        return this.x >= 0 && this.x <= canvas.width && this.y >= 0 && this.y <= canvas.height;
    }
}

class EnemySpaceship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.width = 40;
        this.height = 40;
        this.bullets = [];
        setInterval(() => this.shoot(), 1500); // Adjust the interval as needed
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
        this.bullets.forEach(bullet => bullet.draw());
    }

    update() {
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.isInsideCanvas());
    }

    shoot() {
        if (isGameRunning) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.bullets.push(new Bullet(this.x, this.y, angle, 'red'));
        }
    }
    
}

let player = new PlayerSpaceship(canvas.width / 2, canvas.height / 2);
let enemies = [];

function spawnEnemies() {
    if (!isGameRunning) return;
    const x = Math.random() * canvas.width;
    enemies.push(new EnemySpaceship(x, -50));
    setTimeout(spawnEnemies, 2000); // Adjust spawn rate as needed
}

function detectCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            enemy.bullets.forEach((eBullet, eBulletIndex) => {
                if (Math.hypot(bullet.x - eBullet.x, bullet.y - eBullet.y) < eBullet.radius) {
                    player.bullets.splice(bulletIndex, 1);
                    enemy.bullets.splice(eBulletIndex, 1);
                    
                }
            });

            if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.width / 2) {
                player.bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 1; // Increment score
                updateScoreDisplay(); // Call a function to update the score display                
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.bullets.forEach((bullet, bulletIndex) => {
            if (Math.hypot(bullet.x - player.x, bullet.y - player.y) < player.width / 2) {
                enemy.bullets.splice(bulletIndex, 1);
                player.takeDamage(10);
            }
        });

        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.width) {
            enemies.splice(enemyIndex, 1);
            player.takeDamage(33);
        }
    });
}

function updateHealthBar() {
    const healthPercentage = document.getElementById('healthPercentage');
    const healthBar = document.getElementById('healthBar');
    const healthRatio = Math.max(player.health, 0) / 100;
    healthPercentage.textContent = `${Math.max(player.health, 0)}%`;

    // Directly modify the width of the health bar
    healthBar.style.width = `${healthRatio * 200}px`; // Assuming the full health bar is 200px wide
    healthBar.style.backgroundColor = player.health < 33 ? 'red' : 'green';
}

function updateScoreDisplay() {
    document.getElementById('scoreDisplay').textContent = `Pisteet: ${score}`;
}


function handlePlayerControls() {
    window.addEventListener('keydown', (e) => {
        if (!isGameRunning) return;
        switch (e.code) {
            case 'ArrowUp':
                player.movingForward = true;
                player.speed = 5;
                break;
            case 'ArrowLeft':
                player.angle -= 0.1;
                break;
            case 'ArrowRight':
                player.angle += 0.1;
                break;
            case 'Space':
                player.shoot();
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (!isGameRunning) return;
        if (e.code === 'ArrowUp') {
            player.movingForward = false;
            player.speed = 0;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isGameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    });

    canvas.addEventListener('mousedown', (e) => {
        if (!isGameRunning) return;
        if (e.button === 0) {
            player.shoot();
        } else if (e.button === 2) {
            player.movingForward = true;
            player.speed = 5;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isGameRunning) return;
        if (e.button === 2) {
            player.movingForward = false;
            player.speed = 0;
        }
    });

    canvas.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
    };
}

function startGame() {
    if (isGameRunning) return;
    isGameRunning = true;
    document.getElementById('gameIntroText').style.display = 'none';
    document.getElementById('startGameBtn').style.display = 'none';
    document.getElementById('healthBarContainer').style.display = 'flex';
    player = new PlayerSpaceship(canvas.width / 2, canvas.height / 2);
    enemies = [];
    updateHealthBar();
    handlePlayerControls();
    spawnEnemies();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    console.log("Game Over! Try again.");
    isGameRunning = false;
    document.getElementById('gameIntroText').style.display = 'block';
    document.getElementById('startGameBtn').style.display = 'flex';
    document.getElementById('healthBarContainer').style.display = 'none';
    cancelAnimationFrame(animationFrameId);
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });
    player.update();
    player.draw();
    detectCollisions();
    animationFrameId = requestAnimationFrame(gameLoop);
}

document.getElementById('startGameBtn').addEventListener('click', startGame);
