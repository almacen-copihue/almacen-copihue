import { useState, useEffect, useRef } from "react";

const PRODUCTS = [
  { id: 1, name: "Coca-Cola 600ml", price: 25, category: "Bebidas", emoji: "🥤" },
  { id: 2, name: "Agua Natural 1L", price: 15, category: "Bebidas", emoji: "💧" },
  { id: 3, name: "Pan Bimbo", price: 35, category: "Panadería", emoji: "🍞" },
  { id: 4, name: "Leche 1L", price: 22, category: "Lácteos", emoji: "🥛" },
  { id: 5, name: "Papas Sabritas", price: 18, category: "Botanas", emoji: "🥔" },
  { id: 6, name: "Galletas Oreo", price: 28, category: "Dulces", emoji: "🍪" },
  { id: 7, name: "Jugo Del Valle", price: 20, category: "Bebidas", emoji: "🧃" },
  { id: 8, name: "Chicles Trident", price: 12, category: "Dulces", emoji: "🪄" },
  { id: 9, name: "Cereal Zucaritas", price: 65, category: "Cereales", emoji: "🌽" },
  { id: 10, name: "Arroz 1kg", price: 30, category: "Básicos", emoji: "🍚" },
  { id: 11, name: "Frijoles 1kg", price: 28, category: "Básicos", emoji: "🫘" },
  { id: 12, name: "Yogurt Yoplait", price: 18, category: "Lácteos", emoji: "🫙" },
];

export default function POSApp() {
  const [screen, setScreen] = useState("main"); // main | cart | minimize | payment
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [minimizedCart, setMinimizedCart] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [notification, setNotification] = useState("");
  const searchRef = useRef(null);

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  function addToCart(product) {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    triggerNotif(`${product.emoji} ${product.name} agregado`);
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function changeQty(id, delta) {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter(i => i.qty > 0)
    );
  }

  function triggerNotif(msg) {
    setNotification(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2500);
  }

  function handleMinimize() {
    setMinimizedCart(cart);
    setScreen("minimized");
    triggerNotif("🛒 Carrito guardado — puedes continuar después");
  }

  function handleResumeCart() {
    setCart(minimizedCart);
    setMinimizedCart([]);
    setScreen("cart");
  }

  function handleClearCart() {
    setCart([]);
    setSearch("");
    setShowClearConfirm(false);
    setScreen("main");
    triggerNotif("🧹 Carrito limpiado");
  }

  function handleExitApp() {
    setShowExitConfirm(false);
    setCart([]);
    setMinimizedCart([]);
    setSearch("");
    setScreen("main");
    triggerNotif("👋 Sesión cerrada");
  }

  function handlePayment() {
    setPaymentDone(true);
    setTimeout(() => {
      setCart([]);
      setPaymentDone(false);
      setScreen("main");
      triggerNotif("✅ Venta completada exitosamente");
    }, 2500);
  }

  const isMinimized = screen === "minimized";

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0f1117",
      minHeight: "100vh",
      color: "#f0f0f0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 20% 0%, #1a2340 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #1a1230 0%, transparent 60%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* NOTIFICATION TOAST */}
      <div style={{
        position: "fixed", top: 20, left: "50%", transform: `translateX(-50%) translateY(${showNotification ? 0 : -80}px)`,
        background: "#1e293b", border: "1px solid #334155", borderRadius: 12,
        padding: "10px 20px", fontSize: 14, fontWeight: 500, color: "#e2e8f0",
        zIndex: 9999, transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
        backdropFilter: "blur(10px)",
      }}>
        {notification}
      </div>

      {/* EXIT CONFIRM MODAL */}
      {showExitConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 20,
            padding: 32, maxWidth: 340, width: "90%", textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚪</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>¿Cerrar aplicación?</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 24px", fontSize: 14 }}>
              Se perderán todos los datos del carrito actual.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowExitConfirm(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #334155",
                background: "transparent", color: "#94a3b8", fontSize: 15, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={handleExitApp} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>Sí, cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CONFIRM MODAL */}
      {showClearConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1e293b", border: "1px solid #334155", borderRadius: 20,
            padding: 32, maxWidth: 340, width: "90%", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧹</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>¿Limpiar carrito?</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 24px", fontSize: 14 }}>
              Se eliminarán todos los productos del carrito.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #334155",
                background: "transparent", color: "#94a3b8", fontSize: 15, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={handleClearCart} style={{
                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>Sí, limpiar</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SCREEN */}
      {paymentDone && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
          zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 16,
        }}>
          <div style={{ fontSize: 80, animation: "bounce 0.5s ease" }}>✅</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>¡Pago exitoso!</h2>
          <p style={{ color: "#94a3b8" }}>Total cobrado: ${cartTotal.toFixed(2)}</p>
        </div>
      )}

      {/* ===== MAIN SCREEN ===== */}
      {(screen === "main" || screen === "minimized") && (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          {/* TOP BAR */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid #1e293b",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>🏪</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>MiTienda POS</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Sistema de Cobro</div>
              </div>
            </div>
            <button
              onClick={() => setShowExitConfirm(true)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid #334155",
                background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
              ✕ Salir / Cerrar
            </button>
          </div>

          {/* MINIMIZED BANNER */}
          {isMinimized && minimizedCart.length > 0 && (
            <div style={{
              margin: "16px 16px 0",
              background: "linear-gradient(135deg, #1e3a5f, #1e293b)",
              border: "1px solid #3b82f6",
              borderRadius: 16, padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>🛒</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#93c5fd" }}>
                    Carrito guardado ({minimizedCart.reduce((s,i)=>s+i.qty,0)} productos)
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Total: ${minimizedCart.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)} — Tap para continuar
                  </div>
                </div>
              </div>
              <button onClick={handleResumeCart} style={{
                padding: "10px 18px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                ▶ Cobrar
              </button>
            </div>
          )}

          {/* SEARCH + ACTIONS */}
          <div style={{ padding: "16px 16px 8px", display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                style={{
                  width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12,
                  border: "1px solid #334155", background: "#1e293b", color: "#f0f0f0",
                  fontSize: 15, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            {search && (
              <button onClick={() => setSearch("")} style={{
                padding: "12px 16px", borderRadius: 12, border: "1px solid #334155",
                background: "#1e293b", color: "#f59e0b", fontSize: 14, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                🧹 Limpiar
              </button>
            )}
          </div>

          {/* PRODUCTS GRID */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "8px 16px",
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10,
          }}>
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} style={{
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 14, padding: "14px 10px", cursor: "pointer",
                color: "#f0f0f0", textAlign: "center", transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>${p.price}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.category}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#475569" }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <div style={{ marginTop: 8 }}>Sin resultados para "{search}"</div>
              </div>
            )}
          </div>

          {/* BOTTOM BAR */}
          <div style={{
            padding: "14px 16px", borderTop: "1px solid #1e293b",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <button onClick={() => setShowClearConfirm(true)} style={{
              flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid #334155",
              background: "#1e293b", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              🧹 Limpiar
            </button>
            <button
              onClick={() => cart.length > 0 ? setScreen("cart") : triggerNotif("⚠️ Agrega productos primero")}
              style={{
                flex: 2, padding: "14px 0", borderRadius: 12, border: "none",
                background: cart.length > 0
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "#1e293b",
                color: cart.length > 0 ? "#fff" : "#475569",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                position: "relative",
              }}>
              💳 Cobrar
              {cart.length > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6, background: "#ef4444",
                  color: "#fff", borderRadius: "50%", width: 22, height: 22,
                  fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== CART SCREEN ===== */}
      {screen === "cart" && (
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* CART HEADER */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "16px 20px", borderBottom: "1px solid #1e293b",
          }}>
            <button onClick={() => setScreen("main")} style={{
              width: 38, height: 38, borderRadius: 10, border: "1px solid #334155",
              background: "transparent", color: "#94a3b8", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>🛒 Carrito</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{cartCount} productos · ${cartTotal.toFixed(2)}</div>
            </div>
            <button onClick={() => setShowExitConfirm(true)} style={{
              width: 38, height: 38, borderRadius: 10, border: "1px solid #334155",
              background: "transparent", color: "#ef4444", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* CART ITEMS */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ fontSize: 56 }}>🛒</div>
                <div style={{ marginTop: 12, fontSize: 16 }}>El carrito está vacío</div>
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{
                background: "#1e293b", border: "1px solid #334155", borderRadius: 14,
                padding: "14px 16px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>${item.price} c/u</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => changeQty(item.id, -1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: "1px solid #334155",
                    background: "transparent", color: "#f0f0f0", fontSize: 16, cursor: "pointer",
                  }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} style={{
                    width: 30, height: 30, borderRadius: 8, border: "1px solid #334155",
                    background: "transparent", color: "#f0f0f0", fontSize: 16, cursor: "pointer",
                  }}>+</button>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, minWidth: 60, textAlign: "right" }}>
                  ${(item.price * item.qty).toFixed(2)}
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{
                  width: 28, height: 28, borderRadius: 8, border: "none",
                  background: "#3f1515", color: "#ef4444", fontSize: 14, cursor: "pointer",
                }}>✕</button>
              </div>
            ))}
          </div>

          {/* CART TOTAL & ACTIONS */}
          {cart.length > 0 && (
            <div style={{ padding: "16px 16px", borderTop: "1px solid #1e293b" }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 14, padding: "12px 16px",
                background: "#1e293b", borderRadius: 12, border: "1px solid #334155",
              }}>
                <span style={{ color: "#94a3b8", fontSize: 15 }}>Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>${cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleMinimize} style={{
                  flex: 1, padding: "14px 0", borderRadius: 12,
                  border: "1px solid #334155", background: "#1e293b",
                  color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  ⬇ Minimizar<br />
                  <span style={{ fontSize: 11, fontWeight: 400 }}>Seguir después</span>
                </button>
                <button onClick={handlePayment} style={{
                  flex: 2, padding: "14px 0", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer",
                }}>
                  💳 Cobrar ${cartTotal.toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: #475569; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>
    </div>
  );
}
