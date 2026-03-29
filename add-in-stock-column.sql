-- Ajouter la colonne in_stock à la table boutique_products
-- Par défaut, tous les produits sont en stock (true)
ALTER TABLE boutique_products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
