<script setup>
const props = defineProps({
  medicament: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['supprimer', 'modifierQuantite', 'modifier'])
</script>

<template>
  <div class="carte-medicament">
    <h3>{{ medicament.nom }}</h3>

    <!-- Photo du médicament (image par défaut si aucune URL) -->
    <img
      :src="medicament.imageURL || 'https://cdn-icons-png.flaticon.com/512/2927/2927347.png'"
      :alt="medicament.nom"
      class="image-medicament"
    />

    <div class="info">
      <p><span>Conditionnement :</span> {{ medicament.quantiteParUnite || 'Non renseigné' }}</p>
      <p><span>Prix :</span> {{ medicament.prixUnitaire }} €</p>
    </div>

    <div v-if="medicament.categorie" class="info">
      <span class="categorie-badge">{{ medicament.categorie.libelle }}</span>
    </div>

    <!-- Gestion du stock -->
    <div class="quantite-section">
      <button class="btn btn-danger btn-small" @click="emit('modifierQuantite', medicament, -1)">
        -1
      </button>
      <span
        class="quantite-valeur"
        :class="medicament.estEnRupture() ? 'stock-bas' : 'stock-ok'"
      >
        {{ medicament.unitesEnStock }}
      </span>
      <button class="btn btn-success btn-small" @click="emit('modifierQuantite', medicament, +1)">
        +1
      </button>
    </div>

    <!-- Boutons d'action -->
    <div class="actions-carte">
      <button class="btn btn-primary btn-small" @click="emit('modifier', medicament)">
        ✏️ Modifier
      </button>
      <button class="btn btn-danger btn-small" @click="emit('supprimer', medicament.id)">
        🗑️ Supprimer
      </button>
    </div>
  </div>
</template>
