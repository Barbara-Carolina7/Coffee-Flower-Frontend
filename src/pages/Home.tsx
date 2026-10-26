
import React from "react";

type HomeProps = {
  onViewProducts: () => void;
  onViewCategories: () => void;
  onSelectCategory: (categoria: string) => void;
};

export default function Home({
  onViewProducts,
  onViewCategories,
  onSelectCategory,
}: HomeProps) {
  return (
    <main className="home-page">
      {/* PORTADA PRINCIPAL */}
      <section className="hero" id="inicio">
        <div className="hero-copy">
          <span className="eyebrow">
            ☕ Bienvenido a Coffee Flower 🌸
          </span>

          <h1>
            El sabor que
            <br />
            <span>florece</span> en cada
            <br />
            taza
          </h1>

          <p>
            Descubre nuestros cafés y productos de pastelería,
            preparados especialmente para acompañar tus mejores momentos.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="button button-dark"
              onClick={onViewProducts}
            >
              Ver productos
            </button>

            <button
              type="button"
              className="button button-outline"
              onClick={onViewCategories}
            >
              Ver categorías
            </button>
          </div>
        </div>

        <div className="hero-visual" aria-label="Café con flores">
          <div className="hero-circle">
            <span className="hero-cup" aria-hidden="true">
              ☕
            </span>
          </div>

          <span className="flower flower-one" aria-hidden="true">
            🌸
          </span>

          <span className="flower flower-two" aria-hidden="true">
            🌷
          </span>
        </div>
      </section>

      {/* CATEGORÍAS DESTACADAS */}
      <section className="featured-section" id="categorias">
        <div className="section-heading">
          <span className="eyebrow">NUESTROS FAVORITOS</span>
          <h2>Productos destacados</h2>
          <p>
            Descubre algo delicioso para acompañar tu día.
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

            <h3>Cafés</h3>

            <p>
              Cafés preparados con granos seleccionados
              para disfrutar cada momento.
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

            <h3>Pastelería</h3>

            <p>
              Deliciosos acompañamientos para disfrutar
              junto a tu café favorito.
            </p>

            <span className="featured-link">
              Ver pastelería →
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
