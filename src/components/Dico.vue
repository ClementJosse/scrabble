<template>
    <div class="fixed top-[125px] left-6">
        <div v-if="isLeader" class="mb-10 ml-4">
            <img src="@/assets/lobby.svg" alt="return to lobby" class="cursor-pointer rounded-lg"
                @click="showReturnMenu()" />
        </div>
        <img src="@/assets/dico.svg" alt="return to lobby" class="cursor-pointer rounded-lg ml-4 relative z-20"
            @click="showDico()" />
        <div v-if="isDicoVisible"
            class="bg-base2 w-[330px] h-screen relative z-10 -top-[60px] h-[calc(100vh-226px)] shadow-md shadow-base3 rounded-xl overflow-y-auto">
            <div v-if="isLoading"
                class="flex justify-center items-center h-[calc(100vh-350px)] flex-col text-secondary text-lg gap-5">
                <Loader />
                Chargement du dictionnaire...
            </div>
            <div v-else>
                <div class="pt-20 text-sm text-secondary flex flex-col items-center">
                    *basé sur l’ODS 9 du 1er janvier 2024
                    <input ref="input" v-model="mot" type="text" placeholder="Rechercher un mot..."
                        class="w-[300px] rounded-lg shadow-md shadow-base3 p-3 text-primary inter-bold text-xl text-bold bg-base1 border-none outline-none placeholder-base3 placeholder-opacity-100 placeholder:font-medium" />
                </div>
                <div v-if="mot" class="px-4 pt-6 text-primary text-sm">
                    <span v-if="motValide" class="text-green-600 font-semibold">✅ Est valide au Scrabble</span>
                    <span v-else class="text-red-500 font-semibold">❌ N'est pas valide au Scrabble</span>

                    <div v-if="motValide" class="mt-4">
                        <p class="text-base3 font-semibold mb-2">Définition :</p>
                        <ul class="list-disc list-inside space-y-1">
                            <li v-for="(definition, index) in definitions" :key="index">
                                {{ definition }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="suggestions.length" class="mt-6">
                        <span class="text-base3 font-semibold">Propositions de mots :</span>
                        <ul class="list-disc list-inside space-y-1 mt-1 max-h-64 overflow-y-auto">
                            <li v-for="(suggestion, index) in suggestions" :key="index">
                                {{ suggestion }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import Loader from './Loader.vue'

const ods9 = ref(null)
const isLoading = ref(true)
const mot = ref("")
const motValide = ref(false)
const definitions = ref([])
const suggestions = ref([])

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
    debounceTimer = setTimeout(() => {
        rechercherMot(newMot)
    }, 250) // délai de 250ms après la dernière frappe
})

function rechercherMot(motBrut) {
    const motNettoye = normaliser(motBrut)
    if (!ods9.value || !motNettoye) {
        motValide.value = false
        definitions.value = []
        suggestions.value = []
        return
    }

    motValide.value = motNettoye in ods9.value
    definitions.value = motValide.value ? ods9.value[motNettoye] : []
    suggestions.value = Object.keys(ods9.value)
        .filter(word => word.startsWith(motNettoye))
        .slice(0, 15)
}

</script>
