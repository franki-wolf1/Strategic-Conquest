'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"

type Resource = 'gold' | 'food' | 'weapon'

type Player = {
  id: number
  x: number
  y: number
  resources: Record<Resource, number>
  difficulty: 'easy' | 'insane'
  health: number
  experience: number
}

type TileType = 'grass' | 'mountain' | 'water' | 'forest'

type Tile = {
  type: TileType
  resource?: Resource
}

type GameState = {
  players: Player[]
  map: Tile[][]
  currentTurn: number
  winner: number | null
  turn: number
}

const MAP_SIZE = 100
const TILE_SIZE = 10

const TILE_COLORS: Record<TileType, string> = {
  grass: '#90EE90',
  forest: '#228B22',
  mountain: '#A0522D',
  water: '#4169E1'
}

const RESOURCE_COLORS: Record<Resource, string> = {
  gold: 'yellow',
  food: 'red',
  weapon: 'black'
}

const PLAYER_COLORS = ['purple', 'orange', 'pink', 'brown']

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    map: [],
    currentTurn: 0,
    winner: null,
    turn: 0
  })
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [loading, setLoading] = useState(true)

  const initGame = useCallback(() => {
    setLoading(true)
    const newGameState: GameState = {
      players: [
        { id: 0, x: 0, y: 0, resources: { gold: 0, food: 10, weapon: 1 }, difficulty: 'easy', health: 100, experience: 0 },
        { id: 1, x: MAP_SIZE - 1, y: 0, resources: { gold: 0, food: 10, weapon: 1 }, difficulty: 'insane', health: 100, experience: 0 },
        { id: 2, x: 0, y: MAP_SIZE - 1, resources: { gold: 0, food: 10, weapon: 1 }, difficulty: 'insane', health: 100, experience: 0 },
        { id: 3, x: MAP_SIZE - 1, y: MAP_SIZE - 1, resources: { gold: 0, food: 10, weapon: 1 }, difficulty: 'insane', health: 100, experience: 0 }
      ],
      map: generateMap(),
      currentTurn: 0,
      winner: null,
      turn: 0
    }

    setGameState(newGameState)
    setViewportOffset({ x: 0, y: 0 })
    setTimeout(() => setLoading(false), 1000) // Simular tiempo de carga
  }, [])

  const generateMap = (): Tile[][] => {
    const map: Tile[][] = []
    for (let y = 0; y < MAP_SIZE; y++) {
      map[y] = []
      for (let x = 0; x < MAP_SIZE; x++) {
        const random = Math.random()
        const type: TileType = random < 0.6 ? 'grass' : random < 0.75 ? 'forest' : random < 0.85 ? 'mountain' : 'water'
        map[y][x] = { type }
        if ((type === 'grass' || type === 'forest') && Math.random() < 0.1) {
          map[y][x].resource = Math.random() < 0.4 ? 'gold' : Math.random() < 0.7 ? 'food' : 'weapon'
        }
      }
    }
    return map
  }

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar mapa
    for (let y = 0; y < viewportSize.height; y++) {
      for (let x = 0; x < viewportSize.width; x++) {
        const mapX = x + viewportOffset.x
        const mapY = y + viewportOffset.y
        if (mapX >= 0 && mapX < MAP_SIZE && mapY >= 0 && mapY < MAP_SIZE) {
          const tile = gameState.map[mapY][mapX]
          ctx.fillStyle = TILE_COLORS[tile.type]
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)

          if (tile.resource) {
            ctx.fillStyle = RESOURCE_COLORS[tile.resource]
            ctx.beginPath()
            ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 4, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
      }
    }

    // Dibujar jugadores
    gameState.players.forEach((player) => {
      const screenX = player.x - viewportOffset.x
      const screenY = player.y - viewportOffset.y
      if (screenX >= 0 && screenX < viewportSize.width && screenY >= 0 && screenY < viewportSize.height) {
        ctx.fillStyle = PLAYER_COLORS[player.id]
        ctx.beginPath()
        ctx.arc(screenX * TILE_SIZE + TILE_SIZE / 2, screenY * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2, 0, 2 * Math.PI)
        ctx.fill()

        // Dibujar barra de salud
        ctx.fillStyle = 'red'
        ctx.fillRect(screenX * TILE_SIZE, screenY * TILE_SIZE - 5, TILE_SIZE, 3)
        ctx.fillStyle = 'green'
        ctx.fillRect(screenX * TILE_SIZE, screenY * TILE_SIZE - 5, (player.health / 100) * TILE_SIZE, 3)
      }
    })
  }, [gameState, viewportOffset, viewportSize])

  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState.currentTurn !== 0 || gameState.winner !== null) return

    const player = gameState.players[0]
    if (!player) return

    const newX = Math.max(0, Math.min(MAP_SIZE - 1, player.x + dx))
    const newY = Math.max(0, Math.min(MAP_SIZE - 1, player.y + dy))

    if (gameState.map[newY][newX].type !== 'water') {
      const newPlayers = [...gameState.players]
      newPlayers[0] = { ...player, x: newX, y: newY }

      const tile = gameState.map[newY][newX]
      if (tile.resource) {
        newPlayers[0].resources[tile.resource]++
        newPlayers[0].experience++
        const newMap = gameState.map.map(row => [...row])
        newMap[newY][newX] = { ...tile, resource: undefined }

        setGameState(prevState => ({
          ...prevState,
          players: newPlayers,
          map: newMap,
          currentTurn: (prevState.currentTurn + 1) % prevState.players.length,
          turn: prevState.turn + 1
        }))
      } else {
        setGameState(prevState => ({
          ...prevState,
          players: newPlayers,
          currentTurn: (prevState.currentTurn + 1) % prevState.players.length,
          turn: prevState.turn + 1
        }))
      }

      // Comprobar combate
      const opponent = newPlayers.find(p => p.id !== 0 && p.x === newX && p.y === newY)
      if (opponent) {
        handleCombat(newPlayers[0], opponent)
      }

      // Actualizar viewport
      setViewportOffset(prevOffset => ({
        x: Math.max(0, Math.min(MAP_SIZE - viewportSize.width, newX - Math.floor(viewportSize.width / 2))),
        y: Math.max(0, Math.min(MAP_SIZE - viewportSize.height, newY - Math.floor(viewportSize.height / 2)))
      }))
    }
  }, [gameState, viewportSize])

  const handleCombat = useCallback((attacker: Player, defender: Player) => {
    const attackPower = attacker.resources.weapon * 10 + attacker.experience
    const defensePower = defender.resources.weapon * 5 + defender.experience / 2

    const damage = Math.max(0, attackPower - defensePower)
    defender.health -= damage
    attacker.experience += 2

    if (defender.health <= 0) {
      // El defensor es eliminado
      attacker.resources.gold += defender.resources.gold
      attacker.resources.food += defender.resources.food
      attacker.resources.weapon += defender.resources.weapon
      attacker.experience += 10

      const newPlayers = gameState.players.filter(p => p.id !== defender.id)
      
      if (newPlayers.length === 1) {
        // El juego ha terminado
        setGameState(prevState => ({
          ...prevState,
          players: newPlayers,
          winner: attacker.id
        }))
      } else {
        setGameState(prevState => ({
          ...prevState,
          players: newPlayers
        }))
      }
    } else {
      const newPlayers = gameState.players.map(p => 
        p.id === defender.id ? { ...p, health: defender.health } : 
        p.id === attacker.id ? { ...p, experience: attacker.experience } : p
      )
      setGameState(prevState => ({
        ...prevState,
        players: newPlayers
      }))
    }
  }, [gameState])

  const aiTurn = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentTurn]
    if (!currentPlayer) return

    const moves = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 }
    ]

    let bestMove = moves[0]
    let bestScore = -Infinity

    moves.forEach(move => {
      const newX = Math.max(0, Math.min(MAP_SIZE - 1, currentPlayer.x + move.dx))
      const newY = Math.max(0, Math.min(MAP_SIZE - 1, currentPlayer.y + move.dy))

      if (gameState.map[newY][newX].type !== 'water') {
        let score = 0

        // Evaluar recursos
        if (gameState.map[newY][newX].resource) {
          score += 10
        }

        // Evaluar combate
        const opponent = gameState.players.find(p => p.id !== currentPlayer.id && p.x === newX && p.y === newY)
        if (opponent) {
          const attackPower = currentPlayer.resources.weapon * 10 + currentPlayer.experience
          const defensePower = opponent.resources.weapon * 5 + opponent.experience / 2
          if (attackPower > defensePower) {
            score += 20
          } else {
            score -= 20
          }
        }

        // Todos los jugadores IA son insanos, así que siempre multiplicamos por 2
        score *= 2

        if (score > bestScore) {
          bestScore = score
          bestMove = move
        }
      }
    })

    const newX = Math.max(0, Math.min(MAP_SIZE - 1, currentPlayer.x + bestMove.dx))
    const newY = Math.max(0, Math.min(MAP_SIZE - 1, currentPlayer.y + bestMove.dy))

    const newPlayers = gameState.players.map(p => 
      p.id === currentPlayer.id ? { ...p, x: newX, y: newY } : p
    )

    const tile = gameState.map[newY][newX]
    if (tile.resource) {
      newPlayers[gameState.currentTurn].resources[tile.resource]++
      newPlayers[gameState.currentTurn].experience++
      const newMap = gameState.map.map(row => [...row])
      newMap[newY][newX] = { ...tile, resource: undefined }

      setGameState(prevState => ({
        ...prevState,
        players: newPlayers,
        map: newMap,
        currentTurn: (prevState.currentTurn + 1) % prevState.players.length,
        turn: prevState.turn + 1
      }))
    } else {
      setGameState(prevState => ({
        ...prevState,
        players: newPlayers,
        currentTurn: (prevState.currentTurn + 1) % prevState.players.length,
        turn: prevState.turn + 1
      }))
    }

    // Comprobar combate
    const opponent = newPlayers.find(p => p.id !== currentPlayer.id && p.x === newX && p.y === newY)
    if (opponent) {
      handleCombat(currentPlayer, opponent)
    }
  }, [gameState, handleCombat])

  useEffect(() => {
    const updateViewportSize = () => {
      const width = Math.floor((window.innerWidth - 200) / TILE_SIZE) // Restamos 200px para el panel lateral
      const height = Math.floor(window.innerHeight / TILE_SIZE)
      setViewportSize({ width, height })
      if (canvasRef.current) {
        canvasRef.current.width = width * TILE_SIZE
        canvasRef.current.height = height * TILE_SIZE
      }
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    initGame()

    return () => window.removeEventListener('resize', updateViewportSize)
  }, [initGame])

  useEffect(() => {
    drawGame()
  }, [gameState, viewportOffset, viewportSize, drawGame])

  useEffect(() => {
    if (gameState.currentTurn !== 0 && gameState.winner === null) {
      const timer = setTimeout(aiTurn, 500)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentTurn, 

 gameState.winner, aiTurn])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-lg font-semibold">Cargando juego...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-grow">
        <canvas
          ref={canvasRef}
          className="border-4 border-gray-800"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <Button className="px-4 py-2 bg-blue-500 text-white rounded mr-2" onClick={() => handleMove(0, -1)}>↑</Button>
          <Button className="px-4 py-2 bg-blue-500 text-white rounded mr-2" onClick={() => handleMove(-1, 0)}>←</Button>
          <Button className="px-4 py-2 bg-blue-500 text-white rounded mr-2" onClick={() => handleMove(1, 0)}>→</Button>
          <Button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => handleMove(0, 1)}>↓</Button>
        </div>
      </div>
      <div className="w-64 bg-white p-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Puntuación</h2>
        {gameState.players[0] && (
          <>
            <p>Oro: {gameState.players[0].resources.gold}</p>
            <p>Comida: {gameState.players[0].resources.food}</p>
            <p>Armas: {gameState.players[0].resources.weapon}</p>
            <p>Salud: {gameState.players[0].health}</p>
            <p>Experiencia: {gameState.players[0].experience}</p>
          </>
        )}
        <p className="mt-4">Turno: {gameState.turn}</p>
        <Button className="mt-4 w-full bg-green-500 text-white" onClick={initGame}>
          Reiniciar juego
        </Button>
      </div>
      {gameState.winner !== null && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded text-2xl font-bold">
          {gameState.winner === 0 ? "¡Has ganado!" : `El jugador ${gameState.winner + 1} ha ganado.`}
        </Button>
      )}
    </div>
  )
}
