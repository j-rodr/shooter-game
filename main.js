let canvas = document.getElementById("canvas")
let ctx = canvas.getContext("2d")
let runGame = false

const scoreElement = document.getElementById("score")
const livesElement = document.getElementById("lives")
const starsElement = document.getElementById("stars")
const playerInfoElements = document.querySelectorAll(".player-info")
const lostMessageElement = document.getElementById("game-over")
const startBtn = document.getElementById("start-btn")
const scoreRecordElement = document.getElementById("score-record")
const starsRecordElement = document.getElementById("stars-record")

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
      this.velocity = 3.5

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
         ctx.drawImage(this.image, this.position.x, this.position.y += 2.5)
      }

   }
}