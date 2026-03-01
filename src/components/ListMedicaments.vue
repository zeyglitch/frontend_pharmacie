<script setup>
import { ref, computed, onMounted } from 'vue'
import Medicament from '../Medicament.js'
import MedicamentCarte from './Medicament.vue'
import MedicamentForm from './MedicamentForm.vue'

const URL_API = 'https://apipharmacie.pecatte.fr/medicaments'

// État principal
const listeMedicaments = ref([])
const chargement = ref(true)
const erreur = ref('')
const recherche = ref('')

// Filtre par catégorie
const listeCategories = ref([])
const categorieSelectionnee = ref('')

// Contrôle du formulaire
const formulaireVisible = ref(false)
const medicamentAModifier = ref(null)

// Liste filtrée par la recherche et par catégorie
const medicamentsFiltres = computed(() => {
  let resultats = listeMedicaments.value

  // Filtre par nom
  const terme = recherche.value.toLowerCase().trim()
  if (terme) {
    resultats = resultats.filter(m =>
      m.nom.toLowerCase().includes(terme)
    )
  }

  // Filtre par catégorie
  if (categorieSelectionnee.value) {
    resultats = resultats.filter(m =>
      m.categorie && m.categorie.id == categorieSelectionnee.value
    )
  }

  return resultats
})

// Récupérer les catégories pour le menu déroulant
function chargerCategories() {
  fetch('https://apipharmacie.pecatte.fr/categories')
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur chargement catégories')
      return reponse.json()
    })
    .then(donnees => {
      listeCategories.value = donnees
    })
    .catch(() => {
      listeCategories.value = []
    })
}

// Récupérer tous les médicaments depuis l'API
function chargerMedicaments() {
  chargement.value = true
  erreur.value = ''

  fetch(URL_API)
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur lors du chargement')
      return reponse.json()
    })
    .then(donnees => {
      listeMedicaments.value = donnees.map(d => new Medicament(d))
    })
    .catch(err => {
      erreur.value = err.message
    })
    .finally(() => {
      chargement.value = false
    })
}

// Supprimer un médicament
function supprimerMedicament(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce médicament ?')) return

  fetch(`${URL_API}/${id}`, { method: 'DELETE' })
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur lors de la suppression')
      // On retire le médicament de la liste locale
      listeMedicaments.value = listeMedicaments.value.filter(m => m.id !== id)
    })
    .catch(err => {
      alert('Erreur : ' + err.message)
    })
}

// Modifier la quantité (+1 ou -1)
function modifierQuantite(medicament, delta) {
  const nouvelleQuantite = medicament.quantite + delta
  if (nouvelleQuantite < 0) return

  const body = { ...medicament, quantite: nouvelleQuantite }
  // On envoie la catégorie sous forme d'objet si elle existe
  if (medicament.categorie) {
    body.categorie = { id: medicament.categorie.id, nom: medicament.categorie.nom }
  }

  fetch(`${URL_API}/${medicament.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur lors de la mise à jour')
      return reponse.json()
    })
    .then(donnees => {
      // Mettre à jour dans la liste locale
      const index = listeMedicaments.value.findIndex(m => m.id === medicament.id)
      if (index !== -1) {
        listeMedicaments.value[index] = new Medicament(donnees)
      }
    })
    .catch(err => {
      alert('Erreur : ' + err.message)
    })
}

// Ouvrir le formulaire pour ajouter
function ouvrirFormulaireAjout() {
  medicamentAModifier.value = null
  formulaireVisible.value = true
}

// Ouvrir le formulaire pour modifier
function ouvrirFormulaireModification(medicament) {
  medicamentAModifier.value = { ...medicament }
  if (medicament.categorie) {
    medicamentAModifier.value.categorie = { ...medicament.categorie }
  }
  formulaireVisible.value = true
}

// Fermer le formulaire
function fermerFormulaire() {
  formulaireVisible.value = false
  medicamentAModifier.value = null
}

// Quand le formulaire sauvegarde (ajout ou modification)
function onSauvegarde(medicamentSauvegarde) {
  const index = listeMedicaments.value.findIndex(m => m.id === medicamentSauvegarde.id)
  if (index !== -1) {
    // Modification : on remplace dans la liste
    listeMedicaments.value[index] = new Medicament(medicamentSauvegarde)
  } else {
    // Ajout : on l'ajoute à la liste
    listeMedicaments.value.push(new Medicament(medicamentSauvegarde))
  }
  fermerFormulaire()
}

onMounted(() => {
  chargerMedicaments()
  chargerCategories()
})
</script>

<template>
  <div>
    <!-- Barre de recherche + filtre par catégorie -->
    <div class="barre-recherche">
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher un médicament par nom..."
      />
      <select v-model="categorieSelectionnee">
        <option value="">Toutes les catégories</option>
        <option
          v-for="categorie in listeCategories"
          :key="categorie.id"
          :value="categorie.id"
        >
          {{ categorie.nom }}
        </option>
      </select>
    </div>

    <!-- Bouton ajouter -->
    <div class="section-actions">
      <button class="btn btn-primary" @click="ouvrirFormulaireAjout">
        + Ajouter un médicament
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="chargement" class="message-chargement">
      Chargement des médicaments...
    </div>

    <!-- Erreur -->
    <div v-else-if="erreur" class="message-erreur">
      {{ erreur }}
    </div>

    <!-- Liste vide -->
    <div v-else-if="medicamentsFiltres.length === 0" class="message-vide">
      Aucun médicament trouvé.
    </div>

    <!-- Grille des médicaments -->
    <div v-else class="grille-medicaments">
      <MedicamentCarte
        v-for="medicament in medicamentsFiltres"
        :key="medicament.id"
        :medicament="medicament"
        @supprimer="supprimerMedicament"
        @modifier-quantite="modifierQuantite"
        @modifier="ouvrirFormulaireModification"
      />
    </div>

    <!-- Formulaire (modale) -->
    <MedicamentForm
      v-if="formulaireVisible"
      :medicament="medicamentAModifier"
      @sauvegarder="onSauvegarde"
      @annuler="fermerFormulaire"
    />
  </div>
</template>
