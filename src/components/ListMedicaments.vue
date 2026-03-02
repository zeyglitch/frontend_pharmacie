<script setup>
import { ref, computed, onMounted } from 'vue'
import Medicament from '../Medicament.js'
import MedicamentCarte from './Medicament.vue'
import MedicamentForm from './MedicamentForm.vue'

const URL_API = 'https://backend-pharmacie-7fa7.onrender.com/api/medicaments'

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
      m.categorie && m.categorie.code == categorieSelectionnee.value
    )
  }

  return resultats
})

// Récupérer les catégories pour le menu déroulant
function chargerCategories() {
  fetch('https://backend-pharmacie-7fa7.onrender.com/api/categories')
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur chargement catégories')
      return reponse.json()
    })
    .then(donnees => {
      // Format Spring Data REST : données dans _embedded.categories
      listeCategories.value = donnees._embedded ? donnees._embedded.categories : []
    })
    .catch(() => {
      listeCategories.value = []
    })
}

// Récupérer tous les médicaments depuis l'API
function chargerMedicaments() {
  chargement.value = true
  erreur.value = ''

  fetch(`${URL_API}?size=1000`)
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur lors du chargement')
      return reponse.json()
    })
    .then(donnees => {
      // Spring Data REST : les données sont dans _embedded.medicaments
      const liste = donnees._embedded ? donnees._embedded.medicaments : []
      listeMedicaments.value = liste.map(d => new Medicament(d))

      // Pour chaque médicament, on charge sa catégorie
      listeMedicaments.value.forEach(m => {
        if (m.lienCategorie) {
          chargerCategorieMedicament(m)
        }
      })
    })
    .catch(err => {
      erreur.value = err.message
    })
    .finally(() => {
      chargement.value = false
    })
}

// Charger la catégorie d'un médicament via son lien HAL
function chargerCategorieMedicament(medicament) {
  fetch(medicament.lienCategorie)
    .then(reponse => reponse.json())
    .then(categorie => {
      medicament.categorie = categorie
    })
    .catch(() => {
      // Pas grave si la catégorie ne charge pas
    })
}

// Supprimer un médicament
function supprimerMedicament(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce médicament ?')) return

  fetch(`${URL_API}/${id}`, { method: 'DELETE' })
    .then(reponse => {
      if (!reponse.ok) throw new Error('Erreur lors de la suppression')
      listeMedicaments.value = listeMedicaments.value.filter(m => m.id !== id)
    })
    .catch(err => {
      alert('Erreur : ' + err.message)
    })
}

// Modifier la quantité (+1 ou -1)
function modifierQuantite(medicament, delta) {
  const nouvelleQuantite = medicament.unitesEnStock + delta
  if (nouvelleQuantite < 0) return

  const body = {
    nom: medicament.nom,
    quantiteParUnite: medicament.quantiteParUnite,
    prixUnitaire: medicament.prixUnitaire,
    unitesEnStock: nouvelleQuantite,
    unitesCommandees: medicament.unitesCommandees,
    niveauDeReappro: medicament.niveauDeReappro,
    indisponible: medicament.indisponible,
    imageURL: medicament.imageURL
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
      const index = listeMedicaments.value.findIndex(m => m.id === medicament.id)
      if (index !== -1) {
        const ancienneCategorie = listeMedicaments.value[index].categorie
        listeMedicaments.value[index] = new Medicament(donnees)
        listeMedicaments.value[index].categorie = ancienneCategorie
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

// Quand le formulaire sauvegarde (ajout ou modification), on recharge toute la liste
function onSauvegarde() {
  fermerFormulaire()
  chargerMedicaments()
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
          :key="categorie.code"
          :value="categorie.code"
        >
          {{ categorie.libelle }}
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
