<template>
    <div class="fixed top-[125px] left-6 ">
        <div v-if="isLeader" class="mb-10 ml-4">
            <img   src="@/assets/lobby.svg" alt="return to lobby" class="cursor-pointer rounded-lg"
                @click="showReturnMenu()" />
        </div>
        <img src="@/assets/dico.svg" alt="return to lobby" class="cursor-pointer rounded-lg ml-4 relative z-20"
            @click="showDico()" /> <Transition :duration="550" name="toggletransition">
        <div v-if="isDicoVisible" class="bg-base2 w-[330px] h-screen relative z-10 -top-[60px] h-[calc(100vh-216px)] shadow-md shadow-base3 rounded-xl">
            <!-- contenu -->
        </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    isLeader: {
        type: Boolean
    }
})
const isDicoVisible = ref(true)

function showDico() {
    isDicoVisible.value = !isDicoVisible.value
}
function showReturnMenu() {
    console.log("afficher le menu pour retourner au lobby")
}
</script>
<style>
.custom-height {
  height: calc(100vh - 110px); /* ajuste ici selon ton besoin */
}
</style>


<style>
.toggletransition-enter-active, .toggletransition-leave-active {
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