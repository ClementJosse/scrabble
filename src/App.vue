<template>
  <header class="">
    <div>
      <router-link to="/" class="fixed top-4 left-4 z-50">
        <div class="flex items-center space-x-2 ">
          <img src="@/assets/logo.svg" alt="Logo de scrabble" />
          <span class="text-secondary font-bold text-3xl">Scrabble</span>
        </div>
      </router-link>
    </div>
  </header>
  <router-view />
</template>

<script setup>

</script>
