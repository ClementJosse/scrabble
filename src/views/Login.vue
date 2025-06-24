<template>
    <div class="mt-[350px] px-4 py-3 rounded-lg border border-2 border-secondary bg-base1 text-xl mx-auto w-fit">
        <div class="flex items-center ">
            <input v-model="nom" type="text" placeholder="Entrez votre nom..."
                class="w-[250px] text-primary inter-bold text-2xl text-bold bg-transparent border-none outline-none placeholder-base3 placeholder-opacity-100 placeholder:font-medium" />
            <img @click="login()" v-if="nom" src="@/assets/login.svg" class="cursor-pointer w-10 h-8" />
            <div v-else class="w-10 h-8"> </div>
        </div>
    </div>
    
</template>

<script>
export default {
  data() {
    return {
      nom: ""
    };
  }
};

login()
</script>
