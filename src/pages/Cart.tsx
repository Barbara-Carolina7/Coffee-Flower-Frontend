
import React, { useMemo } from "react";

export type CartProduct = {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  emoji?: string;
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
  const items = useMemo(
    () =>
      products.filter(
        (product) => (cart[String(product.id)] ?? 0) > 0
      ),
    [products, cart]
  );

  const cartCount = items.reduce(
    (total, product) => total + (cart[String(product.id)] ?? 0),
    0
  );

  const total = items.reduce(
    (sum, product) =>
      sum + product.precio * (cart[String(product.id)] ?? 0),
    0
  );

  const money = (amount: number) =>
    amount.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  return (
    <main className="cart-page">
      <section className="checkout" id="pedido">
        <div className="section-heading">
          <span className="eyebrow">TU SELECCIÓN</span>
          <h1>Mi carrito</h1>
          <p>
            Revisa tus cafés y pastelería antes de confirmar tu pedido.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <span className="cart-empty-icon" aria-hidden="true">
              🛍️
            </span>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega tus productos favoritos de Coffee Flower.</p>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {items.map((product) => {
                const quantity = cart[String(product.id)];

                return (
                  <article className="cart-item" key={product.id}>
                    <div className="cart-product-icon">
                      <span aria-hidden="true">
                        {product.emoji ?? "☕"}
                      </span>
                    </div>

                    <div className="cart-item-info">
                      <h3>{product.nombre}</h3>
                      <p>{product.descripcion}</p>
                      <strong>{money(product.precio)}</strong>
                    </div>

                    <div className="cart-quantity">
                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        aria-label={`Disminuir ${product.nombre}`}
                      >
                        −
                      </button>

                      <span aria-live="polite">{quantity}</span>

                      <button
                        type="button"
                        onClick={() => onAdd(product.id)}
                        aria-label={`Aumentar ${product.nombre}`}
                      >
                        +
                      </button>
                    </div>

                    <strong className="cart-subtotal">
                      {money(product.precio * quantity)}
                    </strong>
                  </article>
                );
              })}
            </div>

            <div className="cart-summary">
              <div className="checkout-row">
                <span>Cantidad de productos</span>
                <strong>{cartCount}</strong>
              </div>

              <div className="checkout-row checkout-total">
                <span>Total del pedido</span>
                <strong>{money(total)}</strong>
              </div>

              <button
                type="button"
                className="button button-dark checkout-button"
                onClick={onCheckout}
              >
                Continuar pedido →
              </button>

              <p className="text-muted">
                Gracias por elegir Coffee Flower 🌸
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
