<template>
    <div class="flex flex-col items-center h-screen gap-6 p-4 overflow-hidden">
        <!-- Plateau de jeu -->
        <div ref="boardWrapper" @wheel.prevent="handleWheel" @mousedown.prevent="startPan" @mousemove="handlePan"
            @mouseup="stopPan" @mouseleave="stopPan">
            <div class="grid grid-cols-[repeat(15,3rem)] p-3 bg-base2 rounded-xl shadow-base3 shadow-md origin-top-left"
                :style="boardTransformStyle">
                <template v-for="(row, rowIndex) in 15" :key="'row-' + rowIndex">
                    <template v-for="(col, colIndex) in 15" :key="'cell-' + rowIndex + '-' + colIndex">
                        <div
                            :class="['h-12 w-12 border flex items-center justify-center relative', getCellClass(boardCell[rowIndex][colIndex])]">
                            <!-- Texte de la cellule toujours visible -->
                            <div v-if="boardCell[rowIndex][colIndex] !== ''"
                                class="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none">
                                <span v-if="boardCell[rowIndex][colIndex] === 'M3'"
                                    class="text-strongred text-lg">M3</span>
                                <span v-else-if="boardCell[rowIndex][colIndex] === 'L3'"
                                    class="text-strongblue text-lg">L3</span>
                                <span v-else-if="boardCell[rowIndex][colIndex] === 'M2'"
                                    class="text-red text-lg">M2</span>
                                <span v-else-if="boardCell[rowIndex][colIndex] === 'L2'"
                                    class="text-blue text-lg">L2</span>
                                <span v-else-if="boardCell[rowIndex][colIndex] === '★'"
                                    class="text-red text-xl">★</span>
                            </div>

                            <!-- Zone draggable par-dessus -->
                            <Draggable :list="board[rowIndex][colIndex]" group="letters"
                                class="flex items-center justify-center h-12 w-12" itemKey="id" :clone="cloneLetter"
                                :sort="false" @start="onDragStart" @end="onDragEnd">
                                <template #item="{ element }">
                                    <div class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary"
                                        @mousedown.stop="preventPan">
                                        {{ element.letter }}
                                        <span class="text-[12px] absolute right-[2px] bottom-[1px] h-[20px]">{{
                                            letterToValue[element.letter]
                                            }}</span>

                                    </div>
                                </template>
                            </Draggable>
                        </div>
                    </template>
                </template>
            </div>
        </div>

        <!-- Rack des lettres -->
        <div
            class="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row bg-base2 p-5 w-[745px] h-[115px] justify-between items-center rounded-xl shadow-base3 shadow-md z-50">
            <div class="w-[150px] flex justify-center">
                <div
                    class="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-base1 text-2xl font-bold text-secondary gap-1">
                    <img src="@/assets/bag.svg" alt="bag of letters" class="cursor-pointer " @click="showBag()" />
                    32
                </div>
            </div>
            <div class="flex flex-col">
                <img src="@/assets/retrieve.svg" alt="retrieve letters" class="cursor-pointer relative h-8"
                    @click="retrieveLetters()" />
                <div class="flex justify-center flex-row gap-1 bg-base1 p-3 pb-6 mt-1 rounded-lg w-[355px]">
                    <Draggable v-model="rackLetters" group="letters" itemKey="id" :clone="cloneLetter"
                        class="flex flex-row gap-1 w-full justify-center" @start="onDragStart" @end="onDragEnd" @change="handleRackChange">
                        <template #item="{ element, index }">
                            <div class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary"
                                @mousedown.stop="preventPan" @dragover.prevent="handleDragOver(index)"
                                @drop="handleDrop(index)" :data-index="index">
                                {{ element.letter }}
                                <span class="text-[12px] absolute right-[2px] bottom-[1px] h-[20px]">{{
                                    letterToValue[element.letter]
                                    }}</span>
                            </div>
                        </template>
                    </Draggable>
                </div>
                <span class="relative h-2 w-full bg-secondary -top-[8px]"></span>
                <img src="@/assets/shuffle.svg" alt="retrieve letters" class="cursor-pointer relative -top-7 h-8"
                    @click="retrieveLetters()" />
            </div>
            <div class="w-[150px] flex flex-col justify-center items-center gap-2">
                <span class="text-2xl text-strongblue font-bold">51pts</span>
                <button
                    class="px-6 py-[5px] bg-lightblue border-2 border-strongblue text-strongblue font-semibold rounded-lg text-sm">
                    Jouer le coup
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Draggable from 'vuedraggable'

const props = defineProps({
    UID: String,
    gameData: Object,
    gameId: String
})

const board = ref(
    Array.from({ length: 15 }, () =>
        Array.from({ length: 15 }, () => [])
    )
)

// Fonction pour mettre à jour le board local (pour usage futur)
const updateBoard = (newBoardData) => {
    if (newBoardData && Array.isArray(newBoardData)) {
        // Réinitialiser le board local
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const rowString = newBoardData[row] || '---------------'
                const letter = rowString[col] || '-'

                if (letter === '-') {
                    // Cellule vide
                    board.value[row][col] = []
                } else {
                    // Cellule avec une lettre
                    board.value[row][col] = [{
                        id: `board-${row}-${col}-${Date.now()}`, // ID unique pour chaque lettre sur le board
                        letter: letter
                    }]
                }
            }
        }
    }
}

// Initialisation du board au montage du composant
const initializeBoard = () => {
    const gameBoard = props.gameData?.board
    if (gameBoard) {
        updateBoard(gameBoard)
    }
}

// Initialiser le board immédiatement
initializeBoard()

const boardCell = [
    ['M3', '', '', 'L2', '', '', '', 'M3', '', '', '', 'L2', '', '', 'M3'],
    ['', 'M2', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'M2', ''],
    ['', '', 'M2', '', '', '', 'L2', '', 'L2', '', '', '', 'M2', '', ''],
    ['L2', '', '', 'M2', '', '', '', 'L2', '', '', '', 'M2', '', '', 'L2'],
    ['', '', '', '', 'M2', '', '', '', '', '', 'M2', '', '', '', ''],
    ['', 'L3', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'L3', ''],
    ['', '', 'L2', '', '', '', 'L2', '', 'L2', '', '', '', 'L2', '', ''],
    ['M3', '', '', 'L2', '', '', '', '★', '', '', '', 'L2', '', '', 'M3'],
    ['', '', 'L2', '', '', '', 'L2', '', 'L2', '', '', '', 'L2', '', ''],
    ['', 'L3', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'L3', ''],
    ['', '', '', '', 'M2', '', '', '', '', '', 'M2', '', '', '', ''],
    ['L2', '', '', 'M2', '', '', '', 'L2', '', '', '', 'M2', '', '', 'L2'],
    ['', '', 'M2', '', '', '', 'L2', '', 'L2', '', '', '', 'M2', '', ''],
    ['', 'M2', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'M2', ''],
    ['M3', '', '', 'L2', '', '', '', 'M3', '', '', '', 'L2', '', '', 'M3'],
]

const letterToValue = {
    A: 1, B: 3, C: 3, D: 2, E: 1,
    F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 10, L: 1, M: 2, N: 1, O: 1,
    P: 3, Q: 8, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 10, X: 10, Y: 10, Z: 10
};

// Utilisation d'un seul tableau pour les lettres du rack
const rackLetters = ref([])

// Fonction pour convertir une chaîne de caractères en format compatible avec Draggable
const convertStringToLetters = (playerLetters) => {
    return playerLetters.split('').map((letter, index) => ({
        id: Date.now() + index + Math.random(), // ID unique basé sur le timestamp + random
        letter: letter
    }))
}

// Fonction pour mettre à jour rackLetters (pour usage futur)
const updateRackLetters = (newPlayerLetters) => {
    rackLetters.value = convertStringToLetters(newPlayerLetters)
    console.log(rackLetters.value)
}

// Initialisation de rackLetters au montage du composant
const initializeRackLetters = () => {
    const playerLetters = props.gameData?.playerLetters?.[props.UID] || 'EBARPVC'
    rackLetters.value = convertStringToLetters(playerLetters)
}

// Initialiser rackLetters immédiatement
initializeRackLetters()

// Watcher pour surveiller les modifications de gameData.board
watch(
    () => props.gameData?.board,
    (newBoard, oldBoard) => {
        // Vérifier si le board a réellement changé (éviter les faux positifs)
        if (newBoard && JSON.stringify(newBoard) !== JSON.stringify(oldBoard)) {
            // Mettre à jour le board local
            updateBoard(newBoard)

            // Mettre à jour rackLetters
            const playerLetters = props.gameData?.playerLetters?.[props.UID] || 'EBARPVC'
            updateRackLetters(playerLetters)
        }
    },
    { deep: true } // Surveiller les modifications profondes du board
)

const cloneLetter = (original) => original ? { ...original } : null

function getCellClass(cell) {
    switch (cell) {
        case 'M3': return 'bg-red border-strongred select-none';
        case 'L3': return 'bg-blue border-strongblue select-none';
        case 'M2': return 'bg-lightred border-red select-none';
        case 'L2': return 'bg-lightblue border-blue select-none';
        case '★': return 'bg-lightred border-red select-none';
        default: return 'bg-base1 border-base2 select-none';
    }
}

const boardWrapper = ref(null)
const scale = ref(1)
const translate = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const isDragging = ref(false)

const boardTransformStyle = computed(() => {
    return {
        transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scale.value})`,
        transition: isPanning.value ? 'none' : 'transform 0.05s ease-out'
    }
})

const handleWheel = (event) => {
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.min(2.5, Math.max(0.5, scale.value + delta))

    if (newScale !== scale.value) {
        // Récupérer les coordonnées de la souris par rapport au wrapper du plateau
        const rect = boardWrapper.value.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Calculer le facteur de zoom
        const scaleFactor = newScale / scale.value

        // Ajuster la translation pour que le zoom se fasse depuis la position de la souris
        translate.value.x = mouseX - (mouseX - translate.value.x) * scaleFactor
        translate.value.y = mouseY - (mouseY - translate.value.y) * scaleFactor

        scale.value = newScale
    }
}

const startPan = (event) => {
    // Ne pas activer le pan si on est en train de faire du drag & drop
    if (event.button !== 0 || isDragging.value) return
    isPanning.value = true
    panStart.value = { x: event.clientX, y: event.clientY }
}

const handlePan = (event) => {
    if (!isPanning.value || isDragging.value) return
    const dx = event.clientX - panStart.value.x
    const dy = event.clientY - panStart.value.y
    translate.value.x += dx
    translate.value.y += dy
    panStart.value = { x: event.clientX, y: event.clientY }
}

const stopPan = () => {
    isPanning.value = false
}

// Nouvelles fonctions pour gérer le drag & drop
const onDragStart = () => {
    isDragging.value = true
    isPanning.value = false // Arrêter le pan si en cours
}

const onDragEnd = () => {
    isDragging.value = false
}

const preventPan = (event) => {
    // Empêcher la propagation pour éviter le déclenchement du pan
    event.stopPropagation()
}

// Fonctions pour gérer le drag and drop dans le rack
const handleRackChange = (event) => {
    // Cette fonction est appelée automatiquement par Draggable lors d'un changement
    // On peut l'utiliser pour des opérations supplémentaires si nécessaire
}

const handleDragOver = (index) => {
    // Nécessaire pour permettre le drop
}

const handleDrop = (targetIndex) => {
    // Cette logique est maintenant gérée automatiquement par vuedraggable
    // avec le v-model sur rackLetters
}

// Fonctions manquantes (à implémenter selon vos besoins)
const showBag = () => {
    console.log('Show bag')
}

const retrieveLetters = () => {
    console.log('Retrieve letters')
}
</script>