<template>
    <div v-if="isLoading">
        loading
    </div>
    <div v-else>
        <div v-if="isCreating && isLeader || !isPlayerInGame && isInLobby">
            <Login :UID="UID" :gameData="gameData"/>
        </div>
        <div v-else-if="isInLobby && isPlayerInGame">
            <Lobby :gameData="gameData"/>
        </div>
        <div v-else-if="isInGame && isPlayerInGame">
            Game
        </div>
        <div v-else>
            <NotFound/>
        </div>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getDatabase, ref as dbRef, onValue, set, get, update, onDisconnect } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'
import NotFound from './NotFound.vue'
import Login from './Login.vue'
import Lobby from './Lobby.vue'

const route = useRoute()
const gameId = route.params.gameId
const gameData = ref(null)

// Champs réactifs
const isInLobby = ref(false)
const isInGame = ref(false)
const isPlayerInGame = ref(false)
const isLeader = ref(null)
const isCreating = ref(false)
const isLoading = ref(true)

// Configuration Firebase
const database = getDatabase()
const partieRef = dbRef(database, `/${gameId}`)
const auth = getAuth()
let UID = null

// Fonction d'initialisation asynchrone
const initialize = async () => {
    try {
        // Authentification anonyme
        await signInAnonymously(auth)
        UID = auth.currentUser.uid
        console.log("Authentification anonyme :", UID)

        // Écoute des changements sur la partie dans Firebase
        onValue(partieRef, (snapshot) => {
            const data = snapshot.val()
            gameData.value = data
            if (data) {
                // Les 3 valeurs possible du ".gameStatus"
                isInGame.value = (data.gameStatus === 'ingame')
                isInLobby.value = (data.gameStatus === 'lobby')
                isCreating.value = (data.gameStatus === 'increation')

                // Vérifie si l'utilisateur (UID) est déjà enregistré dans idToPlayer
                const hasIdToPlayer = data.idToPlayer || {}
                isPlayerInGame.value = hasIdToPlayer.hasOwnProperty(UID)

                isLeader.value = (data.leader === UID)
            }
            isLoading.value = false
        }, (error) => {
            console.error("Erreur de récupération des données :", error)
            isLoading.value = false
        })
    } catch (error) {
        console.error("Erreur d'auth :", error.code, error.message)
        isLoading.value = false
    }
}

onMounted(() => {
    initialize()
})
</script>
