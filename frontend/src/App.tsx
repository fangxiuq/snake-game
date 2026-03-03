import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import './App.css'

interface Score {
  id: number
  player_name: string
  score: number
  max_score: number
  created_at: string
}

const GRID_SIZE = 20
const TILE_COUNT = 20
const GAME_SPEED = 250

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
  const [playerName, setPlayerName] = useState('')
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  const [showNameInput, setShowNameInput] = useState(false)
  const gameLoopRef = useRef<number | null>(null)

  useEffect(() => {
    fetchLeaderboard()
    const savedHighScore = localStorage.getItem('snakeHighScore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/scores?limit=10')
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  const spawnFood = useCallback(() => {
    let validPosition = false
    let newFood = { x: 0, y: 0 }
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

    ctx.fillStyle = '#0a0a15'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(233, 69, 96, 0.1)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= TILE_COUNT; i++) {
      ctx.beginPath()
      ctx.moveTo(i * GRID_SIZE, 0)
      ctx.lineTo(i * GRID_SIZE, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * GRID_SIZE)
      ctx.lineTo(canvas.width, i * GRID_SIZE)
      ctx.stroke()
    }

    const gradient = ctx.createRadialGradient(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      0,
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2
    )
    gradient.addColorStop(0, '#ff6b6b')
    gradient.addColorStop(1, '#e94560')
    ctx.fillStyle = gradient
    ctx.shadowColor = '#e94560'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.shadowBlur = 0

    snake.forEach((segment, index) => {
      const isHead = index === 0
      const alpha = 1 - (index / snake.length) * 0.5

      if (isHead) {
        ctx.fillStyle = '#00ff88'
        ctx.shadowColor = '#00ff88'
        ctx.shadowBlur = 10
      } else {
        ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`
        ctx.shadowBlur = 0
      }

      const radius = isHead ? 6 : 4
      ctx.beginPath()
      ctx.roundRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
        radius
      )
      ctx.fill()
    })
    ctx.shadowBlur = 0
  }, [snake, food])

  useEffect(() => {
    draw()
  }, [draw])

  const update = useCallback(() => {
    if (isPaused) return

    const newDirection = { ...nextDirection }
    setDirection(newDirection)

    setSnake(prevSnake => {
      const head = { x: prevSnake[0].x + newDirection.x, y: prevSnake[0].y + newDirection.y }

      if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver()
        return prevSnake
      }

      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver()
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

  const gameOver = () => {
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

    gameLoopRef.current = window.setInterval(update, GAME_SPEED)
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

  const submitScore = async () => {
    if (!playerName.trim()) return

    try {
      await axios.post('http://localhost:8000/api/scores', {
        player_name: playerName,
        score: score,
        max_score: highScore
      })
      await fetchLeaderboard()
      setShowNameInput(false)
      setPlayerName('')
    } catch (error) {
      console.error('Failed to submit score:', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        startGame()
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setNextDirection({ x: 0, y: -1 })
          e.preventDefault()
          break
        case 'ArrowDown':
          if (direction.y !== -1) setNextDirection({ x: 0, y: 1 })
          e.preventDefault()
          break
        case 'ArrowLeft':
          if (direction.x !== 1) setNextDirection({ x: -1, y: 0 })
          e.preventDefault()
          break
        case 'ArrowRight':
          if (direction.x !== -1) setNextDirection({ x: 1, y: 0 })
          e.preventDefault()
          break
        case ' ':
          if (isRunning) {
            pauseGame()
          } else if (!showGameOver) {
            startGame()
          }
          e.preventDefault()
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
      <div className="game-container">
        <h1>🐍 贪吃蛇</h1>
        
        <div className="score-board">
          <div className="score-item">
            <span className="label">得分</span>
            <span className="value">{score}</span>
          </div>
          <div className="score-item">
            <span className="label">最高分</span>
            <span className="value">{highScore}</span>
          </div>
        </div>

        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * TILE_COUNT}
            height={GRID_SIZE * TILE_COUNT}
          />
          
          {showGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                <h2>游戏结束!</h2>
                <p>最终得分: <span>{score}</span></p>
                <button onClick={() => setShowNameInput(true)} className="btn-primary">
                  保存成绩
                </button>
                <button onClick={startGame} className="btn-secondary">
                  再来一局
                </button>
              </div>
            </div>
          )}

          {showNameInput && (
            <div className="name-input-overlay">
              <div className="name-input-box">
                <h3>输入你的名字</h3>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="玩家名"
                  maxLength={20}
                  autoFocus
                />
                <div className="btn-group">
                  <button onClick={submitScore} className="btn-primary">
                    确认
                  </button>
                  <button onClick={() => setShowNameInput(false)} className="btn-secondary">
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          <button onClick={isRunning ? pauseGame : startGame} className="btn-primary">
            {isRunning ? (isPaused ? '继续' : '暂停') : '开始游戏'}
          </button>
          <button onClick={resetGame} className="btn-secondary">
            重新开始
          </button>
        </div>

        <div className="instructions">
          使用方向键 ↑ ↓ ← → 控制蛇的移动<br/>
          空格键暂停/继续
        </div>
      </div>

      <div className="leaderboard">
        <h2>🏆 排行榜</h2>
        <div className="leaderboard-list">
          {leaderboard.map((item, index) => (
            <div key={item.id} className="leaderboard-item">
              <span className="rank">{index + 1}</span>
              <span className="name">{item.player_name}</span>
              <span className="score">{item.score}</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="empty">暂无记录</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
