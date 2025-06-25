<template>
  <div class="flex flex-col items-center justify-center">
    <div class="mt-[150px] bg-base2 flex flex-row items-center p-3 rounded-xl gap-3 w-[350px]">
      <img src="@/assets/copy.svg" alt="copy link" class="cursor-pointer rounded-lg" @click="copyToClipboard()">
      <span class="text-primary bg-base1 text-lg rounded-lg inter-semibold h-[40px] w-full flex items-center px-2">
        {{ currentUrl }}
      </span>
    </div>
    <div class="mt-5 w-[350px] h-[400px] bg-base2 flex flex-col items-start rounded-xl gap-3 ">
      <span class="text-primary inter-semibold text-lg mt-3 text-center w-full">Joueurs:</span>

      <div class="flex flex-col gap-3 pr-2 overflow-y-auto max-h-[330px] w-full custom-scrollbar">
        <div v-for="(playerName, playerId) in props.gameData.idToPlayer" :key="playerId"
          class="flex flex-row px-3 ml-5 py-1 bg-primary rounded-full text-xl inter-bold text-base1 gap-2 w-fit">
          {{ playerName }}
          <span v-if="playerId === props.gameData.leader" class="text-secondary">
            ★
          </span>
          <button v-else-if="props.UID === props.gameData.leader" class="text-red"
            @click="removePlayer(playerId)">
            ×
          </button>
        </div>
      </div>
    </div>
    <div class="mt-5">
      <button class="px-10 py-3 bg-secondary rounded-lg text-base1 inter-bold text-xl" @click='launchGame()'>
        Lancer la partie
      </button>
    </div>
  </div>
</template>


<script setup>
import { Clipboard } from "v-clipboard"
import { useRouter, useRoute } from 'vue-router'
import { getDatabase, ref as dbRef, update, serverTimestamp } from 'firebase/database'

const router = useRouter()
const route = useRoute()
const database = getDatabase()
const gameId = route.params.gameId
const board = {}
const playerLetters = {}
const playerOrder = {}
const scores = {}
const bagTile = { _: 2, A: 9, B: 2, C: 2, D: 3, E: 15, F: 2, G: 2, H: 2, I: 8, J: 1, K: 1, L: 5, M: 3, N: 6, O: 6, P: 2, Q: 1, R: 6, S: 6, T: 6, U: 6, V: 2, W: 1, X: 1, Y: 1, Z: 1 };
const partieRef = dbRef(database, `/${gameId}`)

function setupGame() {
  // Récupération des IDs de joueurs
  const playerIds = Object.keys(props.gameData.idToPlayer)

  // Mélange aléatoire de l'ordre des joueurs
  const shuffledPlayers = playerIds.sort(() => 0.5 - Math.random())

  // Attribution de l'ordre des joueurs
  shuffledPlayers.forEach((playerId, index) => {
    playerOrder[index] = playerId
  })

  // Initialisation des scores et des lettres des joueurs
  for (const playerId of playerIds) {
    scores[playerId] = [] // Tableau vide pour les scores des différents tours
    playerLetters[playerId] = "" // String de 7 lettres tirées au hasard
    for (let i = 0; i < 7; i++) {
      const tile = drawRandomTile()
      if (tile) {
        playerLetters[playerId] += tile
      }
    }
  }

  // Initialisation du plateau : 15 lignes de 15 tirets
  for (let i = 0; i < 15; i++) {
    board[i] = "---------------"
  }
}

// Fonction utilitaire pour tirer une tuile aléatoire du sac
function drawRandomTile() {
  const availableTiles = Object.entries(bagTile).filter(([_, count]) => count > 0)
  if (availableTiles.length === 0) return null

  const totalTiles = availableTiles.reduce((sum, [_, count]) => sum + count, 0)
  const rand = Math.floor(Math.random() * totalTiles)

  let cumulative = 0
  for (const [letter, count] of availableTiles) {
    cumulative += count
    if (rand < cumulative) {
      bagTile[letter] -= 1
      return letter
    }
  }

  return null
}

async function launchGame() {
  setupGame()
  try {
    await update(partieRef, {
      gameStatus: 'ingame',
      board: board,
      playerLetters: playerLetters,
      playerOrder: playerOrder,
      scores: scores,
      bagTile: bagTile,
      playerIndex: 0,
      timestamp: serverTimestamp()
    })
    console.log("gameStatus mis à jour et plateau initialisé")

  } catch (error) {
    console.error("Erreur :", error)
  }
}


const props = defineProps({
  UID: {
    type: Object
  },
  gameData: {
    type: Object
  }
})

const rawUrl = window.location.href
const currentUrl = rawUrl.replace(/^https?:\/\//, '')

function removePlayer(playerId) {
  if (props.gameData.idToPlayer && props.gameData.idToPlayer[playerId]) {
    update(partieRef, {
      [`idToPlayer/${playerId}`]: null
    });
  }
}

function copyToClipboard() {
  Clipboard.copy(currentUrl)
}


</script>

<style>
.custom-scrollbar {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #FFA500 transparent;
  /* #FFA500 = bg-secondary */
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #FFA500;
  /* couleur de bg-secondary */
  border-radius: 15px;
  border: none;
}
</style>