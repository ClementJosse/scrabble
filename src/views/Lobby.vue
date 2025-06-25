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
          <button v-else-if="props.UID === props.gameData.leader" class="text-secondary"
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
import { getDatabase, ref as dbRef, update } from 'firebase/database'

const router = useRouter()
const route = useRoute()
const database = getDatabase()
const gameId = route.params.gameId
const board = {}
const playerLetters = {}
const bagTile = {}
const partieRef = dbRef(database, `/${gameId}`)

async function launchGame() {
  try {
    await update(partieRef, {
      gameStatus: 'ingame',
      board: board
    })
    console.log("gameStatus mis à jour et plateau initialisé")

    router.push(`/${gameId}`)
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

for (let i = 0; i < 7; i++) {
  board[i] = "---------------"
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