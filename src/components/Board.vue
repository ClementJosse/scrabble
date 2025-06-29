<template>
    <div class="flex flex-col items-center gap-6 p-4">
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
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'L3'" class="text-strongblue text-lg">L3</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'M2'" class="text-red text-lg">M2</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === 'L2'" class="text-blue text-lg">L2</span>
                            <span v-else-if="boardCell[rowIndex][colIndex] === '★'" class="text-red text-xl">★</span>
                        </div>

                        <!-- Zone draggable par-dessus -->
                        <Draggable :list="board[rowIndex][colIndex]" group="letters"
                            class="absolute inset-0 flex items-center justify-center h-12 w-12" itemKey="id"
                            :clone="cloneLetter" :sort="false">
                            <template #item="{ element }">
                                <div
                                    class="h-12 w-12 select-none flex items-center justify-center bg-white border-2 border-gray-300 transition-all duration-200 cursor-grab hover:border-blue-600 hover:opacity-90 active:cursor-grabbing active:opacity-60 relative z-10 font-bold">
                                    {{ element.letter }}
                                </div>
                            </template>
                        </Draggable>
                    </div>
                </template>
            </template>
        </div>

        <!-- Rack des lettres - 7 cellules fixes -->
        <div class="flex gap-2 bg-amber-100 p-5 rounded-lg">
            <template v-for="(slot, index) in rackSlots" :key="'rack-' + index">
                <Draggable :list="slot" group="letters" itemKey="id" :clone="cloneLetter"
                    class="h-12 w-12 flex items-center justify-center border-2 border-gray-300 bg-white"
                    :class="{ 'opacity-50': slot.length === 0 }" @change="onRackChange">
                    <template #item="{ element }">
                        <div
                            class="h-12 w-12 select-none flex items-center justify-center bg-white transition-all duration-200 cursor-grab hover:border-blue-600 hover:opacity-90 active:cursor-grabbing active:opacity-60 font-bold">
                            {{ element.letter }}
                        </div>
                    </template>
                    <template #default>
                        <div v-if="slot.length === 0" class="h-12 w-12 flex items-center justify-center text-gray-400">
                            _
                        </div>
                    </template>
                </Draggable>
            </template>
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