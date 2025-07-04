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
                                        (isValidMemoized ? 'bg-lightblue border-blue text-strongblue' : 'bg-lightred border-red text-strongred')"
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
            class="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row bg-base2 p-3 w-[745px] h-[115px] justify-between items-center rounded-xl shadow-base3 shadow-md z-50">
            <div class="w-[170px] flex justify-center">
                <div
                    class="w-[80px] h-[80px] flex justify-center items-center rounded-full bg-base1 text-2xl font-bold text-secondary gap-1">
                    <img src="@/assets/bag.svg" alt="bag of letters" />
                    {{ bagSize }}
                </div>
            </div>
            <div class="flex flex-col justify-center items-center">
                <img v-if="hasLettersOnBoard" src="@/assets/retrieve.svg" alt="retrieve letters"
                    class="cursor-pointer fixed h-8 w-8 -top-5" @click="retrieveLetters()" />
                <div class="flex justify-center flex-row gap-1 bg-base1 p-3 pb-6 mt-1 rounded-lg w-[355px] mt-9"
                    @drop="handleRackDrop($event)" @dragover.prevent>
                    <div v-for="(letter, index) in rackLetters" :key="`rack-${index}`"
                        class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary"
                        :draggable="true" @dragstart="handleRackDragStart(index, $event)" @mousedown.stop="preventPan"
                        @drop="handleRackLetterDrop(index, $event)"
                        @dragover.prevent="handleRackLetterDragOver(index, $event)" @dragenter.prevent>
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
                <img src="@/assets/shuffle.svg" alt="shuffle letters" class="cursor-pointer relative -top-7 h-8"
                    @click="shuffleRackLetters()" />
            </div>
            <div class="w-[170px] flex flex-col justify-center items-center gap-2">
                <div class="flex flex-col justify-center items-center gap-2" v-if="hasLettersOnBoard">
                    <span v-if="playScore === 0" class="text-2xl text-strongred font-bold">×</span>
                    <span v-else class="text-2xl font-bold"
                        :class="(isValidMemoized ? 'text-strongblue' : 'text-strongred')">{{
                            playScore }}pts</span>
                    <span v-if="isValidMemoized">
                        <button v-if="props.UID === props.gameData.playerOrder[props.gameData.playerIndex]"
                            @click="playMove()"
                            class="px-6 py-[5px] bg-lightblue border-2 border-strongblue text-strongblue font-semibold rounded-lg text-sm">
                            Jouer le coup
                        </button>
                        <span v-else class="text-strongblue text-sm font-semibold h-5">
                            Valide au Scrabble
                        </span>
                    </span>
                    <span v-else class="text-strongred text-sm font-semibold">
                        Non valide au Scrabble
                    </span>
                </div>
                <div>
                    <!-- Pas de lettre posée, rien ici...-->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getDatabase, ref as dbRef, onValue, set, get, update, onDisconnect, serverTimestamp } from 'firebase/database'

const props = defineProps({
    UID: String,
    gameData: Object,
    gameId: String,
    listeMots: Object
})

const bagSize = ref(Object.values(props.gameData.bagTile).reduce((a, b) => a + b, 0))
const database = getDatabase()

async function playMove() {
    // Créer le nouveau board avec les lettres placées
    let newBoard = [];
    for (let i = 0; i < 15; i++) {
        newBoard[i] = [];
        for (let j = 0; j < 15; j++) {
            const currentCell = gameBoard.value[i][j];
            if (currentCell === '-' && board.value[i][j] !== '') {
                newBoard[i][j] = board.value[i][j];
            } else {
                newBoard[i][j] = currentCell;
            }
        }
    }

    // Calculer le prochain index de joueur
    const nextIndex = (props.gameData.playerIndex + 1) % props.gameData.playerOrder.length;

    // Compter les lettres placées sur le board
    const placedLettersCount = countPlacedLetters();

    // Calculer les nouvelles lettres pour le rack depuis le sac
    const newRackLetters = drawLettersFromBag(placedLettersCount);

    // Mettre à jour le sac de tuiles
    const updatedBagTile = { ...props.gameData.bagTile };
    newRackLetters.forEach(letter => {
        if (updatedBagTile[letter] > 0) {
            updatedBagTile[letter]--;
        }
    });

    // Mettre à jour les lettres du joueur
    const updatedPlayerLetters = { ...props.gameData.playerLetters };
    updatedPlayerLetters[props.UID] = [...rackLetters.value, ...newRackLetters].join('');

    // Mettre à jour les scores
    const updatedScores = { ...props.gameData.scores };
    if (!updatedScores[props.UID]) {
        updatedScores[props.UID] = [];
    }
    updatedScores[props.UID].push(playScore.value);

    // Déterminer le statut du jeu
    const bagWasEmpty = Object.values(props.gameData.bagTile).every(count => count === 0);
    const playerUsedAllLetters = rackLetters.value.length === 0;
    const gameStatus = (bagWasEmpty && playerUsedAllLetters) ? "finished" : "ingame";

    // Mettre à jour Firebase
    await update(dbRef(database, props.gameId), {
        board: newBoard,
        playerIndex: nextIndex,
        timestamp: serverTimestamp(),
        bagTile: updatedBagTile,
        playerLetters: updatedPlayerLetters,
        scores: updatedScores,
        gameStatus: gameStatus
    });

    // Update du gameBoard
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const currentCell = gameBoard.value[i][j];
            if (currentCell === '-' && board.value[i][j] !== '') {
                gameBoard.value[i][j] = board.value[i][j];
            }
        }
    }
}

// Fonction auxiliaire pour compter les lettres placées
function countPlacedLetters() {
    let count = 0;
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (board.value[row][col] !== '' && gameBoard.value[row][col] === '-') {
                count++;
            }
        }
    }
    return count;
}

// Fonction auxiliaire pour piocher des lettres du sac
function drawLettersFromBag(count) {
    const newLetters = [];
    const availableLetters = [];

    // Créer un tableau de lettres disponibles
    Object.entries(props.gameData.bagTile).forEach(([letter, quantity]) => {
        for (let i = 0; i < quantity; i++) {
            availableLetters.push(letter);
        }
    });

    // Piocher aléatoirement
    for (let i = 0; i < Math.min(count, availableLetters.length); i++) {
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const pickedLetter = availableLetters.splice(randomIndex, 1)[0];
        newLetters.push(pickedLetter);
    }

    return newLetters;
}

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
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1,
    'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'K': 10, 'L': 1, 'M': 2, 'N': 1, 'O': 1,
    'P': 3, 'Q': 8, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'W': 10, 'X': 10, 'Y': 10, 'Z': 10
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


// Computed pour vérifier s'il y a des lettres sur le terrain
const hasLettersOnBoard = computed(() => {
    if (!gameBoard.value) return false

    // Vérifier s'il y a des lettres nouvellement placées (non fixes)
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (board.value[row][col] !== '' && gameBoard.value[row][col] === '-') {
                return true
            }
        }
    }
    return false
})

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

    // Déclencher la validation avec debounce
    triggerValidation()
}

// Drop sur le rack
const handleRackDrop = (event) => {
    event.preventDefault()
    if (!draggedItem.value) return

    // Si on vient du rack et qu'on drop dans une zone vide, on ne fait rien
    if (dragSource.value === 'rack') {
        // Reset sans action
        draggedItem.value = null
        dragSource.value = null
        dragSourceIndex.value = null
        isDragging.value = false
        return
    }

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

    // Déclencher la validation avec debounce
    triggerValidation()
}

const handleRackLetterDragOver = (targetIndex, event) => {
    event.preventDefault()
    if (draggedItem.value && dragSource.value === 'rack' && dragSourceIndex.value !== targetIndex) {
        event.dataTransfer.dropEffect = 'move'
    } else {
        event.dataTransfer.dropEffect = 'none'
    }
}

const handleRackLetterDrop = (targetIndex, event) => {
    event.preventDefault()
    event.stopPropagation() // Empêcher la propagation vers le drop du rack global

    if (!draggedItem.value || dragSource.value !== 'rack' || dragSourceIndex.value === targetIndex) {
        return
    }

    // Échange des lettres
    // TODO ne pas echanger mais faire une insertion avec animation de translation
    const sourceIndex = dragSourceIndex.value
    const targetLetter = rackLetters.value[targetIndex]
    const sourceLetter = rackLetters.value[sourceIndex]

    // Effectuer l'échange
    rackLetters.value[sourceIndex] = targetLetter
    rackLetters.value[targetIndex] = sourceLetter

    // Reset
    draggedItem.value = null
    dragSource.value = null
    dragSourceIndex.value = null
    isDragging.value = false
}

const shuffleArray = (array) => {
    const shuffled = [...array] // Créer une copie pour éviter la mutation
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

// Fonction pour mélanger les lettres du rack
const shuffleRackLetters = () => {
    if (rackLetters.value.length > 1) {
        rackLetters.value = shuffleArray(rackLetters.value)
    }
}

// Variables pour le debounce et la mémorisation de isValid
const isValidMemoized = ref(true)
let validationTimeout = null

// Fonction de debounce pour la validation
const triggerValidation = () => {
    if (validationTimeout) {
        clearTimeout(validationTimeout)
    }

    validationTimeout = setTimeout(() => {
        isValidMemoized.value = isValid()
    }, 1)
}

const retrieveLetters = () => {
    // Parcourir le plateau pour récupérer les lettres non fixes
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            if (board.value[row][col] !== '' && !isFixed(row, col)) {
                // Ajouter la lettre au rack
                rackLetters.value.push(board.value[row][col]);
            }
        }
    }

    // Réinitialiser le plateau avec les valeurs de gameBoard
    if (gameBoard.value) {
        updateBoard(gameBoard.value);
    }

    // Réinitialiser le score du jeu
    playScore.value = 0;
};


const playScore = ref(0)

function isValid() {
    // Si toute les lettres sont sur la meme ligne sans trou
    playScore.value = 0
    let wordLine = isAligned()
    if (!(wordLine == false)) {
        console.log("mot possible")
        // Si le plateau est vierge
        if (gameBoard.value.every(cell => cell === '---------------')) {
            console.log("plateau vierge")
            /* calcul des points du mot */
            // Si l'une des lettres touche le centre
            if (wordLine.start.row == 7 && wordLine.end.row == 7 && wordLine.start.col <= 7 && wordLine.end.col >= 7) {
                // Verification si le mot existe au scrabble
                let word = board.value[7].slice(wordLine.start.col, wordLine.end.col + 1).join('');
                console.log(props.listeMots.includes(word.toLowerCase()), word.toLowerCase())
                checkMove(wordLine)
                return props.listeMots.includes(word.toLowerCase())
            }
        }
        else { // Sinon (si le plateau n'est pas vierge)
            console.log("plateau non vide")
            if (isTouchingFixedLetters(wordLine)) { // Si au moins une lettre de board touche une lettre fixed du gameBoard
                return checkMove(wordLine)
            }
        }
    }
    return false
}

function isTouchingFixedLetters(wordLine) {
    if (wordLine.start.row == wordLine.end.row) {
        // Mot horizontal
        if (wordLine.start.col > 0 && gameBoard.value[wordLine.start.row][wordLine.start.col - 1] != '-') {
            return true
        }
        for (let c = wordLine.start.col; c <= wordLine.end.col; c++) {
            if (gameBoard.value[wordLine.start.row][c] != '-') {
                return true
            }
            if (wordLine.start.row > 0 && gameBoard.value[wordLine.start.row - 1][c] != '-') {
                return true
            }
            if (wordLine.start.row < 14 && gameBoard.value[wordLine.start.row + 1][c] != '-') {
                return true
            }
        }
        if (wordLine.end.col < 14 && gameBoard.value[wordLine.end.row][wordLine.end.col + 1] != '-') {
            return true
        }
    }
    else {
        // Mot vertical
        if (wordLine.start.row > 0 && gameBoard.value[wordLine.start.row - 1][wordLine.start.col] != '-') {
            return true
        }
        for (let r = wordLine.start.row; r <= wordLine.end.row; r++) {
            if (gameBoard.value[r][wordLine.start.col] != '-') {
                return true
            }
            if (wordLine.start.col > 0 && gameBoard.value[r][wordLine.start.col - 1] != '-') {
                return true
            }
            if (wordLine.start.col < 14 && gameBoard.value[r][wordLine.start.col + 1] != '-') {
                return true
            }
        }
        if (wordLine.end.row < 14 && gameBoard.value[wordLine.end.row + 1][wordLine.end.col] != '-') {
            return true
        }
    }
    return false
}

function checkMove(wordLine) {
    var wordsAndValue = []
    var spineWord = ''
    var spineValue = 0
    var spineMulti = 1
    var head = { col: 0, row: 0 }
    console.log(wordLine);
    // Si le spineWord est horizontal
    if (wordLine.start.row == wordLine.end.row) {
        // ici le row est fixe, on itère sur le col

        // récupération de la lettre la plus à gauche du mot
        head.row = wordLine.start.row
        head.col = wordLine.start.col
        for (let c = wordLine.start.col; c >= 0; c--) {
            if (board.value[head.row][c] != "") {
                head.col = c
            }
            else {
                break
            }
        }
        console.log(head, board.value[head.row][head.col])

        // calcul du mot principal - on va jusqu'à la fin du mot complet
        let endCol = wordLine.end.col
        for (let c = wordLine.end.col + 1; c < 15; c++) {
            if (board.value[wordLine.start.row][c] != "") {
                endCol = c
            }
            else {
                break
            }
        }

        for (let c = head.col; c <= endCol; c++) {
            spineWord += board.value[wordLine.start.row][c]
            spineValue += letterToValue[board.value[wordLine.start.row][c]]

            // Si c'est une lettre déjà présente sur le plateau, on ne compte pas les multiplicateurs
            if (gameBoard.value[wordLine.start.row][c] != '-') {
                console.log('déjà présent, pas de multiplicateur');
            }
            else {
                // Application des multiplicateurs pour les nouvelles lettres
                if (boardCell[wordLine.start.row][c] != '') {
                    if (boardCell[wordLine.start.row][c] == 'L2') {
                        spineValue += letterToValue[board.value[wordLine.start.row][c]]
                    }
                    if (boardCell[wordLine.start.row][c] == 'L3') {
                        spineValue += letterToValue[board.value[wordLine.start.row][c]] * 2
                    }
                    if (boardCell[wordLine.start.row][c] == 'M2' || boardCell[wordLine.start.row][c] == '★') {
                        spineMulti *= 2
                    }
                    if (boardCell[wordLine.start.row][c] == 'M3') {
                        spineMulti *= 3
                    }
                }

                // Vérification des mots secondaires verticaux 
                if ((wordLine.start.row + 1 < 15 && board.value[wordLine.start.row + 1][c] != "") || (wordLine.start.row - 1 >= 0 && board.value[wordLine.start.row - 1][c] != "")) {
                    console.log('mot vertical secondaire à compter pour', board.value[wordLine.start.row][c]);
                    wordsAndValue.push(getSecondaryWordCol(wordLine.start.row, c))
                }
            }
        }
    }
    // Si le spineWord est vertical
    else {
        // ici le col est fixe, on itère sur le row

        // récupération de la lettre la plus en haut du mot
        head.col = wordLine.start.col
        head.row = wordLine.start.row
        for (let r = wordLine.start.row; r >= 0; r--) {
            if (board.value[r][head.col] != "") {
                head.row = r
            }
            else {
                break
            }
        }
        console.log(head, board.value[head.row][head.col])

        // calcul du mot principal - on va jusqu'à la fin du mot complet
        let endRow = wordLine.end.row
        for (let r = wordLine.end.row + 1; r < 15; r++) {
            if (board.value[r][wordLine.start.col] != "") {
                endRow = r
            }
            else {
                break
            }
        }

        for (let r = head.row; r <= endRow; r++) {
            spineWord += board.value[r][wordLine.start.col]
            spineValue += letterToValue[board.value[r][wordLine.start.col]]

            // Si c'est une lettre déjà présente sur le plateau, on ne compte pas les multiplicateurs
            if (gameBoard.value[r][wordLine.start.col] != '-') {
                console.log('lettre déjà présente, pas de multiplicateur');
            }
            else {
                // Application des multiplicateurs pour les nouvelles lettres
                if (boardCell[r][wordLine.start.col] != '') {
                    if (boardCell[r][wordLine.start.col] == 'L2') {
                        spineValue += letterToValue[board.value[r][wordLine.start.col]]
                    }
                    if (boardCell[r][wordLine.start.col] == 'L3') {
                        spineValue += letterToValue[board.value[r][wordLine.start.col]] * 2
                    }
                    if (boardCell[r][wordLine.start.col] == 'M2' || boardCell[r][wordLine.start.col] == '★') {
                        spineMulti *= 2
                    }
                    if (boardCell[r][wordLine.start.col] == 'M3') {
                        spineMulti *= 3
                    }
                }

                // Vérification des mots secondaires horizontaux
                if ((wordLine.start.col + 1 < 15 && board.value[r][wordLine.start.col + 1] != "") ||
                    (wordLine.start.col - 1 >= 0 && board.value[r][wordLine.start.col - 1] != "")) {
                    console.log('mot horizontal secondaire à compter pour', board.value[r][wordLine.start.col]);
                    wordsAndValue.push(getSecondaryWordRow(r, wordLine.start.col))
                }
            }
        }
    }

    console.log();
    console.log(spineWord);
    console.log(wordsAndValue)
    if (spineWord.length > 1) {
        wordsAndValue.push({ "value": spineValue * spineMulti, "isValid": props.listeMots.includes(spineWord.toLowerCase()) })
    }
    playScore.value = wordsAndValue.reduce((total, item) => total + item.value, 0)
    if(countPlacedLetters() == 7){
        playScore.value += 50
    }
    return wordsAndValue.every(item => item.isValid);
}

function getSecondaryWordCol(row, col) {
    // ici col est fixe, on itère sur le row 
    let secondHead = { row: row, col: col }
    var secondWord = ''
    var secondValue = 0
    var secondMulti = 1

    // Trouve le début du mot vertical
    for (let r = row; r >= 0; r--) {
        if (board.value[r][col] != "") {
            secondHead.row = r
        }
        else {
            break
        }
    }

    // Calcul du mot vertical secondaire
    for (let r = secondHead.row; r < 15; r++) {
        if (board.value[r][col] != "") {
            secondWord += board.value[r][col]
            secondValue += letterToValue[board.value[r][col]]

            // Multiplicateurs seulement pour les nouvelles lettres
            if (gameBoard.value[r][col] == "-") {
                if (boardCell[r][col] != '') {
                    if (boardCell[r][col] == 'L2') {
                        secondValue += letterToValue[board.value[r][col]]
                    }
                    if (boardCell[r][col] == 'L3') {
                        secondValue += letterToValue[board.value[r][col]] * 2
                    }
                    if (boardCell[r][col] == 'M2' || boardCell[r][col] == '★') {
                        secondMulti *= 2
                    }
                    if (boardCell[r][col] == 'M3') {
                        secondMulti *= 3
                    }
                }
            }
        }
        else {
            break
        }
    }
    return { "value": secondValue * secondMulti, "isValid": props.listeMots.includes(secondWord.toLowerCase()) }
}

function getSecondaryWordRow(row, col) {
    // ici row est fixe, on itère sur le col 
    let secondHead = { row: row, col: col }
    var secondWord = ''
    var secondValue = 0
    var secondMulti = 1

    // Trouve le début du mot horizontal
    for (let c = col; c >= 0; c--) {
        if (board.value[row][c] != "") {
            secondHead.col = c
        }
        else {
            break
        }
    }

    // Calcul du mot horizontal secondaire
    for (let c = secondHead.col; c < 15; c++) {
        if (board.value[row][c] != "") {
            secondWord += board.value[row][c]
            secondValue += letterToValue[board.value[row][c]]

            // Multiplicateurs seulement pour les nouvelles lettres
            if (gameBoard.value[row][c] == "-") {
                if (boardCell[row][c] != '') {
                    if (boardCell[row][c] == 'L2') {
                        secondValue += letterToValue[board.value[row][c]]
                    }
                    if (boardCell[row][c] == 'L3') {
                        secondValue += letterToValue[board.value[row][c]] * 2
                    }
                    if (boardCell[row][c] == 'M2' || boardCell[row][c] == '★') {
                        secondMulti *= 2
                    }
                    if (boardCell[row][c] == 'M3') {
                        secondMulti *= 3
                    }
                }
            }
        }
        else {
            break
        }
    }
    return { "value": secondValue * secondMulti, "isValid": props.listeMots.includes(secondWord.toLowerCase()) }
}

function isAligned() {
    let topLeftLetter = getTopLeftLetter()
    let wordLine = { start: topLeftLetter, end: null }
    let inX = false

    // Vérification horizontale d'abord
    for (let c = topLeftLetter.col + 1; c < 15; c++) {
        if (board.value[topLeftLetter.row][c] !== "") {
            wordLine.end = { row: topLeftLetter.row, col: c }
            if (gameBoard.value[topLeftLetter.row][c] === "-") {
                inX = true
            }
        }
        else {
            break
        }
    }

    // Si pas de mot horizontal, vérification verticale
    if (!inX) {
        for (let r = topLeftLetter.row + 1; r < 15; r++) {
            if (board.value[r][topLeftLetter.col] !== "") {
                wordLine.end = { row: r, col: topLeftLetter.col }
            }
            else {
                break
            }
        }
    }

    if (wordLine.end == null) {
        wordLine.end = wordLine.start
    }

    // Vérification que toutes les nouvelles lettres sont alignées
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (board.value[r][c] !== "" && gameBoard.value[r][c] === "-" &&
                !(r >= wordLine.start.row && r <= wordLine.end.row && c >= wordLine.start.col && c <= wordLine.end.col)) {
                return false
            }
        }
    }
    return wordLine
}

function getTopLeftLetter() {
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if (board.value[r][c] !== "" && gameBoard.value[r][c] === "-") {
                return { row: r, col: c }
            }
        }
    }
    return null
}

const isFixed = (row, col) => {
    const letter = board.value[row][col]
    return letter && gameBoard.value && gameBoard.value[row] && gameBoard.value[row][col] === letter
}

</script>