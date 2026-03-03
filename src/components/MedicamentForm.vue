<script setup>
import { ref, onMounted } from 'vue'

const URL_API = 'https://backend-pharmacie-7fa7.onrender.com/api/medicaments'

const props = defineProps({
  medicament: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['sauvegarder', 'annuler'])

const estModification = ref(false)


const nom = ref('')
const quantiteParUnite = ref('')
const prixUnitaire = ref(0)
const unitesEnStock = ref(0)
const niveauDeReappro = ref(5)
const imageURL = ref('')
const categorieCode = ref('')


const listeCategories = ref([])

// Pré-remplissage si modification
onMounted(() => {
  chargerCategories()

  if (props.medicament) {
    estModification.value = true
    nom.value = props.medicament.nom
    quantiteParUnite.value = props.medicament.quantiteParUnite || ''
    prixUnitaire.value = props.medicament.prixUnitaire
    unitesEnStock.value = props.medicament.unitesEnStock
    niveauDeReappro.value = props.medicament.niveauDeReappro
    imageURL.value = props.medicament.imageURL || ''
    if (props.medicament.categorie) {
      categorieCode.value = props.medicament.categorie.code
    }
  }
})


function chargerCategories() {
  fetch('https://backend-pharmacie-7fa7.onrender.com/api/categories')
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur chargement catégories')
      return reponse.json()
    })
    .then(donnees => {
      listeCategories.value = donnees._embedded ? donnees._embedded.categories : []
    })
    .catch(err => {
      console.log(err)
      listeCategories.value = []
    })
}

function soumettre() {

  if (!nom.value.trim()) {
    alert('Le nom est obligatoire.')
    return
  }

  if (!categorieCode.value) {
    alert('La catégorie est obligatoire.')
    return
  }

  // Spring Data REST attend l'URI de la catégorie pour l'association
  const donnees = {
    nom: nom.value.trim(),
    quantiteParUnite: quantiteParUnite.value.trim(),
    prixUnitaire: parseFloat(prixUnitaire.value),
    unitesEnStock: parseInt(unitesEnStock.value),
    niveauDeReappro: parseInt(niveauDeReappro.value),
    indisponible: false,
    imageURL: imageURL.value.trim(),
    categorie: `https://backend-pharmacie-7fa7.onrender.com/api/categories/${categorieCode.value}`
  }

  if (estModification.value) {
    // PUT pour modifier
    fetch(`${URL_API}/${props.medicament.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
      .then(reponse => {
        if (!reponse.ok) throw new Error('Erreur lors de la modification')
        return reponse.json()
      })
      .then(resultat => {
        emit('sauvegarder', resultat)
      })
      .catch(err => {
        alert('Erreur : ' + err.message)
      })
  } else {
    // POST pour ajouter (reference est auto-générée par la BD, pas besoin de l'envoyer)
    fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
      .then(reponse => {
        if (!reponse.ok) throw new Error("Erreur lors de l'ajout")
        return reponse.json()
      })
      .then(resultat => {
        emit('sauvegarder', resultat)
      })
      .catch(err => {
        alert('Erreur : ' + err.message)
      })
  }
}
</script>

<template>
  <div class="formulaire-overlay" @click.self="emit('annuler')">
    <div class="formulaire-container">
      <h2>{{ estModification ? 'Modifier un médicament' : 'Ajouter un médicament' }}</h2>

      <form @submit.prevent="soumettre">
        <div class="champ-formulaire">
          <label for="nom">Nom</label>
          <input id="nom" v-model="nom" type="text" placeholder="Nom du médicament" required />
        </div>

        <div class="champ-formulaire">
          <label for="quantiteParUnite">Conditionnement</label>
          <input id="quantiteParUnite" v-model="quantiteParUnite" type="text" placeholder="Ex: Boîte de 12 comprimés" />
        </div>

        <div class="champ-formulaire">
          <label for="prixUnitaire">Prix unitaire (€)</label>
          <input id="prixUnitaire" v-model.number="prixUnitaire" type="number" step="0.01" min="0" />
        </div>

        <div class="champ-formulaire">
          <label for="unitesEnStock">Unités en stock</label>
          <input id="unitesEnStock" v-model.number="unitesEnStock" type="number" min="0" />
        </div>

        <div class="champ-formulaire">
          <label for="niveauDeReappro">Seuil de réapprovisionnement</label>
          <input id="niveauDeReappro" v-model.number="niveauDeReappro" type="number" min="0" />
        </div>

        <div class="champ-formulaire">
          <label for="categorie">Catégorie</label>
          <select id="categorie" v-model="categorieCode">
            <option value="">-- Aucune catégorie --</option>
            <option
              v-for="categorie in listeCategories"
              :key="categorie.code"
              :value="categorie.code"
            >
              {{ categorie.libelle }}
            </option>
          </select>
        </div>

        <div class="champ-formulaire">
          <label for="imageURL">URL de la photo</label>
          <input id="imageURL" v-model="imageURL" type="text" placeholder="https://exemple.com/photo.jpg" />
        </div>

        <div class="boutons-formulaire">
          <button type="button" class="btn btn-secondary" @click="emit('annuler')">
            Annuler
          </button>
          <button type="submit" class="btn btn-success">
            {{ estModification ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
