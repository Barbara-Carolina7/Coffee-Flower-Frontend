
import React from "react";

export type CartProduct = {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria?: string | null;
  emoji?: string | null;
};

type CartProps = {
  products: CartProduct[];
  cart: Record<string, number>;
  onAdd: (id: string | number) => void;
  onRemove: (id: string | number) => void;
  onCheckout: () => void;
};

export default function Cart({
  products,
  cart,
  onAdd,
  onRemove,
  onCheckout,
}: CartProps) {
  const money = (amount: number) =>
    Number(amount).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const productosEnCarrito = products.filter(
    (product) => (cart[String(product.id)] ?? 0) > 0
  );

  const cantidadTotal = productosEnCarrito.reduce(
    (total, product) => total + (cart[String(product.id)] ?? 0),
    0
  );

  const total = productosEnCarrito.reduce(
    (sum, product) =>
      sum +
      Number(product.precio) * (cart[String(product.id)] ?? 0),
    0
  );

  const obtenerEmoji = (product: CartProduct): string => {
    if (product.emoji?.trim()) {
      return product.emoji;
    }

    const categoria = (product.categoria ?? "")
      .toLowerCase()
      .trim();

    if (categoria.includes("café") || categoria.includes("cafe")) {
      return "☕";
    }

    if (
      categoria.includes("pastel") ||
      categoria.includes("dulce") ||
      categoria.includes("repostería") ||
      categoria.includes("reposteria")
    ) {
      return "🍰";
    }

    return "🛍️";
  };

  return (
    <main className="cart-page">
      <section className="cart-section">
        <div className="menu-intro">
          <div>
            <span className="eyebrow">COFFEE FLOWER</span>
            <h1>Tu carrito</h1>
          </div>

          <p>
            Revisa tus productos favoritos antes de finalizar
            tu pedido.
          </p>
        </div>

        {productosEnCarrito.length === 0 ? (
          <div className="empty-state">
            <span
              style={{ fontSize: "3rem" }}
              role="img"
              aria-label="Taza de café"
            >
              ☕
            </span>

            <h2>Tu carrito está vacío</h2>

            <p>
              Todavía no has agregado cafés ni productos de
              pastelería.
            </p>
          </div>
        ) : (
          <>
            <div className="cart-layout">
              <div className="cart-items">
                {productosEnCarrito.map((product) => {
                  const cantidad =
                    cart[String(product.id)] ?? 0;

                  return (
                    <article
                      className="cart-item"
                      key={product.id}
                    >
                      <div
                        className="product-art cart-product-art"
                      >
                        <span
                          className="product-emoji"
                          role="img"
                          aria-label={
                            product.categoria ?? "Producto"
                          }
                        >
                          {obtenerEmoji(product)}
                        </span>
                      </div>

                      <div className="cart-item-info">
                        <h3>{product.nombre}</h3>

                        <p>{product.descripcion}</p>

                        <strong>
                          {money(Number(product.precio))}
                        </strong>

                        <div className="cart-quantity">
                          <button
                            type="button"
                            onClick={() => onRemove(product.id)}
                            aria-label={`Quitar una unidad de ${product.nombre}`}
                          >
                            −
                          </button>

                          <span aria-live="polite">
                            {cantidad}
                          </span>

                          <button
                            type="button"
                            onClick={() => onAdd(product.id)}
                            aria-label={`Agregar una unidad de ${product.nombre}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-subtotal">
                        <strong>
                          {money(
                            Number(product.precio) * cantidad
                          )}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="cart-summary">
                <span className="eyebrow">
                  RESUMEN DEL PEDIDO
                </span>

                <h2>Tu compra</h2>

                <div className="cart-summary-row">
                  <span>Productos</span>
                  <span>{cantidadTotal}</span>
                </div>

                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>{money(total)}</span>
                </div>

                <div className="cart-summary-total">
                  <span>Total</span>
                  <strong>{money(total)}</strong>
                </div>

                <button
                  type="button"
                  className="button button-dark cart-checkout"
                  onClick={onCheckout}
                  disabled={cantidadTotal === 0}
                >
                  Finalizar pedido
                </button>

                <p className="cart-summary-note">
                  Gracias por elegir Coffee Flower.
                </p>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
