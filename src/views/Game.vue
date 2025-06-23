<template>
    <div v-if="isLoading">
        loading
    </div>
    <div v-else>
        partie
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'
import { getDatabase, ref as dbRef, onValue, set, get, update, onDisconnect } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const route = useRoute()
const gameId = route.params.gameId

// Champs réactifs
const username = ref('')
const gameInfo = ref(null)
const isInLobby = ref(false)
const isInGame = ref(false)
const isUsernameInGame = ref(false)
const isLeader = ref(null)
const isCreating = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const isTransitioning = ref(false)

// Configuration Firebase
const database = getDatabase()
const partiesRef = dbRef(database, `/${gameId}`)
const auth = getAuth()
let UID = null
const leader = ref(null)

// Fonction d'initialisation asynchrone
const initialize = async () => {
    try {
        // Authentification anonyme
        await signInAnonymously(auth)
        UID = auth.currentUser.uid
        console.log("Authentification anonyme :", UID)

        // Écoute des changements sur la partie dans Firebase
        onValue(partiesRef, (snapshot) => {
            const data = snapshot.val()

            if (data) {
                gameInfo.value = data
                // On vérifie que la partie est en mode 'lobby'
                isInLobby.value = (data.status === 'lobby')

                // Vérifie si l'utilisateur est en train de créer la partie
                isCreating.value = (data.status === 'creating') && (data.leader === UID)

                // Vérifie si l'utilisateur (UID) est déjà enregistré dans uid_to_username
                const hasUidToUsername = data.uid_to_username || {}
                isUsernameInGame.value = hasUidToUsername.hasOwnProperty(UID)

                // Gestion de la transition
                if (data.status === 'ingame' && !isInGame.value) {
                    isTransitioning.value = true
                    setTimeout(() => {
                        isInGame.value = true
                        isTransitioning.value = false
                    }, 500)
                } else {
                    isInGame.value = (data.status === 'ingame')
                }

                leader.value = data.leader
                isLeader.value = (data.leader === UID)
            } else {
                isInLobby.value = false
            }

            isLoading.value = false
        }, (error) => {
            console.error("Erreur de récupération des données :", error)
            hasError.value = true
            isLoading.value = false
        })
    } catch (error) {
        console.error("Erreur d'auth :", error.code, error.message)
        hasError.value = true
        isLoading.value = false
    }
}

onMounted(() => {
    initialize()
})
</script>
