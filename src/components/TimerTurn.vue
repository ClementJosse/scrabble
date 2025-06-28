<template>
  <div class="flex bg-base2 rounded-2xl px-4 py-3 justify-between items-center w-[330px] absolute top-6 right-6 shadow-md shadow-base3">
    <div class="flex flex-col w-[150px]">
      <span class="text-secondary text-xl font-semibold">Tour</span>
      <span class="text-primary text-4xl font-bold -mt-[5px]">{{ format(time) }}</span>
      <button v-if="isCurrentPlayer" @click="passTurn"class="mt-4 font-medium ring ring-red text-sm fill-lightred text-red rounded bg-lightred w-[120px] ring-2">Passer le tour</button></div>
    <div class="flex flex-col w-auto">
      <span class="text-primary font-semibold">Au tour de :</span>
      <div class="bg-primary text-base1 font-semibold px-4 py-1 rounded-full mt-1 w-fit">{{ currentName }}</div>
      <span class="text-primary text-sm mt-3">Suivant : <span class="font-semibold">{{ nextName }}</span></span>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue'                                                              /*computed calcule dynamiquement en temps réel + réagit automatiquement*/
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { getDatabase,ref as dbRef, update, serverTimestamp } from 'firebase/database'

const props = defineProps({
  UID: String,
  gameData: Object,
  gameId: String
})

const database = getDatabase()
const gameId = props.gameId

const time = ref(Math.floor((Date.now() - props.gameData.timestamp) / 1000))
let timer = null

watch(() => props.gameData?.playerIndex, () => {                                            /*quand playerIndex change*/
  time.value = 0
})

function resetTimer() {
  clearInterval(timer)
  time.value = Math.floor((Date.now() - props.gameData.timestamp) / 1000)
  timer = setInterval(() => {
    time.value++                                                                           /*+ 1 à chaque seconde*/
  }, 1000) 
}

onMounted(resetTimer)
onUnmounted(() => clearInterval(timer))

function format(t) {
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}


const currentIndex = computed(() => props.gameData.playerIndex ?? 0)                        /* si valeur 1 est nul: valeur1 ?? valeur2 */
const order = computed(() => props.gameData.playerOrder ?? [])
const currentUID = computed(() => order.value[currentIndex.value])

const currentName = computed(() => props.gameData.idToPlayer?.[currentUID.value])           /* ? pour pas lire si null */
const isCurrentPlayer = computed(() => props.UID === currentUID.value)

const nextUID = computed(() => order.value[(currentIndex.value + 1) % order.value.length])  /* avec order.value[l'index suivant] on a l'uid */

const nextName = computed(() => props.gameData.idToPlayer?.[nextUID.value])                 /*cet uid to username*/

console.log("gameId:", gameId)
async function passTurn() {
  const nextIndex = (currentIndex.value + 1) % order.value.length

  await update(dbRef(database, props.gameId), {
      playerIndex: nextIndex,
      timestamp: serverTimestamp()
    })
}
</script>


