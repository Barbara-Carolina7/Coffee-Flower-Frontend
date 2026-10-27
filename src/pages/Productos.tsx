import React from "react";

export type Product = {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria?: string | null;
  emoji?: string | null;
};

type ProductosProps = {
  products: Product[];
  category: string;
  onSelectCategory: (categoria: string) => void;
  onAddToCart: (id: string | number) => void;
  loading?: boolean;
};

export default function Productos({
  products,
  category,
  onSelectCategory,
  onAddToCart,
  loading = false,
}: ProductosProps) {
  const money = (amount: number) =>
    Number(amount).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const categorias = ["Todos", "Café", "Pastelería"];

  const normalizarCategoria = (
    categoria?: string | null,
    nombre?: string
  ): string => {
    const value = (categoria ?? "").toLowerCase().trim();
    const productName = (nombre ?? "").toLowerCase().trim();

    if (
      value.includes("pastel") ||
      value.includes("dulce") ||
      value.includes("repostería") ||
      value.includes("reposteria") ||
      productName.includes("cheesecake") ||
      productName.includes("torta") ||
      productName.includes("zanahoria") ||
      productName.includes("pie de limón") ||
      productName.includes("brownie") ||
      productName.includes("muffin") ||
      productName.includes("croissant") ||
      productName.includes("roll de canela") ||
      productName.includes("kuchen")
    ) {
      return "Pastelería";
    }

    if (
      value.includes("café") ||
      value.includes("cafe") ||
      productName.includes("espresso") ||
      productName.includes("americano") ||
      productName.includes("cappuccino") ||
      productName.includes("latte") ||
      productName.includes("mocha") ||
      productName.includes("moka") ||
      productName.includes("frappé") ||
      productName.includes("frappe") ||
      productName.includes("chocolate caliente")
    ) {
      return "Café";
    }

    return "Sin categoría";
  };

  const obtenerEmoji = (product: Product): string => {
    if (product.emoji?.trim()) {
      return product.emoji;
    }

    const categoria = normalizarCategoria(
      product.categoria,
      product.nombre
    );

    if (categoria === "Café") {
      return "☕";
    }

    if (categoria === "Pastelería") {
      return "🍰";
    }

    return "🛍️";
  };

  const productosFiltrados =
    category === "Todos"
      ? products
      : products.filter(
          (product) =>
            normalizarCategoria(
              product.categoria,
              product.nombre
            ) === category
        );

  return (
    <main className="products-page">
      <section className="menu-section" id="menu">
        <div className="menu-intro">
          <div>
            <span className="eyebrow">COFFEE FLOWER</span>
            <h1>Nuestra carta</h1>
          </div>

          <p>
            Elige tus productos favoritos y disfruta una pausa deliciosa.
          </p>
        </div>

        <div className="menu-toolbar">
          <div className="menu-tabs">
            {categorias.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "filter active" : "filter"}
                onClick={() => onSelectCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <span className="catalog-count">
            {loading
              ? "CARGANDO..."
              : `${productosFiltrados.length} PRODUCTOS`}
          </span>
        </div>

        {!loading && productosFiltrados.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: "2.5rem" }}>☕</span>
            <h2>No hay productos disponibles</h2>
            <p>Prueba seleccionando otra categoría.</p>
          </div>
        ) : (
          <div className="products">
            {productosFiltrados.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-art">
                  <span className="product-emoji" aria-hidden="true">
                    {obtenerEmoji(product)}
                  </span>

                  <span className="product-category">
                    {normalizarCategoria(
                      product.categoria,
                      product.nombre
                    )}
                  </span>

                  <button
                    type="button"
                    className="add"
                    onClick={() => onAddToCart(product.id)}
                    aria-label={`Agregar ${product.nombre} al carrito`}
                  >
                    +
                  </button>
                </div>

                <div className="product-info">
                  <h3>{product.nombre}</h3>
                  <p>{product.descripcion}</p>

                  <div className="product-price">
                    <strong>{money(product.precio)}</strong>

                    <button
                      type="button"
                      className="small-add"
                      onClick={() => onAddToCart(product.id)}
                    >
                      Agregar +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
