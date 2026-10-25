import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";

type Product = { id: string | number; nombre: string; descripcion: string; precio: number; categoria: "Café" | "Pastelería"; emoji: string };
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const DEMO_PRODUCTS: Product[] = [
  { id: 1, nombre: "Latte Vainilla", descripcion: "Espresso, leche cremosa y un toque de vainilla.", precio: 3490, categoria: "Café", emoji: "☕" },
  { id: 2, nombre: "Cappuccino", descripcion: "Espresso intenso con espuma de leche.", precio: 2990, categoria: "Café", emoji: "🥛" },
  { id: 3, nombre: "Croissant de mantequilla", descripcion: "Hojaldre dorado, horneado cada mañana.", precio: 2290, categoria: "Pastelería", emoji: "🥐" },
  { id: 4, nombre: "Torta de chocolate", descripcion: "Bizcocho húmedo con ganache de chocolate.", precio: 3990, categoria: "Pastelería", emoji: "🍰" },
  { id: 5, nombre: "Cold Brew", descripcion: "Café de extracción lenta, suave y refrescante.", precio: 3290, categoria: "Café", emoji: "🧋" },
  { id: 6, nombre: "Roll de canela", descripcion: "Masa suave, canela y glaseado delicado.", precio: 2590, categoria: "Pastelería", emoji: "🍥" },
];

export default function App() {
  const auth = useAuth();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const groups = (auth.user?.profile?.["cognito:groups"] as string[] | undefined) ?? [];
  const role = groups.includes("Administrador") || groups.includes("Admin") ? "Administrador"
    : groups.includes("Colaborador") ? "Colaborador" : "Cliente";
  const email = String(auth.user?.profile?.email ?? auth.user?.profile?.username ?? "");

  const authHeaders = useCallback((): HeadersInit => {
    const token = auth.user?.access_token;
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, [auth.user]);

  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/productos`)
      .then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { if (!cancelled && Array.isArray(data) && data.length) setProducts(data); })
      .catch(() => { if (!cancelled) setMessage("Mostrando catálogo de demostración. Revisa VITE_API_URL y el endpoint /api/productos para cargar la API."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => category === "Todos" ? products : products.filter(p => p.categoria === category), [products, category]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((sum, p) => sum + (cart[String(p.id)] ?? 0) * p.precio, 0);
  const money = (n: number) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  const login = () => {
    if (!import.meta.env.VITE_COGNITO_DOMAIN || !import.meta.env.VITE_COGNITO_CLIENT_ID) {
      setMessage("Configura el dominio y App Client de tu nuevo Cognito en frontend/.env.");
      return;
    }
    void auth.signinRedirect();
  };
  const logout = async () => {
    const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
    await auth.removeUser();
    if (domain && clientId) {
      const url = `https://${domain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(window.location.origin)}`;
      window.location.assign(url);
    }
  };
  const add = (id: string | number) => setCart(prev => ({ ...prev, [String(id)]: (prev[String(id)] ?? 0) + 1 }));

  async function checkout() {
    if (!auth.isAuthenticated) { setMessage("Inicia sesión para continuar con tu pedido."); return; }
    if (!cartCount) { setMessage("Agrega productos al carrito primero."); return; }
    if (!API_URL) { setMessage("Falta configurar VITE_API_URL. El carrito funciona como demostración, pero aún no se puede enviar el pedido."); return; }
    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ cliente: email, items: products.filter(p => cart[String(p.id)]).map(p => ({ productoId: p.id, nombre: p.nombre, cantidad: cart[String(p.id)], precio: p.precio })), total }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCart({}); setMessage("¡Pedido enviado correctamente!");
    } catch (e) { setMessage(`No se pudo enviar el pedido: ${e instanceof Error ? e.message : "error de red"}. Revisa API Gateway y el backend.`); }
  }

  return <div className="app">
    <header className="topbar">
      <a className="brand" href="#inicio"><span className="brand-icon">✿</span><span>Coffee <i>Flower</i><small>CAFÉ · PASTELERÍA</small></span></a>
      <nav><a href="#menu">Menú</a><a href="#nosotros">Nosotros</a><a href="#pedido">Mi pedido ({cartCount})</a></nav>
      <div className="account">{auth.isAuthenticated ? <><span className="role">{role}</span><button className="button button-outline" onClick={() => void logout()}>Salir</button></> : <button className="button button-dark" onClick={login}>Iniciar sesión</button>}</div>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="hero-copy"><span className="eyebrow">UN MOMENTO PARA TI</span><h1>Pequeños placeres,<br/><em>grandes momentos.</em></h1><p>Café preparado con cariño y pastelería recién hecha para acompañar tus días.</p><a className="button button-dark" href="#menu">Descubrir el menú <span>↗</span></a><div className="hero-note"><span>✦</span> Hecho con cariño, servido con aroma.</div></div>
        <div className="hero-art"><div className="sun"></div><div className="hero-sticker">FRESH<br/>DAILY ✿</div><div className="cup">☕</div><div className="hero-caption">Tu pausa favorita<br/><b>comienza aquí.</b></div></div>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-head"><div><span className="eyebrow">NUESTROS FAVORITOS</span><h2>Algo rico te espera</h2></div><p>Sabores que alegran el día,<br/>una taza y un bocado a la vez.</p></div>
        <div className="filters">{["Todos", "Café", "Pastelería"].map(c => <button key={c} className={category === c ? "filter active" : "filter"} onClick={() => setCategory(c)}>{c}</button>)}</div>
        {loading && <p className="muted">Consultando el catálogo de Coffee Flower…</p>}
        <div className="products">{filtered.map((p, i) => <article className="product" key={p.id}><div className={`product-art art-${i % 4}`}><span>{p.emoji}</span><small>{p.categoria}</small></div><div className="product-info"><div><h3>{p.nombre}</h3><p>{p.descripcion}</p></div><div className="product-bottom"><strong>{money(p.precio)}</strong><button className="add" onClick={() => add(p.id)} aria-label={`Agregar ${p.nombre}`}>+</button></div></div></article>)}</div>
      </section>

      <section className="story" id="nosotros"><div className="story-mark">✿</div><div><span className="eyebrow">NUESTRA ESENCIA</span><h2>Un rincón cálido<br/><em>en medio de tu día.</em></h2><p>En Coffee Flower creemos que un buen café puede convertir un momento cotidiano en uno especial. Preparamos cada taza y cada dulce pensando en ti.</p></div><div className="story-stat"><strong>100%</strong><span>amor por el café<br/>y los detalles</span></div></section>

      <section className="checkout" id="pedido"><div><span className="eyebrow">TU SELECCIÓN</span><h2>Tu pausa, a tu manera.</h2><p>{cartCount ? `${cartCount} producto(s) en tu carrito` : "Agrega tus favoritos del menú para comenzar."}</p></div><div className="checkout-total"><span>Total estimado</span><strong>{money(total)}</strong><button className="button button-dark" onClick={() => void checkout()}>Continuar pedido ↗</button></div></section>
      {message && <div className="notice" role="status"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}
    </main>
    <footer><a className="brand footer-brand" href="#inicio"><span className="brand-icon">✿</span><span>Coffee <i>Flower</i><small>CAFÉ · PASTELERÍA</small></span></a><span>Una pausa bonita, todos los días.</span><span>© {new Date().getFullYear()} Coffee Flower 360</span></footer>
  </div>;
}
