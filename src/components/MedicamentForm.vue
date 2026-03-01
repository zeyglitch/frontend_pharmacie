<script setup>
import { ref, onMounted } from 'vue'

const URL_API = 'https://apipharmacie.pecatte.fr/medicaments'

const props = defineProps({
  medicament: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['sauvegarder', 'annuler'])

const estModification = ref(false)

// Champs du formulaire
const nom = ref('')
const description = ref('')
const prix = ref(0)
const quantite = ref(0)
const imageUrl = ref('')
const categorieId = ref('')
const categorieNom = ref('')

// Liste des catégories pour le select
const listeCategories = ref([])
const chargementCategories = ref(false)

// Si on reçoit un médicament en prop, on pré-remplit le formulaire
onMounted(() => {
  chargerCategories()

  if (props.medicament) {
    estModification.value = true
    nom.value = props.medicament.nom
    description.value = props.medicament.description || ''
    prix.value = props.medicament.prix
    quantite.value = props.medicament.quantite
    imageUrl.value = props.medicament.imageUrl || ''
    if (props.medicament.categorie) {
      categorieId.value = props.medicament.categorie.id
      categorieNom.value = props.medicament.categorie.nom
    }
  }
})

// Charger les catégories depuis l'API
function chargerCategories() {
  chargementCategories.value = true
  fetch('https://apipharmacie.pecatte.fr/categories')
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur chargement catégories')
      return reponse.json()
    })
    .then(donnees => {
      listeCategories.value = donnees
    })
    .catch(() => {
      // Si l'endpoint catégories n'existe pas, on laisse vide
      listeCategories.value = []
    })
    .finally(() => {
      chargementCategories.value = false
    })
}

function soumettre() {
  // Construction de l'objet à envoyer
  const donnees = {
    nom: nom.value.trim(),
    description: description.value.trim(),
    prix: parseFloat(prix.value),
    quantite: parseInt(quantite.value),
    imageUrl: imageUrl.value.trim()
  }

  // Ajout de la catégorie si sélectionnée
  if (categorieId.value) {
    const categorieTrouvee = listeCategories.value.find(c => c.id == categorieId.value)
    if (categorieTrouvee) {
      donnees.categorie = { id: categorieTrouvee.id, nom: categorieTrouvee.nom }
    }
  }

  // Validation basique
  if (!donnees.nom) {
    alert('Le nom est obligatoire.')
    return
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
    // POST pour ajouter
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
          <label for="description">Description</label>
          <textarea id="description" v-model="description" placeholder="Description..."></textarea>
        </div>

        <div class="champ-formulaire">
          <label for="prix">Prix (€)</label>
          <input id="prix" v-model.number="prix" type="number" step="0.01" min="0" />
        </div>

        <div class="champ-formulaire">
          <label for="quantite">Quantité en stock</label>
          <input id="quantite" v-model.number="quantite" type="number" min="0" />
        </div>

        <div class="champ-formulaire">
          <label for="categorie">Catégorie</label>
          <select id="categorie" v-model="categorieId">
            <option value="">-- Aucune catégorie --</option>
            <option
              v-for="categorie in listeCategories"
              :key="categorie.id"
              :value="categorie.id"
            >
              {{ categorie.nom }}
            </option>
          </select>
        </div>

        <div class="champ-formulaire">
          <label for="imageUrl">URL de la photo</label>
          <input id="imageUrl" v-model="imageUrl" type="text" placeholder="https://exemple.com/photo.jpg" />
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
