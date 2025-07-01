<template>
    <div class="flex flex-col items-center h-screen gap-6 p-4 overflow-hidden">
        <!-- Plateau de jeu -->
        <div ref="boardWrapper" @wheel.prevent="handleWheel" @mousedown.prevent="startPan" @mousemove="handlePan"
            @mouseup="stopPan" @mouseleave="stopPan">
            <div class="grid grid-cols-[repeat(15,3rem)] p-3 bg-base2 rounded-xl shadow-base3 shadow-md origin-top-left"
                :style="boardTransformStyle">
                <template v-for="(row, rowIndex) in 15" :key="'row-' + rowIndex">
                    <template v-for="(col, colIndex) in 15" :key="'cell-' + rowIndex + '-' + colIndex">
                        <div :class="['h-12 w-12 border flex items-center justify-center relative', getCellClass(boardCell[rowIndex][colIndex])]"
                            @drop="handleCellDrop(rowIndex, colIndex, $event)"
                            @dragover.prevent="handleCellDragOver(rowIndex, colIndex, $event)"
                            @dragleave="handleCellDragLeave(rowIndex, colIndex, $event)">
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

                            <!-- Indicateur de drop -->
                            <div v-if="hoveredCell && hoveredCell.row === rowIndex && hoveredCell.col === colIndex && canDropInCell(rowIndex, colIndex)"
                                class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                                <div class="h-9 w-9 ring-secondary ring-2 rounded"></div>
                            </div>

                            <!-- Lettre sur le plateau -->
                            <div v-if="board[rowIndex][colIndex]" class="flex items-center justify-center h-12 w-12">
                                <div class="h-11 w-11 rounded-lg select-none flex items-center justify-center border-2 relative z-10 font-bold text-xl"
                                    :class="isFixed(rowIndex, colIndex) ?
                                        'bg-base2 border-secondary text-primary' :
                                        (isValid() ? 'bg-lightblue border-blue text-strongblue' : 'bg-lightred border-red text-strongred')"
                                    :draggable="!isFixed(rowIndex, colIndex)"
                                    @dragstart="handleDragStart(rowIndex, colIndex, $event)"
                                    @mousedown.stop="preventPan">
                                    {{ board[rowIndex][colIndex] }}
                                    <span class="text-[12px] absolute right-[2px] bottom-[1px] h-[20px]">
                                        {{ letterToValue[board[rowIndex][colIndex]] }}
                                    </span>
                                </div>
                            </div>
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
                <div class="flex justify-center flex-row gap-1 bg-base1 p-3 pb-6 mt-1 rounded-lg w-[355px]"
                    @drop="handleRackDrop($event)" @dragover.prevent>
                    <div v-for="(letter, index) in rackLetters" :key="`rack-${index}`"
                        class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary"
                        :draggable="true" @dragstart="handleRackDragStart(index, $event)" @mousedown.stop="preventPan">
                        {{ letter }}
                        <span class="text-[12px] absolute right-[2px] bottom-[1px] h-[20px]">
                            {{ letterToValue[letter] }}
                        </span>
                    </div>
                    <!-- Cases vides pour compléter le rack -->
                    <div v-for="emptySlot in Math.max(0, 7 - rackLetters.length)" :key="`empty-${emptySlot}`"
                        class="h-11 w-11 rounded-lg border-2 border-dashed border-base3">
                    </div>
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

const props = defineProps({
    UID: String,
    gameData: Object,
    gameId: String
})

const board = ref(
    Array.from({ length: 15 }, () =>
        Array.from({ length: 15 }, () => '')
    )
)

// Fonction pour mettre à jour le board local
const updateBoard = (newBoardData) => {
    if (newBoardData && Array.isArray(newBoardData)) {
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const rowString = newBoardData[row] || '---------------'
                const letter = rowString[col] || '-'
                board.value[row][col] = letter === '-' ? '' : letter
            }
        }
    }
}

const gameBoard = ref(null)

// Initialisation du board au montage du composant
const initializeBoard = () => {
    gameBoard.value = props.gameData?.board
    if (gameBoard.value) {
        updateBoard(gameBoard.value)
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

// Rack simplifié : tableau de lettres (strings)
const rackLetters = ref([])

// Fonction pour convertir une chaîne de caractères en tableau de lettres
const convertStringToLetters = (playerLetters) => {
    return playerLetters.split('')
}

// Fonction pour mettre à jour rackLetters
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
        if (newBoard && JSON.stringify(newBoard) !== JSON.stringify(oldBoard)) {
            updateBoard(newBoard)
            const playerLetters = props.gameData?.playerLetters?.[props.UID] || 'EBARPVC'
            updateRackLetters(playerLetters)
        }
    },
    { deep: true }
)

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
        const rect = boardWrapper.value.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        const scaleFactor = newScale / scale.value

        translate.value.x = mouseX - (mouseX - translate.value.x) * scaleFactor
        translate.value.y = mouseY - (mouseY - translate.value.y) * scaleFactor

        scale.value = newScale
    }
}

const startPan = (event) => {
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

const preventPan = (event) => {
    event.stopPropagation()
}

// Variables pour le drag & drop
const draggedItem = ref(null)
const dragSource = ref(null) // 'rack' ou 'board'
const dragSourceIndex = ref(null) // index dans le rack ou {row, col} pour le board
const hoveredCell = ref(null) // {row, col} de la cellule survolée

// Gestion du drag depuis le rack
const handleRackDragStart = (index, event) => {
    isDragging.value = true
    draggedItem.value = rackLetters.value[index]
    dragSource.value = 'rack'
    dragSourceIndex.value = index
    event.dataTransfer.effectAllowed = 'move'
}

// Gestion du drag depuis le board
const handleDragStart = (row, col, event) => {
    if (isFixed(row, col)) {
        event.preventDefault()
        return
    }
    isDragging.value = true
    draggedItem.value = board.value[row][col]
    dragSource.value = 'board'
    dragSourceIndex.value = { row, col }
    event.dataTransfer.effectAllowed = 'move'
}

// Gestion du survol des cellules pendant le drag
const handleCellDragOver = (row, col, event) => {
    event.preventDefault()
    if (draggedItem.value && canDropInCell(row, col)) {
        hoveredCell.value = { row, col }
        event.dataTransfer.dropEffect = 'move'
    } else {
        hoveredCell.value = null
        event.dataTransfer.dropEffect = 'none'
    }
}

const handleCellDragLeave = (row, col, event) => {
    // Vérifier si on quitte vraiment la cellule (pas juste un enfant)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        if (hoveredCell.value && hoveredCell.value.row === row && hoveredCell.value.col === col) {
            hoveredCell.value = null
        }
    }
}

// Fonction pour vérifier si on peut déposer dans une cellule
const canDropInCell = (row, col) => {
    if (!draggedItem.value) return false

    // Si la cellule est déjà occupée
    if (board.value[row][col]) {
        // On peut seulement déposer si on vient de cette même cellule
        return dragSource.value === 'board' &&
            dragSourceIndex.value.row === row &&
            dragSourceIndex.value.col === col
    }

    // Cellule vide, on peut toujours déposer
    return true
}
// Drop sur une cellule du board
const handleCellDrop = (row, col, event) => {
    event.preventDefault()
    if (!draggedItem.value || !canDropInCell(row, col)) return

    // Effectuer le déplacement
    if (dragSource.value === 'rack') {
        // Du rack vers le board
        rackLetters.value.splice(dragSourceIndex.value, 1)
        board.value[row][col] = draggedItem.value
    } else if (dragSource.value === 'board') {
        // Du board vers le board
        board.value[dragSourceIndex.value.row][dragSourceIndex.value.col] = ''
        board.value[row][col] = draggedItem.value
    }

    // Reset
    draggedItem.value = null
    dragSource.value = null
    dragSourceIndex.value = null
    hoveredCell.value = null
    isDragging.value = false
}

// Drop sur le rack
const handleRackDrop = (event) => {
    event.preventDefault()
    if (!draggedItem.value || dragSource.value === 'rack') return

    // Seulement depuis le board vers le rack
    if (dragSource.value === 'board') {
        board.value[dragSourceIndex.value.row][dragSourceIndex.value.col] = ''
        rackLetters.value.push(draggedItem.value)
    }

    // Reset
    draggedItem.value = null
    dragSource.value = null
    dragSourceIndex.value = null
    hoveredCell.value = null
    isDragging.value = false
}

// Fonctions manquantes
const showBag = () => {
    console.log('Show bag')
}

const retrieveLetters = () => {
    console.log('Retrieve letters')
}

function countWord(row, col, direction){

}

function checkWord(row, col, direction){
    
}

function checkMove(row, col){ // return true/false + les points
    // var score = 0
    // var wordList = {}
    // check a gauche s'il y a une lettre
        // while : se déplacer vers la lettre la plus à gauche
            // une fois dessus, score+=countWord()
            // wordList.add(checkword())
        
}

function isValid() {
    // Si toute les lettres sont sur la meme ligne sans trou
    
        // Si le plateau est vierge
            /* calcul des points du mot */
            // Si l'une des lettres touche le centre
                /* return true*/
        // Sinon (si le plateau n'est pas vierge)
            // Si au moins une lettre de board touche une lettre fixed du gameBoard
                // recherche de la lettre la plus en haut a gauche
                    // appel de la fonction récursive de coupvalide+comptage de point
                    /* return true || false*/

    return false
}

const isFixed = (row, col) => {
    const letter = board.value[row][col]
    return letter && gameBoard.value && gameBoard.value[row] && gameBoard.value[row][col] === letter
}

</script>