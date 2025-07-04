<template>
    <div class="flex items-center gap-2 justify-center translate-y-[150px]">
        <img src="@/assets/logo.svg" alt="Logo de scrabble" />
        <div class="flex flex-col">
            <span class="text-secondary inter-bold text-3xl">Scrabble</span>
            <span class="text-primary inter-bold text-2xl">Français en ligne</span>
        </div>
    </div>
    <div class="flex flex-col items-center mb-20">
        <button class="mt-[300px] px-10 py-3 bg-secondary rounded-xl text-base1 inter-bold text-2xl w-[290px] h-[70px]"
            @click='createGame()'>
            Créer une partie
        </button>
        <span v-if="exist" class="mt-[90px] text-secondary text-xl">Parties disponibles</span>
        <button v-for="(partie, code) in gameData" :key="code"
            class="bg-base2 rounded-xl px-6 py-2 text-center mt-7 w-[290px] h-[70px]" @click="joinGame(code)">
            <!-- itération dans la clé (de la game), chaque partie (que je définis en l.15) -->
            <p class="text-2xl text-primary inter-bold">{{ Object.values(partie.idToPlayer || {}).length }} Joueurs</p>
            <!-- nombre de value dans idToPlayer (length) = nb joueurs -->
            <p class="text-secondary font-medium">Créé par :<span class="text-primary inter-bold">{{
                (partie.idToPlayer || {})[partie.leader] || "Leader (en création)" }}</span></p>
            <!-- affiche le id du UID = leader -->
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

const database = getDatabase()
const rootRef = dbRef(database, `/`)
const gameData = ref(null)
const exist = ref(false)

// Fonction d'initialisation asynchrone
const initialize = async () => {
    try {
        // Authentification anonyme
        await signInAnonymously(auth)
        UID = auth.currentUser.uid
        console.log("Authentification anonyme :", UID)
        // Écoute des changements sur la partie dans Firebase
        onValue(rootRef, (snapshot) => {
            const data = snapshot.val()
            gameData.value = data
            exist.value = data && Object.keys(data).length > 0
            deleteOldLobbies()
        })

    } catch (error) {
        console.error("Erreur d'auth :", error.code, error.message)
        isLoading.value = false
    }
}

const deleteOldLobbies = () => {
    // Vérifier si gameData contient des parties
    if (!gameData.value) {
        console.log("Aucune partie trouvée dans la base de données")
        return
    }

    // Timestamp actuel
    const now = Date.now()

    // Parcourir toutes les parties dans gameData
    Object.entries(gameData.value).forEach(([code, partie]) => {
        if (partie && partie.timestamp) {
            const partieTimestamp = partie.timestamp
            const diff = now - partieTimestamp

            if (diff > 50000000) {
                // Supprimer la partie de Firebase
                const gameRef = child(rootRef, code)
                set(gameRef, null)
                    .then(() => {
                        console.log(`Partie ${code} supprimée - Âge: ${Math.floor(diff / 1000)}s`)
                    })
                    .catch((error) => {
                        console.error(`Erreur lors de la suppression de la partie ${code}:`, error)
                    })
            }
        }
    })
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
                timestamp: serverTimestamp()
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
const joinGame = (code) => {
    router.push(`/${code}`)
}



</script>