
import React from "react";

type CategoriasProps = {
  onSelectCategory: (categoria: string) => void;
};

export default function Categorias({
  onSelectCategory,
}: CategoriasProps) {
  return (
    <main className="categories-page" id="categorias">
      <section className="featured-section">
        <div className="section-heading">
          <span className="eyebrow">COFFEE FLOWER</span>
          <h1>Nuestras categorías</h1>
          <p>
            Encuentra tu café favorito o disfruta algo dulce
            para acompañar tu momento.
          </p>
        </div>

        <div className="featured-grid">
          <button
            type="button"
            className="featured-card"
            onClick={() => onSelectCategory("Café")}
          >
            <span className="featured-icon" aria-hidden="true">
              ☕
            </span>

            <h2>Cafés</h2>

            <p>
              Espresso, cappuccino y deliciosas preparaciones
              para disfrutar cada día.
            </p>

            <span className="featured-link">
              Ver cafés →
            </span>
          </button>

          <button
            type="button"
            className="featured-card"
            onClick={() => onSelectCategory("Pastelería")}
          >
            <span className="featured-icon" aria-hidden="true">
              🍰
            </span>

            <h2>Pastelería</h2>

            <p>
              Croissants, tortas y dulces preparados para
              acompañar tu café.
            </p>

            <span className="featured-link">
              Ver pastelería →
            </span>
          </button>
        </div>

        <div className="categories-note">
          <span aria-hidden="true">🌸</span>
          <p>
            El sabor que florece en cada taza.
          </p>
        </div>
      </section>
    </main>
  );
}
