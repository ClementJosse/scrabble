<template>
  <div
    class="flex items-center justify-center gap-2 mx-auto w-fit pl-[63px] fixed mt-[105px] z-50 right-10 top-[102px]">
    <div @click="showStats()">
      <img src="@/assets/stats.svg" alt="afficher les statistiques" class="cursor-pointer" />
    </div>
  </div>
  <div class="fixed top-[95px] right-6">
    <Transition :duration="550" name="toggletransition">
      <div v-if="isStatsVisible"
        class="bg-base2 w-[330px] z-10 shadow-md shadow-base3 rounded-3xl pl-4 py-6 mt-[90px] h-[calc(100vh-210px)] flex flex-col">
        <span class="h-10 w-[195px] bg-base3 text-primary text-xl items-center justify-center flex font-semibold mb-2 rounded-lg ml-[50px]">Statistiques</span>
        <div class="overflow-y-auto flex-grow min-h-0 custom-scrollbar mt-4">
          <div class="text-center font-semibold text-primary mb-2">Classement</div>
          <div class="bg-base1 rounded-xl shadow-md shadow-base3  w-[190px] mx-auto">
            <div v-for="(uid, index) in sortedPlayers" :key="uid"
              :class="['flex justify-between items-center py-[12px]', index % 2 === 0 ? 'bg-transparent' : 'bg-base2 ']">
              <div class="flex gap-2 pl-4">
                <span class="font-semibold text-primary">{{ index + 1 }}</span>
                <span :class="uid === UID ? 'bg-base3 text-primary text-xs font-semibold px-2 py-1 rounded-full' :
                'bg-primary text-base1 text-xs font-semibold px-2 py-1 rounded-full'">{{ getUsername(uid) }}</span>
              </div>
              <span class="font-semibold text-primary pr-4">{{ getScore(uid) }}pts</span>
            </div>
          </div>
          <!-- graph -->
          <div class="text-center  font-semibold text-primary my-4 mr-3">Graphique</div>
          <div class="bg-base1 rounded-xl shadow-md shadow-base3 h-32 mr-3"></div>

          
          <!-- le score par tour -->
          <div class="text-center font-semibold text-primary my-4 mr-3">Scores par tour</div>
          <div class="bg-base1 rounded-xl shadow-md shadow-base3 h-40 mr-3 mb-4"></div>
        </div>
      </div>
    </Transition>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue'

const mot = ref("")
const isStatsVisible = ref(true)

function showStats() {
  isStatsVisible.value = !isStatsVisible.value
}

const props = defineProps({
  gameData: Object,
  UID: String
})

const idToPlayer = computed(() => props.gameData?.idToPlayer || {})
const scores = computed(() => props.gameData?.scores || {})
const playerOrder = computed(() => props.gameData?.playerOrder || [])

const getUsername = (uid) => idToPlayer.value[uid] || ''

const getScore = (uid) => {
  const playerScores = scores.value[uid] || {}
  return Object.values(playerScores).reduce((acc, val) => acc + val, 0)
}

const sortedPlayers = computed(() => {
  return [...playerOrder.value].sort((a, b) => {
    return getScore(b) - getScore(a)
  })
})
</script>

<style>
.custom-height {
  height: calc(100vh - 110px);
  /* ajuste ici selon ton besoin */
}
</style>

<style>
.toggletransition-enter-active,
.toggletransition-leave-active {
  transition: all 0.3s ease-in-out;
}

.toggletransition-leave-active {
  transition-delay: 0.25s;
}

.toggletransition-enter-from,
.toggletransition-leave-to {
  transform: translateY(30px);
  opacity: 0;
}
</style>