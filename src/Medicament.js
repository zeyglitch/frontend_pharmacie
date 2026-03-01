export default class Medicament {
    constructor(data = {}) {
        this.reference = data.reference || null
        this.nom = data.nom || ''
        this.quantiteParUnite = data.quantiteParUnite || ''
        this.prixUnitaire = data.prixUnitaire || 0
        this.unitesEnStock = data.unitesEnStock || 0
        this.unitesCommandees = data.unitesCommandees || 0
        this.niveauDeReappro = data.niveauDeReappro || 5
        this.indisponible = data.indisponible || false
        this.imageURL = data.imageURL || data.urlImage || ''

        // On récupère l'id depuis l'URL HAL (_links.self.href)
        if (data._links && data._links.self) {
            this.id = parseInt(data._links.self.href.split('/').pop())
        } else {
            this.id = data.reference || null
        }

        // Lien vers la catégorie (sera chargé séparément)
        this.categorie = data.categorie || null
        if (data._links && data._links.categorie) {
            this.lienCategorie = data._links.categorie.href
        }
    }

    estEnRupture() {
        return this.unitesEnStock <= this.niveauDeReappro
    }
}
