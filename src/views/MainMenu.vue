<template>
    <div class="flex flex-col items-center ">
        <button class="mt-[300px] px-10 py-3 bg-secondary rounded-xl text-base1 inter-bold text-2xl w-[290px] h-[70px]"
            @click='createGame()'>
            Créer une partie
        </button>
        <span v-if="existe" class="mt-[90px] text-secondary text-xl">Parties disponibles</span>
        <button v-for="(partie, code) in gameData" :key="code" class="bg-base2 rounded-xl px-6 py-2 text-center mt-7 w-[290px] h-[70px]" @click="joinGame(code)">              <!-- itération dans la clé (de la game), chaque partie (que je définis en l.15) -->
            <p class="text-2xl text-primary inter-bold">{{ Object.values(partie.idToPlayer).length }} Joueurs</p>                                                               <!-- nombre de value dans idToPlayer (length) = nb joueurs -->
            <p class="text-secondary font-medium">Créé par:<span class="ml-1 text-primary inter-bold">{{ (partie.idToPlayer)[partie.leader]}}</span></p>                            <!-- affiche le id du UID = leader -->
        </button>
    </div>
</template>

<script setup>
import router from '../router';
import { ref, onMounted } from 'vue'
import { getDatabase, ref as dbRef, onValue, set, get, child} from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'

const auth = getAuth()
let UID = null

const database = getDatabase()
const rootRef = dbRef(database, `/`)
const gameData = ref(null)
const existe = ref(false)

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
            existe.value = data && Object.keys(data).length > 0
        })

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