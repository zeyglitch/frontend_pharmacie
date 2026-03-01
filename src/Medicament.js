export default class Medicament {
    constructor(data = {}) {
        this.id = data.id || null
        this.nom = data.nom || ''
        this.description = data.description || ''
        this.prix = data.prix || 0
        this.quantite = data.quantite || 0
        this.categorie = data.categorie || null
        this.seuilReapprovisionnement = data.seuilReapprovisionnement || 5
        this.imageUrl = data.imageUrl || ''
    }

    // Vérifie si le stock est bas (en dessous du seuil)
    estEnRupture() {
        return this.quantite <= this.seuilReapprovisionnement
    }
}
