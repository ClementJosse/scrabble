<template>
    <div class="flex flex-col items-center gap-6 p-4 mb-[140px]">
        <!-- Plateau de jeu -->
        <div class="grid grid-cols-[repeat(15,3rem)] p-3 bg-base2 rounded-xl shadow-base3 shadow-md">
            <template v-for="(row, rowIndex) in 15" :key="'row-' + rowIndex">
                <template v-for="(col, colIndex) in 15" :key="'cell-' + rowIndex + '-' + colIndex">
                    <div
                        :class="['h-12 w-12 border flex items-center justify-center relative', getCellClass(boardCell[rowIndex][colIndex])]">
                        <!-- Texte de la cellule toujours visible -->
                        <div v-if="boardCell[rowIndex][colIndex] !== ''"
                            class="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none">
                            <span v-if="boardCell[rowIndex][colIndex] === 'M3'" class="text-strongred text-lg">M3</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'L3'"
                                class="text-strongblue text-lg">L3</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'M2'" class="text-red text-lg">M2</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'L2'" class="text-blue text-lg">L2</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === '★'" class="text-red text-xl">★</span>
                        </div>

                        <!-- Zone draggable par-dessus -->
                        <Draggable :list="board[rowIndex][colIndex]" group="letters"
                            class="flex items-center justify-center h-12 w-12" itemKey="id" :clone="cloneLetter"
                            :sort="false">
                            <template #item="{ element }">
                                <div
                                    class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary text-xl">
                                    {{ element.letter }}
                                </div>
                            </template>
                        </Draggable>
                    </div>
                </template>
            </template>
        </div>

        <!-- Rack des lettres - 7 cellules fixes -->
        <div
            class="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-row bg-base2 p-5 w-[745px] h-[115px] justify-between items-center rounded-xl shadow-base3 shadow-md">
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
                <div class="flex flex-row gap-1 bg-base1 p-3 pb-6 mt-1 rounded-lg w-fit">
                    <template v-for="(slot, index) in rackSlots" :key="'rack-' + index">
                        <Draggable :list="slot" group="letters" itemKey="id" :clone="cloneLetter"
                            class="h-11 w-11 flex items-center justify-center bg-base2 rounded-lg">
                            <template #item="{ element }">
                                <div
                                    class="h-11 w-11 rounded-lg select-none flex items-center justify-center bg-base2 border-secondary border-2 cursor-grab active:cursor-grabbing relative z-10 font-bold text-xl text-primary text-xl">
                                    {{ element.letter }}
                                </div>
                            </template>
                        </Draggable>
                    </template>
                </div>
                <span class="relative h-2 w-full bg-secondary -top-[8px]"></span>
                <img src="@/assets/shuffle.svg" alt="retrieve letters" class="cursor-pointer relative -top-7 h-8"
                    @click="retrieveLetters()" />
            </div>
            <div class="w-[150px] flex flex-col justify-center items-center gap-2">
                <span class="text-2xl text-strongblue font-bold">51pts</span>
                <button class="px-6 py-[5px] bg-lightblue border-2 border-strongblue text-strongblue font-semibold rounded-lg text-sm">Jouer le coup</button>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Draggable from 'vuedraggable'

// Plateau de 15x15, chaque cellule contient une liste (même vide) pour SortableJS
const board = ref(
    Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => [])
    )
)

const boardCell = [
    ['M3', '', '', 'L2', '', '', '', 'M3', '', '', '', 'L2', '', '', 'M3',],
    ['', 'M2', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'M2', '',],
    ['', '', 'M2', '', '', '', 'L2', '', 'L2', '', '', '', 'M2', '', '',],
    ['L2', '', '', 'M2', '', '', '', 'L2', '', '', '', 'M2', '', '', 'L2',],
    ['', '', '', '', 'M2', '', '', '', '', '', 'M2', '', '', '', '',],
    ['', 'L3', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'L3', '',],
    ['', '', 'L2', '', '', '', 'L2', '', 'L2', '', '', '', 'L2', '', '',],
    ['M3', '', '', 'L2', '', '', '', '★', '', '', '', 'L2', '', '', 'M3',],
    ['', '', 'L2', '', '', '', 'L2', '', 'L2', '', '', '', 'L2', '', '',],
    ['', 'L3', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'L3', '',],
    ['', '', '', '', 'M2', '', '', '', '', '', 'M2', '', '', '', '',],
    ['L2', '', '', 'M2', '', '', '', 'L2', '', '', '', 'M2', '', '', 'L2',],
    ['', '', 'M2', '', '', '', 'L2', '', 'L2', '', '', '', 'M2', '', '',],
    ['', 'M2', '', '', '', 'L3', '', '', '', 'L3', '', '', '', 'M2', '',],
    ['M3', '', '', 'L2', '', '', '', 'M3', '', '', '', 'L2', '', '', 'M3',],
]

const letterToValue = {
    A: 1, B: 3, C: 3, D: 2, E: 1,
    F: 4, G: 2, H: 4, I: 1, J: 8,
    K: 10, L: 1, M: 2, N: 1, O: 1,
    P: 3, Q: 8, R: 1, S: 1, T: 1,
    U: 1, V: 4, W: 10, X: 10, Y: 10, Z: 10
};

// Rack avec 7 emplacements fixes
const rackSlots = ref([
    [{ id: 1, letter: 'A' }],  // Slot 0
    [{ id: 2, letter: 'B' }],  // Slot 1
    [{ id: 3, letter: 'C' }],  // Slot 2
    [{ id: 4, letter: 'D' }],  // Slot 3
    [{ id: 5, letter: 'E' }],  // Slot 4
    [],                        // Slot 5 (vide)
    []                         // Slot 6 (vide)
])

// Fonction pour cloner les lettres en drag
const cloneLetter = (original) => {
    return original ? { ...original } : null
}

function getCellClass(cell) {
    // Retourne une classe CSS en fonction du contenu de la cellule
    switch (cell) {
        case 'M3': return 'bg-red border-strongred';
        case 'L3': return 'bg-blue border-strongblue';
        case 'M2': return 'bg-lightred border-red';
        case 'L2': return 'bg-lightblue border-blue';
        case '★': return 'bg-lightred border-red';
        default: return 'bg-base1 border-base2';
    }
}

// Fonction appelée lors des changements dans le rack
const onRackChange = (event) => {
    // Optionnel : logique supplémentaire lors des changements
    console.log('Rack modifié:', rackSlots.value)
}

// Computed pour obtenir toutes les lettres du rack (utile pour d'autres opérations)
const rackLetters = computed(() => {
    return rackSlots.value.flat().filter(letter => letter !== null)
})
</script>