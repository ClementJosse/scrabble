<template>
    <div class="flex flex-col items-center ">
        <button class="mt-[400px] px-10 py-3 bg-secondary rounded-lg text-base1 inter-bold text-xl"
            @click='createGame()'>
            Créer une partie
        </button>

    </div>
</template>


<script setup>
import router from '../router';
import { ref, onMounted } from 'vue'
import { getDatabase, ref as dbRef, onValue, set, get, child, serverTimestamp } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const auth = getAuth()
let UID = null

// Fonction d'initialisation asynchrone
const initialize = async () => {
    try {
        // Authentification anonyme
        await signInAnonymously(auth)
        UID = auth.currentUser.uid
        console.log("Authentification anonyme :", UID)

    } catch (error) {
        console.error("Erreur d'auth :", error.code, error.message)
        isLoading.value = false
    }
}

onMounted(() => {
    initialize()
})

const createGame = () => {
    const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    const rootRef = dbRef(getDatabase(), '/')
    const gameRef = child(rootRef, code);

    try {
        const snapshot = get(gameRef);
        if (snapshot != undefined) {
            console.log("Création d'une partie unique avec le code :", code);

            // Définir les données initiales de la partie
            set(gameRef, {
                gameStatus: 'increation',
                leader: UID,
                playerList: [UID]
            });

            // Rediriger vers la nouvelle partie
            router.push(`/${code}`);
        } else {
            console.warn("Le code de partie existe déjà :", code);
            // Relancer la création avec un nouvel essai
            createGame();
        }
    } catch (error) {
        console.error('Erreur lors de la création de la partie:', error);
    }
}
</script>