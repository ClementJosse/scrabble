<template>
    <div class="fixed top-[125px] left-6">
        <div v-if="isLeader" class="mb-10 ml-4 h-10">
            <img src="@/assets/lobby.svg" alt="return to lobby" class="cursor-pointer rounded-lg"
                @click="showReturnMenu()" />
        </div>
        <div v-else class="mb-10 ml-4 h-10">

        </div>
        <img src="@/assets/dico.svg" alt="return to lobby" class="cursor-pointer rounded-lg ml-4 relative z-20"
            @click="showDico()" />
        <Transition :duration="550" name="toggletransition">
            <div v-if="isDicoVisible"
                class="bg-base2 w-[330px] relative z-10 -top-[60px] h-[calc(100vh-225px)] shadow-md shadow-base3 rounded-xl overflow-hidden flex flex-col">
                <div v-if="isLoading"
                    class="flex justify-center items-center h-[calc(100vh-350px)] flex-col text-secondary text-lg gap-5">
                    <Loader />
                    Chargement du dictionnaire...
                </div>
                <div v-else class="flex flex-col h-full">
                    <div class="pt-[18px] text-sm text-secondary flex flex-col items-center flex-shrink-0">
                        <span class="h-10 w-[195px] bg-base3 text-primary text-xl items-center justify-center flex font-semibold mb-6 rounded-lg"> Dictionnaire </span>
                        <span class="flex w-[295px]">*basé sur l'ODS 9 du 1er janvier 2024</span>
                        <div class="relative w-[295px]">
                            <input ref="input" v-model="mot" type="text" placeholder="Rechercher un mot..."
                                class="w-full rounded-lg shadow-md shadow-base3 p-3 pr-12 inter-bold text-xl text-bold bg-base1 border-none outline-none placeholder-base3 placeholder-opacity-100 placeholder:font-medium"
                                :class="[mot === '' || isSearching ? 'shadow-base3 text-primary' : motValide ? 'shadow-blue text-strongblue' : 'shadow-red text-strongred']" />
                            <div v-if="mot" @click="clearInput"
                                class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-secondary text-2xl font-bold transition-colors">
                                ×
                            </div>
                        </div>
                    </div>
                    <div v-if="mot && !isSearching" class="pt-2 text-primary text-sm flex flex-col flex-grow min-h-0">
                        <div class="flex-shrink-0">
                            <span v-if="motValide" class="flex justify-center text-lg text-strongblue font-semibold">est
                                valide au Scrabble</span>
                            <span v-else class="flex justify-center text-lg text-strongred font-semibold">n'est pas
                                valide au Scrabble</span>
                        </div>

                        <div class="mt-3 overflow-y-auto flex-grow min-h-0 custom-scrollbar">
                            <span v-if="motValide && definitions.length"
                                class="ml-5 text-sm pt-4 text-secondary">Définition:</span>
                            <div v-if="motValide && definitions.length" class="bg-base1 rounded-lg mx-5 p-2 mb-4">
                                <ul class="list-disc list-inside space-y-1 text-overflow-hidden">
                                    <li v-for="(definition, index) in definitions" :key="index">
                                        {{ definition }}
                                    </li>
                                </ul>
                            </div>

                            <div v-if="suggestions.length" class="mt-3 pb-4">
                                <span class="text-secondary text-sm mx-5">Propositions de mots :</span>
                                <ul class="list-disc list-inside space-y-1 mt-1 mx-5">
                                    <li v-for="(suggestion, index) in suggestions" :key="index"
                                        class="flex flex-row text-lg">
                                        <img src="@/assets/copyword.svg" alt="copy this word"
                                            class="cursor-pointer rounded-lg mr-2" @click="copyWord(suggestion)" />
                                        <span class="">{{ mot }}</span>
                                        <span class="font-bold">{{ suggestion.slice(mot.length) }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import Loader from './Loader.vue'
import { liste_mots } from './liste_mots' // utilisé pour la validation et suggestions

const ods9 = ref(null) // utilisé uniquement pour les définitions
const isLoading = ref(true)
const mot = ref("")
const motValide = ref(false)
const definitions = ref([])
const suggestions = ref([])
const isSearching = ref(false)

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

function clearInput() {
    mot.value = ""
    isSearching.value = false
}

onMounted(() => {
    loadDictionary()
})

const loadDictionary = async () => {
    try {
        const response = await fetch('https://scrabble.cjosse.com/ods9.json')
        const data = await response.json()
        ods9.value = data
        isLoading.value = false
        console.log("Dictionnaire chargé")
    } catch (error) {
        console.error('Erreur lors du chargement du dictionnaire:', error)
        isLoading.value = false
    }
}

function normaliser(texte) {
    return texte
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toLowerCase()
}

let debounceTimer = null

watch(mot, (newMot) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (newMot.trim() === "") {
        isSearching.value = false
        motValide.value = false
        definitions.value = []
        suggestions.value = []
        return
    }

    isSearching.value = true
    debounceTimer = setTimeout(() => {
        rechercherMot(newMot)
        isSearching.value = false
    }, 250)
})

function rechercherMot(motBrut) {
    const motNettoye = normaliser(motBrut)
    if (!motNettoye) {
        motValide.value = false
        definitions.value = []
        suggestions.value = []
        return
    }

    // Vérification dans liste_mots
    motValide.value = liste_mots.includes(motNettoye)

    // Récupération de la définition depuis ods9 (si dispo)
    definitions.value = motValide.value && ods9.value && ods9.value[motNettoye]
        ? ods9.value[motNettoye]
        : []

    // Suggestions (maximum 15 mots commençant par `motNettoye`)
    suggestions.value = liste_mots
        .filter(word => word.startsWith(motNettoye) && word !== motNettoye)
        .sort((a, b) => a.length - b.length || a.localeCompare(b))
        .slice(0, 30);
}

function copyWord(suggestion) {
    mot.value = suggestion
}
</script>

<style>
.toggletransition-enter-active,
.toggletransition-leave-active {
    transition: all 0.2s ease-in-out;
}

.toggletransition-leave-active {
    transition-delay: 0.1s;
}

.toggletransition-enter-from,
.toggletransition-leave-to {
    transform: translateY(30px);
    opacity: 0;
}

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