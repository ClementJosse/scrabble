<template>
    <div class="fixed top-[125px] left-6 ">
        <div v-if="isLeader" class="mb-10 ml-4">
            <img src="@/assets/lobby.svg" alt="return to lobby" class="cursor-pointer rounded-lg"
                @click="showReturnMenu()" />
        </div>
        <img src="@/assets/dico.svg" alt="return to lobby" class="cursor-pointer rounded-lg ml-4 relative z-20"
            @click="showDico()" />   <Transition :duration="550" name="toggletransition">
        <div v-if="isDicoVisible"
            class="bg-base2 w-[330px] h-screen relative z-10 -top-[60px] h-[calc(100vh-216px)] shadow-md shadow-base3 rounded-xl">
            <div class="pt-20 text-sm text-secondary flex flex-col items-center">
                *basé sur l’ODS 9 du 1er janvier 2024
                <input ref="input" v-model="mot" type="text" placeholder="Rechercher un mot..."
                    class="w-[300px] rounded-lg shadow-md shadow-base3 p-3 text-primary inter-bold text-xl text-bold bg-base1 border-none outline-none placeholder-base3 placeholder-opacity-100 placeholder:font-medium" />
            </div>
            <div>
                <span><!-- Est valide au Scrabble/ n'est pas valide au Scrabble --></span>
                <div>
                    <!-- Définition du mot -->
                </div>
                <span>Propositions de mots</span>
                <div>
                    <!-- mettre ici tous les mots commençant par "mot.value" -->
                </div>
            </div>
        </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref } from 'vue'
//import { dicodef } from '../dico/dicodef';
//import { ods9 } from '../dico/ods9.js';

const mot = ref("")


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
    height: calc(100vh - 110px);
    /* ajuste ici selon ton besoin */
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