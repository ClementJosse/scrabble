<template>
    <div class="pt-[350px]">
        <div class="px-4 py-3 rounded-lg border border-2 border-secondary bg-base1 text-xl mx-auto w-fit">
            <div class="flex items-center">
                <input v-model="nom" type="text" placeholder="Entrez votre nom..."
                    class="w-[250px] text-primary inter-bold text-2xl text-bold bg-transparent border-none outline-none placeholder-base3 placeholder-opacity-100 placeholder:font-medium" />
                <img @click="login()" v-if="nom" src="@/assets/login.svg" class="cursor-pointer w-10 h-8" />
                <div v-else class="w-10 h-8"> </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { getDatabase, ref as dbRef, onValue, set, get, update, onDisconnect } from 'firebase/database'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const gameId = route.params.gameId
const nom = ref("")
const database = getDatabase()
const partieRef = dbRef(database, `/${gameId}`)


const props = defineProps({
    UID: {
        type: Object
    },
    gameData: {
        type: Object
    }
})

function login() {
    if (props.gameData.gameStatus == "increation") {
        update(partieRef, { gameStatus: 'lobby' })
        update(partieRef, { [`idToPlayer/${props.UID}`]: nom.value })
    }
    else {
        update(partieRef, { [`idToPlayer/${props.UID}`]: nom.value })
    }
}

</script>
