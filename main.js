let canvas = document.getElementById("canvas")
let ctx = canvas.getContext("2d")
let runGame = false
let lostGame = false
let clearScreen = false
let timerInterval

const scoreElement = document.getElementById("score")
const livesElement = document.getElementById("lives")
const starsElement = document.getElementById("stars")
const playerInfoElements = document.querySelectorAll(".player-info")
const lostMessageElement = document.getElementById("game-over")
const startBtn = document.getElementById("start-btn")
const scoreRecordElement = document.getElementById("score-record")
const starsRecordElement = document.getElementById("stars-record")
const minutes = document.getElementById("minutes")
const seconds = document.getElementById("seconds")
const guideBtn = document.getElementById("guide-btn")
const shootBtn = document.getElementById("shoot-btn")

shootBtn.style.display = "none"

guideBtn.addEventListener("click", () => {
   alert("GOAL:\nGet the highest score in 2 minutes.\n\nINSTRUCTIONS:\nMove with your keyboard keys or holding and moving your mouse.\nYou lose a life when getting hit by an alien missile.\nShoot missiles pressing the spacebar or the shoot button.\nYou lose the game when dying or by colliding with an alien.\nYou get 10 points on each alien kill.\nYou lose 5 points every time you don't kill an alien.")
})

if (!localStorage.getItem("score-record") && !localStorage.getItem("stars-record")) {

   localStorage.setItem("score-record", 0)
   localStorage.setItem("stars-record", 0)

}

scoreRecordElement.innerText = localStorage.getItem("score-record")
starsRecordElement.innerText = localStorage.getItem("stars-record")
localStorage.setItem("score", 0)
localStorage.setItem("lives", 3)
localStorage.setItem("stars", 0)

/* 1. Responsive canvas */

// Set initial size of canvas
setCanvasSize()

function setCanvasSize() {

   let canvasSize

   // Set canvas size to 70% of the viewport size
   const scale = 0.7

   if (window.innerHeight > window.innerWidth) canvasSize = window.innerWidth * scale
   else canvasSize = window.innerHeight * (scale + 0.03)

   canvas.width = canvasSize
   canvas.height = canvasSize

   if (window.innerWidth <= 615) {
      canvas.width = window.innerWidth
      canvas.height = canvasSize + 100
   }

   playerInfoElements.forEach(el => el.style.width = `${canvas.width}px`)

}

// Change canvas size on resize event
window.addEventListener("resize", setCanvasSize)

/* 2. Classes */

class GameImage {

   constructor(source, file, onload = () => this.position = {
      x: 100,
      y: 100
   }) {

      this.image = new Image();
      this.image.src = `./${source}/${file}`
      this.image.onload = onload

   }

   collidedWith(other) {
      if (this.position && other.position) {
         return this.position.x + this.image.width >= other.position.x && this.position.x <= other.position.x + other.image.width && this.position.y + this.image.height >= other.position.y && this.position.y <= other.position.y + other.image.height
      }
   }

   render() {

      if (this.loaded) {
         ctx.imageSmoothingEnabled = false
         ctx.drawImage(this.image, this.position.x, this.position.y)
      }

   }

}

class Missile extends GameImage {

   constructor(type = "player") {

      super("assets", type === "player" ? "player-missile.png" : "alien-missile.png", () => {
         this.loaded = true

         // Draw missile out of frame
         this.position = {
            x: -this.image.width,
            y: -this.image.height
         }
      })

      if (type === "alien") this.shot = false

      this.type = type

      // Move missile up or down according to which character shot it
      this.velocity = this.type === "player" ? -6 : 6

   }

   render() {

      if (this.loaded) {
         ctx.imageSmoothingEnabled = false

         // Move missile every time it is rendered
         ctx.drawImage(this.image, this.position.x, this.position.y += this.velocity)
      }

   }

}

class Player extends GameImage {

   constructor() {

      super("assets", "aircraft.png", () => {
         this.loaded = true

         // Initial position of player
         this.position = {
            x: (canvas.width - this.image.width) / 2,
            y: canvas.height - this.image.height - 10
         }
      })

      this.velocity = 5
      this.lives = 3

   }

   moveTo(newPosition) {

      this.position.x = newPosition.x
      this.position.y = newPosition.y

   }

   moveInDirection(direction) {

      const margins = {
         up: 10,
         down: 13,
         left: 10,
         right: 10
      }

      const hitBarrier = {
         up: this.position.y < margins.up,
         down: this.position.y > (canvas.height - this.image.height - margins.down),
         left: this.position.x < margins.left,
         right: this.position.x > (canvas.width - this.image.width - margins.right)
      }

      switch (direction) {
         case "up":
            if (!hitBarrier.up) this.moveTo({ x: this.position.x, y: this.position.y -= this.velocity })
            break;
         case "down":
            if (!hitBarrier.down) this.moveTo({ x: this.position.x, y: this.position.y += this.velocity })
            break;
         case "left":
            if (!hitBarrier.left) this.moveTo({ x: this.position.x -= this.velocity, y: this.position.y })
            break;
         case "right":
            if (!hitBarrier.right) this.moveTo({ x: this.position.x += this.velocity, y: this.position.y })
            break;
      }

   }

   shoot(missile) {

      // Update missile position to middle of player
      missile.position = {
         x: this.position.x + (missile.image.width / 2),
         y: this.position.y
      }

   }

}

class Enemy extends GameImage {

   constructor() {

      super("assets", "ufo.png", () => {
         this.loaded = true

         this.position = {
            x: Math.random() * (canvas.width - this.image.width),
            y: -this.image.height
         }
      })

      this.MISSILES = [new Missile("enemy")]
      this.velocity = 3.8

      // Add missile every 2.5 seconds
      setInterval(() => {
         this.MISSILES.push(new Missile("enemy"))
      }, 2500)

   }

   // Get player to detect collision with them
   shoot(player) {

      this.MISSILES.forEach((missile, missileIndex) => {

         if (missile.loaded) {

            // Update missile position to alien position only if it hasn't been shot
            if (!missile.shot) {

               missile.position = {
                  x: this.position.x + (missile.image.width / 2),
                  y: this.position.y + (this.image.height / 2)
               }

               missile.shot = true

            }

            ctx.drawImage(missile.image, missile.position.x, missile.position.y += this.velocity)


            if (player.collidedWith(missile)) {

               updateLives(-1)

               this.MISSILES = this.MISSILES.filter((el, ind) => ind !== missileIndex)

            }

         }

      })


   }

   render() {

      if (this.loaded) {
         ctx.imageSmoothingEnabled = false

         // Move enemy down every time it is rendered
         ctx.drawImage(this.image, this.position.x, this.position.y += 2)

         const blast = new Image()
         blast.src = "./assets/blast.png"

         if (this.killed) ctx.drawImage(blast, this.position.x, this.position.y)
      }

   }

}

class Star extends GameImage {

   constructor() {

      super("assets", "star.png", () => {
         this.loaded = true

         this.position = {
            x: Math.random() * (canvas.width - this.image.width),
            y: -this.image.height
         }
      })

      this.velocity = 3.5

   }

   render() {

      if (this.loaded) {
         ctx.imageSmoothingEnabled = false

         // Move star down every time it is rendered
         ctx.drawImage(this.image, this.position.x, this.position.y += 2)
      }

   }

}

class Heart extends GameImage {
   constructor() {

      super("assets", "heart.png", () => {
         this.loaded = true

         this.position = {
            x: Math.random() * (canvas.width - this.image.width),
            y: -this.image.height
         }
      })

   }

   render() {

      if (this.loaded) {
         ctx.imageSmoothingEnabled = false

         // Move star down every time it is rendered
         ctx.drawImage(this.image, this.position.x, this.position.y += 2.7)
      }

   }
}

/* 3. Game logic */

startBtn.addEventListener("click", function () {

   runGame = true

   this.style.display = "none"
   shootBtn.style.display = "flex"

   timerInterval = setInterval(() => {

      if (+seconds.innerText > 0 && +minutes.innerText >= 0) {

         seconds.innerText = `${String(+seconds.innerText - 1).padStart(2, "0")}`

         if (+seconds.innerText === 0 && +minutes.innerText === 0) {
            lostGame = true
            lostMessageElement.innerHTML = "Time's up!<br>Reload to play again"
            return;
         }
      }

      else {

         if (+minutes.innerText > 0) minutes.innerText = `${String(+minutes.innerText - 1).padStart(2, "0")}`

         seconds.innerText = "59"

      }

   }, 1000)

   gameLoop()

})

// Scorekeeping
function updateScore(points) {

   let score = parseInt(localStorage.getItem("score"))

   score += points

   // If score is a negative number, reset it to 0
   if (score < 0) score = 0

   localStorage.setItem("score", score)

   scoreElement.innerText = localStorage.getItem("score")

}

function updateStarCount() {

   let stars = parseInt(localStorage.getItem("stars"))

   stars++

   localStorage.setItem("stars", stars)

   starsElement.innerText = localStorage.getItem("stars")

}

function updateLives(points) {

   let lives = parseInt(localStorage.getItem("lives"))

   lives += points

   if (lives === 0) {
      lostGame = true
      return;
   }

   localStorage.setItem("lives", lives)

   livesElement.innerText = localStorage.getItem("lives")

}

// Create player
const player = new Player()

// Missiles arrays
let PLAYER_MISSILES = [new Missile()]

let ENEMY_MISSILES = []

// Enemies array
let ENEMIES = [new Enemy()]

// Stars array
let STARS = []

// Hearts array
let HEARTS = []

// Render initial position of player
player.render()

// Keep track of pressed keys for shooting and movement
const pressedKeys = {
   UP: false,
   DOWN: false,
   LEFT: false,
   RIGHT: false,
   SPACE: false,
   SHOOT_BTN: false
}

// Add new enemy every second
setInterval(() => {

   if (runGame) ENEMIES.push(new Enemy())

}, 1000)

// Add new star every 3.5 seconds
setInterval(() => {

   if (runGame) STARS.push(new Star())

}, 3500)

// Add new heart every 5 seconds
setInterval(() => {

   if (runGame) HEARTS.push(new Heart())

}, 5000)

// End game
function finishGame(animationFrame) {

   clearInterval(timerInterval)

   clearScreen = true

   let scoreRecord = parseInt(localStorage.getItem("score-record"))
   let starsRecord = parseInt(localStorage.getItem("stars-record"))

   /* Update records if player achieved higher scores */
   if (scoreRecord < localStorage.getItem("score")) localStorage.setItem("score-record", localStorage.getItem("score"))
   if (starsRecord < localStorage.getItem("stars")) localStorage.setItem("stars-record", localStorage.getItem("stars"))

   localStorage.setItem("lives", 3)
   localStorage.setItem("stars", 0)
   localStorage.setItem("score", 0)

   ctx.clearRect(0, 0, canvas.width, canvas.height)

   runGame = false

   livesElement.innerText = "0"
   starsElement.innerText = "0"
   scoreElement.innerText = "0"

   lostMessageElement.style.display = "block"
}

// Game loop
function gameLoop() {
   let animationFrame = requestAnimationFrame(gameLoop)

   if (runGame) {
      if (lostGame) finishGame(animationFrame)

      // Clear canvas on each iteration
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (pressedKeys.UP) player.moveInDirection("up")
      if (pressedKeys.DOWN) player.moveInDirection("down")
      if (pressedKeys.LEFT) player.moveInDirection("left")
      if (pressedKeys.RIGHT) player.moveInDirection("right")

      // If spacebar was pressed, shoot last missile
      if (pressedKeys.SPACE) player.shoot(PLAYER_MISSILES[PLAYER_MISSILES.length - 1])

      // If shoot button was pressed, shoot last missile
      if (pressedKeys.SHOOT_BTN) player.shoot(PLAYER_MISSILES[PLAYER_MISSILES.length - 1])

      // Draw player on each iteration
      player.render()

      STARS.forEach((star, starIndex) => {

         star.render()

         if (star.collidedWith(player)) {

            updateStarCount()

            STARS = STARS.filter((el, ind) => ind !== starIndex)

         }

      })

      HEARTS.forEach((heart, heartIndex) => {

         heart.render()

         if (heart.collidedWith(player)) {

            updateLives(1)

            HEARTS = HEARTS.filter((el, ind) => ind !== heartIndex)

         }

      })

      ENEMIES.forEach((enemy, enemyIndex) => {

         // If player missile collided with enemy, remove enemy
         PLAYER_MISSILES.forEach((missile, missileIndex) => {

            if (enemy.collidedWith(missile) && enemy.position.y >= 0) {

               // Since enemy missiles live within the enemy instance, as soon as enemy is killed copy its missiles into another array

               // Given that missiles of killed enemies will be drawn with the render method, set their velocity right 
               ENEMY_MISSILES = [...ENEMY_MISSILES, ...enemy.MISSILES.map(missile => {
                  missile.velocity = enemy.velocity
                  return missile
               })]

               // Killed property to trigger blast
               enemy.killed = true

               // Remove enemy
               ENEMIES = ENEMIES.filter((el, ind) => ind !== enemyIndex)

               // Remove missile that killed enemy
               PLAYER_MISSILES = PLAYER_MISSILES.filter((el, ind) => ind !== missileIndex)

               updateScore(10)

            }

         })

         // Draw enemies on each iteration
         if (enemy.collidedWith(player)) lostGame = true

         // Draw enemies on each iteration
         enemy.render()

         if (enemy.loaded) {

            if (enemy.position.y >= canvas.height) {

               // Delete enemy as soon as it is out of frame
               ENEMIES = ENEMIES.filter((el, ind) => ind !== enemyIndex)

               // Subtract 5 points from score if enemy was not killed
               updateScore(-5)
            }

         }

         // Shoot missiles every time it is rendered
         enemy.shoot(player)
      })

      // Draw missiles on each iteration
      PLAYER_MISSILES.forEach((missile, missileIndex) => {
         missile.render()

         if (missile.loaded) {
            // Delete missile as soon as it is out of frame
            if (missile.position.y <= -missile.image.height && missile.position.x >= 0) PLAYER_MISSILES = PLAYER_MISSILES.filter((el, ind) => ind !== missileIndex)
         }
      })

      // If array of enemy missiles has elements, draw them
      if (ENEMY_MISSILES.length) {
         ENEMY_MISSILES.forEach((missile, missileIndex) => {
            missile.render()

            if (missile.loaded) {
               // Delete missile as soon as it is out of frame
               if (missile.position.y >= canvas.height) ENEMY_MISSILES = ENEMY_MISSILES.filter((el, ind) => ind !== missileIndex)
            }

            // Given that collision detection lived within enemy instances, it has to be detected again
            if (player.collidedWith(missile)) {
               updateLives(-1)
               ENEMY_MISSILES = ENEMY_MISSILES.filter((el, ind) => ind !== missileIndex)
            }
         })
      }

      if (clearScreen) ctx.clearRect(0, 0, canvas.width, canvas.height)
   }

}

/* 4. Events for player movement */

// Move player with keyboard
document.addEventListener("keydown", ({ key, code }) => {

   if (key === "ArrowUp") pressedKeys.UP = true

   if (key === "ArrowDown") pressedKeys.DOWN = true

   if (key === "ArrowLeft") pressedKeys.LEFT = true

   if (key === "ArrowRight") pressedKeys.RIGHT = true

   if (code === "Space") pressedKeys.SPACE = true

})

// Stop player movement when they release either of the movement keys
document.addEventListener("keyup", ({ key, code }) => {

   if (key === "ArrowUp") pressedKeys.UP = false

   if (key === "ArrowDown") pressedKeys.DOWN = false

   if (key === "ArrowLeft") pressedKeys.LEFT = false

   if (key === "ArrowRight") pressedKeys.RIGHT = false

   if (code === "Space") {
      // Add new missile when releasing the spacebar
      PLAYER_MISSILES.push(new Missile())

      pressedKeys.SPACE = false
   }

})

// Move player with mouse
let mouseIsDown = false

canvas.addEventListener("mousedown", () => mouseIsDown = true)

canvas.addEventListener("mouseup", () => mouseIsDown = false)

canvas.addEventListener("mousemove", (e) => {

   let canvas = document.getElementById("canvas")
   let offset = canvas.getBoundingClientRect()

   if (mouseIsDown) {

      const canvasPosition = {
         x: offset.left,
         y: offset.top
      }

      let pointerPositionFromDocument = {
         x: e.clientX,
         y: e.clientY
      }

      // Subtract canvas position in relation to document and pointer position in relation to document to get pointer position in relation to canvas
      newXPosition = pointerPositionFromDocument.x - canvasPosition.x
      newYPosition = pointerPositionFromDocument.y - canvasPosition.y

      const playerIsWithinYLimits = newYPosition > 0 && newYPosition < (canvas.height - player.image.height)
      const playerIsWithinXLimits = newXPosition > 0 && newXPosition < (canvas.width - player.image.width)

      if (playerIsWithinXLimits && playerIsWithinYLimits) player.moveTo({ x: newXPosition, y: newYPosition })
   }

})

// Move player for touch screens
let touchIsDown = false

canvas.addEventListener("touchstart", () => touchIsDown = true)

canvas.addEventListener("touchend", () => touchIsDown = false)

canvas.addEventListener("touchmove", (e) => {

   if (touchIsDown) {
      let offset = canvas.getBoundingClientRect()

      const canvasPosition = {
         x: offset.left,
         y: offset.top
      }

      let touchPosition = {
         x: e.touches[0].clientX,
         y: e.touches[0].clientY
      }

      newXPosition = touchPosition.x - canvasPosition.x
      newYPosition = touchPosition.y - canvasPosition.y

      const playerIsWithinYLimits = newYPosition > 0 && newYPosition < (canvas.height - player.image.height)
      const playerIsWithinXLimits = newXPosition > 0 && newXPosition < (canvas.width - player.image.width)

      if (playerIsWithinXLimits && playerIsWithinYLimits) player.moveTo({ x: newXPosition, y: newYPosition })
   }

})

// Shoot button for touch screens
shootBtn.addEventListener("click", () => {

   // Add new missile
   PLAYER_MISSILES.push(new Missile())

   // Set key to true
   pressedKeys.SHOOT_BTN = true

   // Give gameLoop() a few millisenconds to shoot the missile, then set key to false
   setTimeout(() => pressedKeys.SHOOT_BTN = false, 50)

})