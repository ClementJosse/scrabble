<template>
  <div class="flex bg-base2 rounded-2xl px-8 py-6 justify-between items-center w-[330px] absolute top-6 right-6 shadow-md shadow-base3">
    <div class="flex flex-col">
      <span class="text-secondary text-xl font-semibold">Tour</span>
      <span class="text-primary text-5xl font-bold mt-1">{{ format(time) }}</span>
    </div>
    <div class="flex flex-col w-auto">
      <span class="text-primary font-semibold">Au tour de :</span>
      <div class="bg-primary text-base1 font-semibold px-4 py-1 rounded-full mt-1 w-fit">{{ currentName }}</div>
      <span class="text-primary text-base mt-3">Suivant : <span class="font-semibold">{{ nextName }}</span></span>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue'                                                              /*computed calcule dynamiquement en temps réel + réagit automatiquement*/
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { serverTimestamp } from 'firebase/database'


const props = defineProps({
  UID: String,
  gameData: Object
})

const time = ref(Math.floor((Date.now() - props.gameData.timestamp) / 1000))
let timer = null

watch(() => props.gameData?.playerIndex, () => {                                            /*quand playerIndex change*/
  resetTimer()
})

function resetTimer() {
  clearInterval(timer)
  time.value = 0
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

const nextUID = computed(() => order.value[(currentIndex.value + 1) % order.value.length])  /* avec order.value[l'index suivant] on a l'uid */

const nextName = computed(() => props.gameData.idToPlayer?.[nextUID.value])                 /*cet uid to username*/
</script>


