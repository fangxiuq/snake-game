import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

type Difficulty = 'easy' | 'normal' | 'hard'

const DIFFICULTY_SPEED: Record<Difficulty, number> = {
  easy: 400,
  normal: 200,
  hard: 120
}

const GRID_SIZE = 20
const TILE_COUNT = 20

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ])
  const [food, setFood] = useState({ x: 5, y: 5 })
  const [direction, setDirection] = useState({ x: 0, y: -1 })
  const [nextDirection, setNextDirection] = useState({ x: 0, y: -1 })
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const gameLoopRef = useRef<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const spawnFood = useCallback(() => {
    let newFood: { x: number; y: number } = { x: 0, y: 0 }
    let validPosition = false
    while (!validPosition) {
      newFood = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
      }
      validPosition = !snake.some(seg => seg.x === newFood.x && seg.y === newFood.y)
    }
    setFood(newFood)
  }, [snake])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createRadialGradient(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      0,
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2
    )
    gradient.addColorStop(0, '#ff6b6b')
    gradient.addColorStop(1, '#e94560')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    )

    snake.forEach((segment, index) => {
      const isHead = index === 0
      ctx.fillStyle = isHead ? '#00ff88' : `rgba(0, 255, 136, ${1 - index * 0.05})`
      
      const radius = isHead ? 6 : 4
      ctx.beginPath()
      ctx.roundRect(
        segment.x * GRID_SIZE + 2,
        segment.y * GRID_SIZE + 2,
        GRID_SIZE - 4,
        GRID_SIZE - 4,
        radius
      )
      ctx.fill()
    })
  }, [snake, food])

  useEffect(() => {
    draw()
  }, [draw])

  const update = useCallback(() => {
    if (isPaused) return

    const currentDirection = { ...nextDirection }
    setDirection(currentDirection)

    setSnake(prevSnake => {
      const head = { 
        x: prevSnake[0].x + currentDirection.x, 
        y: prevSnake[0].y + currentDirection.y 
      }

      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleGameOver()
        return prevSnake
      }

      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        handleGameOver()
        return prevSnake
      }

      const newSnake = [head, ...prevSnake]

      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10
        setScore(newScore)
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('snakeHighScore', newScore.toString())
        }
        spawnFood()
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [nextDirection, isPaused, food, score, highScore, spawnFood])

  const handleGameOver = () => {
    setIsRunning(false)
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
    setShowGameOver(true)
  }

  const startGame = () => {
    if (isRunning) return

    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ])
    setDirection({ x: 0, y: -1 })
    setNextDirection({ x: 0, y: -1 })
    setScore(0)
    setIsRunning(true)
    setIsPaused(false)
    setShowGameOver(false)
    spawnFood()

    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    gameLoopRef.current = window.setInterval(update, DIFFICULTY_SPEED[difficulty])
  }

  const pauseGame = () => {
    setIsPaused(!isPaused)
  }

  const resetGame = () => {
    setIsRunning(false)
    setIsPaused(false)
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
      gameLoopRef.current = null
    }
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ])
    setDirection({ x: 0, y: -1 })
    setNextDirection({ x: 0, y: -1 })
    setScore(0)
    setShowGameOver(false)
    spawnFood()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        startGame()
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) {
            setNextDirection({ x: 0, y: -1 })
          }
          e.preventDefault()
          break
        case 'ArrowDown':
          if (direction.y !== -1) {
            setNextDirection({ x: 0, y: 1 })
          }
          e.preventDefault()
          break
        case 'ArrowLeft':
          if (direction.x !== 1) {
            setNextDirection({ x: -1, y: 0 })
          }
          e.preventDefault()
          break
        case 'ArrowRight':
          if (direction.x !== -1) {
            setNextDirection({ x: 1, y: 0 })
          }
          e.preventDefault()
          break
        case ' ':
          e.preventDefault()
          if (showGameOver) {
            startGame()
          } else if (isRunning) {
            pauseGame()
          } else {
            startGame()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, direction, showGameOver])

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [])

  return (
    <div className="app">
      <div className="header">
        <h1>贪吃蛇</h1>
        <div className="scores">
          <div className="score">
            <span className="score-label">得分</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score">
            <span className="score-label">最高分</span>
            <span className="score-value">{highScore}</span>
          </div>
        </div>
      </div>

      <div className="game-area">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * TILE_COUNT}
            height={GRID_SIZE * TILE_COUNT}
          />
          
          {showGameOver && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>游戏结束</h2>
                <p className="final-score">得分: {score}</p>
                <button onClick={startGame} className="btn btn-primary">
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="difficulty-section">
            <label>难度</label>
            <div className="difficulty-buttons">
              <button 
                className={`btn btn-difficulty ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                简单
              </button>
              <button 
                className={`btn btn-difficulty ${difficulty === 'normal' ? 'active' : ''}`}
                onClick={() => setDifficulty('normal')}
              >
                普通
              </button>
              <button 
                className={`btn btn-difficulty ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                困难
              </button>
            </div>
          </div>

          <div className="controls-section">
            <button 
              onClick={isRunning ? pauseGame : startGame} 
              className="btn btn-primary btn-large"
            >
              {isRunning ? (isPaused ? '继续' : '暂停') : '开始游戏'}
            </button>
            <button onClick={resetGame} className="btn btn-secondary">
              重新开始
            </button>
          </div>

          <div className="help-section">
            <p>↑ ↓ ← → 方向键控制</p>
            <p>空格键 暂停/继续</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
