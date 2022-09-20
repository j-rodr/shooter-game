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