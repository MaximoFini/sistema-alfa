"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Search,
  X,
  ShoppingBag,
  Shirt,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  categoria: string;
  talles: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

interface Venta {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  precio_costo_unitario: number;
  total: number;
  ganancia: number;
  notas: string | null;
  talle_vendido: string | null;
  created_at: string;
  productos?: {
    nombre: string;
  };
}

interface TalleStock {
  talle: string;
  stock: string;
}

interface ProductoFormData {
  nombre: string;
  precio_venta: string;
  precio_costo: string;
  stock: string;
  stock_minimo: string;
  categoria: string;
  tallesStock: TalleStock[];
}

interface VentaFormData {
  producto_id: string;
  cantidad: string;
  notas: string;
  medio_pago: string;
  talle_vendido: string;
}

const TALLES_DISPONIBLES = ["XS", "S", "M", "L", "XL", "XXL"];

// ─── Modal para crear/editar producto ─────────────────────────────────────────
function ProductoModal({
  producto,
  onClose,
  onSaved,
}: {
  producto?: Producto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const getInitialTallesStock = (): TalleStock[] => {
    if (producto?.talles) {
      return Object.entries(producto.talles).map(([t, s]) => ({
        talle: t,
        stock: s.toString(),
      }));
    }
    return [{ talle: "S", stock: "0" }];
  };

  const [form, setForm] = useState<ProductoFormData>({
    nombre: producto?.nombre || "",
    precio_venta: producto?.precio_venta.toString() || "",
    precio_costo: producto?.precio_costo.toString() || "",
    stock: producto?.stock.toString() || "0",
    stock_minimo: producto?.stock_minimo.toString() || "0",
    categoria: producto?.categoria || "General",
    tallesStock: getInitialTallesStock(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const esIndumentaria = form.categoria === "Indumentaria";

  const stockTotalCalculado = esIndumentaria
    ? form.tallesStock.reduce((acc, t) => acc + (parseInt(t.stock) || 0), 0)
    : parseInt(form.stock) || 0;

  function agregarTalle() {
    const disponibles = TALLES_DISPONIBLES.filter(
      (t) => !form.tallesStock.some((ts) => ts.talle === t)
    );
    if (disponibles.length === 0) return;
    setForm({
      ...form,
      tallesStock: [...form.tallesStock, { talle: disponibles[0], stock: "0" }],
    });
  }

  function quitarTalle(idx: number) {
    const nuevo = form.tallesStock.filter((_, i) => i !== idx);
    setForm({ ...form, tallesStock: nuevo });
  }

  function updateTalle(idx: number, field: "talle" | "stock", value: string) {
    const nuevo = [...form.tallesStock];
    nuevo[idx] = { ...nuevo[idx], [field]: value };
    setForm({ ...form, tallesStock: nuevo });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (!form.precio_venta || parseFloat(form.precio_venta) <= 0) {
      setError("El precio de venta debe ser mayor a 0");
      return;
    }

    if (esIndumentaria && form.tallesStock.length === 0) {
      setError("Debes agregar al menos un talle");
      return;
    }

    setLoading(true);

    try {
      let tallesObj: Record<string, number> | null = null;
      let stockFinal = parseInt(form.stock) || 0;

      if (esIndumentaria) {
        tallesObj = {};
        form.tallesStock.forEach((ts) => {
          if (ts.talle) tallesObj![ts.talle] = parseInt(ts.stock) || 0;
        });
        stockFinal = Object.values(tallesObj).reduce((a, b) => a + b, 0);
      }

      const data = {
        nombre: form.nombre.trim(),
        precio_venta: parseFloat(form.precio_venta),
        precio_costo: parseFloat(form.precio_costo) || 0,
        stock: stockFinal,
        stock_minimo: parseInt(form.stock_minimo) || 0,
        categoria: form.categoria,
        talles: tallesObj,
        updated_at: new Date().toISOString(),
      };

      if (producto) {
        const { error } = await supabase
          .from("productos")
          .update(data)
          .eq("id", producto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("productos").insert([data]);
        if (error) throw error;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <Package size={20} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {producto ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <p className="text-xs text-gray-400">
                {producto
                  ? "Actualiza la información del producto"
                  : "Completa los datos del nuevo producto"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del Producto *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              placeholder="Ej: Agua mineral 500ml"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría *
            </label>
            <div className="flex gap-3">
              {["General", "Indumentaria"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      categoria: cat,
                      tallesStock: cat === "Indumentaria" ? [{ talle: "S", stock: "0" }] : form.tallesStock,
                    })
                  }
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all",
                    form.categoria === cat
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {cat === "Indumentaria" && <Shirt size={15} />}
                  {cat === "General" && <Package size={15} />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Venta * ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_venta}
                onChange={(e) =>
                  setForm({ ...form, precio_venta: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Costo ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precio_costo}
                onChange={(e) =>
                  setForm({ ...form, precio_costo: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Sección condicional: stock normal vs. talles */}
          {!esIndumentaria ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Actual
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) =>
                    setForm({ ...form, stock_minimo: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Stock por Talle
                </label>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Total: {stockTotalCalculado} unidades
                </span>
              </div>

              {form.tallesStock.map((ts, idx) => {
                const tallesUsados = form.tallesStock
                  .filter((_, i) => i !== idx)
                  .map((x) => x.talle);
                return (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={ts.talle}
                      onChange={(e) => updateTalle(idx, "talle", e.target.value)}
                      className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                    >
                      {TALLES_DISPONIBLES.filter(
                        (t) => !tallesUsados.includes(t) || t === ts.talle
                      ).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={ts.stock}
                      onChange={(e) => updateTalle(idx, "stock", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50"
                      placeholder="0"
                    />
                    {form.tallesStock.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarTalle(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              {form.tallesStock.length < TALLES_DISPONIBLES.length && (
                <button
                  type="button"
                  onClick={agregarTalle}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  Agregar talle
                </button>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Mínimo (total)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) =>
                    setForm({ ...form, stock_minimo: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#DC2626" }}
            >
              {loading ? "Guardando..." : producto ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal para registrar venta ───────────────────────────────────────────────
function VentaModal({
  productos,
  onClose,
  onSaved,
}: {
  productos: Producto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<VentaFormData>({
    producto_id: "",
    cantidad: "1",
    notas: "",
    medio_pago: "",
    talle_vendido: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mediosPago, setMediosPago] = useState<Array<{ name: string }>>([]);

  useEffect(() => {
    async function loadPaymentMethods() {
      const { data } = await supabase
        .from("payment_methods")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (data) setMediosPago(data);
    }
    loadPaymentMethods();
  }, []);

  const productoSeleccionado = productos.find((p) => p.id === form.producto_id);
  const esIndumentaria = productoSeleccionado?.categoria === "Indumentaria";

  // talles con stock disponible
  const tallesDisponibles = esIndumentaria && productoSeleccionado?.talles
    ? Object.entries(productoSeleccionado.talles)
        .filter(([, qty]) => qty > 0)
        .map(([talle, qty]) => ({ talle, qty }))
    : [];

  // stock disponible del talle seleccionado
  const stockTalleSeleccionado =
    esIndumentaria && form.talle_vendido && productoSeleccionado?.talles
      ? productoSeleccionado.talles[form.talle_vendido] ?? 0
      : productoSeleccionado?.stock ?? 0;

  const total = productoSeleccionado
    ? productoSeleccionado.precio_venta * parseFloat(form.cantidad || "0")
    : 0;
  const ganancia = productoSeleccionado
    ? (productoSeleccionado.precio_venta - productoSeleccionado.precio_costo) *
      parseFloat(form.cantidad || "0")
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.producto_id) {
      setError("Selecciona un producto");
      return;
    }

    const cantidad = parseInt(form.cantidad);
    if (!cantidad || cantidad <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    if (!productoSeleccionado) {
      setError("Producto no encontrado");
      return;
    }

    if (esIndumentaria && !form.talle_vendido) {
      setError("Debes seleccionar el talle que se vende");
      return;
    }

    if (esIndumentaria) {
      if (stockTalleSeleccionado < cantidad) {
        setError(`Stock insuficiente para el talle ${form.talle_vendido} (disponible: ${stockTalleSeleccionado})`);
        return;
      }
    } else {
      if (productoSeleccionado.stock < cantidad) {
        setError("Stock insuficiente");
        return;
      }
    }

    if (!form.medio_pago) {
      setError("Selecciona un método de pago");
      return;
    }

    setLoading(true);

    try {
      // Registrar venta
      const ventaData: any = {
        producto_id: form.producto_id,
        cantidad: cantidad,
        precio_unitario: productoSeleccionado.precio_venta,
        precio_costo_unitario: productoSeleccionado.precio_costo,
        medio_pago: form.medio_pago,
        notas: form.notas.trim() || null,
        talle_vendido: esIndumentaria ? form.talle_vendido : null,
      };

      const { error: ventaError } = await supabase
        .from("ventas")
        .insert([ventaData]);
      if (ventaError) throw ventaError;

      // Actualizar stock
      if (esIndumentaria && productoSeleccionado.talles) {
        const nuevosTalles = { ...productoSeleccionado.talles };
        nuevosTalles[form.talle_vendido] = (nuevosTalles[form.talle_vendido] || 0) - cantidad;
        const nuevoStockTotal = Object.values(nuevosTalles).reduce((a, b) => a + b, 0);

        const { error: stockError } = await supabase
          .from("productos")
          .update({
            talles: nuevosTalles,
            stock: nuevoStockTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", form.producto_id);
        if (stockError) throw stockError;
      } else {
        const nuevoStock = productoSeleccionado.stock - cantidad;
        const { error: stockError } = await supabase
          .from("productos")
          .update({
            stock: nuevoStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", form.producto_id);
        if (stockError) throw stockError;
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al registrar la venta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <ShoppingCart size={20} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Registrar Venta
              </h2>
              <p className="text-xs text-gray-400">
                Completa los datos de la venta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Producto *
            </label>
            <select
              value={form.producto_id}
              onChange={(e) =>
                setForm({ ...form, producto_id: e.target.value, talle_vendido: "" })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            >
              <option value="">Seleccionar producto</option>
              {productos
                .filter((p) => p.activo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} - ${p.precio_venta.toFixed(2)} (Stock: {p.stock})
                  </option>
                ))}
            </select>
          </div>

          {/* Selección de talle (solo para indumentaria) */}
          {esIndumentaria && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Talle *
              </label>
              {tallesDisponibles.length === 0 ? (
                <p className="text-sm text-red-500">Sin stock disponible para ningún talle</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tallesDisponibles.map(({ talle, qty }) => (
                    <button
                      key={talle}
                      type="button"
                      onClick={() => setForm({ ...form, talle_vendido: talle })}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
                        form.talle_vendido === talle
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      )}
                    >
                      {talle}
                      <span className="ml-1.5 text-xs opacity-70">({qty})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
              placeholder="1"
            />
            {productoSeleccionado && (
              <p className="text-xs text-gray-500 mt-1">
                Stock disponible:{" "}
                {esIndumentaria && form.talle_vendido
                  ? `${stockTalleSeleccionado} unidades (talle ${form.talle_vendido})`
                  : esIndumentaria
                  ? "Selecciona un talle"
                  : `${productoSeleccionado.stock} unidades`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              value={form.medio_pago}
              onChange={(e) => setForm({ ...form, medio_pago: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            >
              <option value="">Seleccionar pago...</option>
              {mediosPago.map((mp) => (
                <option key={mp.name} value={mp.name}>
                  {mp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all resize-none"
              rows={3}
              placeholder="Información adicional sobre la venta..."
            />
          </div>

          {productoSeleccionado && parseFloat(form.cantidad || "0") > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ganancia:</span>
                <span
                  className="font-bold"
                  style={{ color: ganancia >= 0 ? "#16A34A" : "#DC2626" }}
                >
                  ${ganancia.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#DC2626" }}
            >
              {loading ? "Procesando..." : "Registrar Venta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ProductosVentasPage() {
  const [tab, setTab] = useState<"productos" | "historial">(
    "productos",
  );
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showVentaModal, setShowVentaModal] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Producto | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: prodData } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });
      if (prodData) setProductos(prodData);

      const { data: ventasData } = await supabase
        .from("ventas")
        .select("*, productos(nombre)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (ventasData) setVentas(ventasData as any);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProducto(id: string) {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const { error } = await supabase
        .from("productos")
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert("Error al eliminar el producto");
    }
  }

  async function handleToggleActivo(producto: Producto) {
    try {
      const { error } = await supabase
        .from("productos")
        .update({
          activo: !producto.activo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", producto.id);
      if (error) throw error;
      loadData();
    } catch (err) {
      alert("Error al actualizar el producto");
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const productosActivos = productosFiltrados.filter((p) => p.activo);
  const productosInactivos = productosFiltrados.filter((p) => !p.activo);

  // Estadísticas
  const totalVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalGanancias = ventas.reduce((acc, v) => acc + (v.ganancia || 0), 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <ShoppingBag size={24} style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Productos y Ventas
              </h1>
              <p className="text-sm text-gray-500">
                Gestiona el inventario y registra las ventas del gimnasio
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setProductoEdit(undefined);
                setShowProductoModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#EA580C" }}
            >
              <Plus size={18} />
              Nuevo Producto
            </button>
            <button
              onClick={() => setShowVentaModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#DC2626" }}
            >
              <ShoppingCart size={18} />
              Registrar Venta
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-gray-200">
          <button
            onClick={() => setTab("productos")}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition-all relative",
              tab === "productos"
                ? "text-red-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Productos
            {tab === "productos" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "#DC2626" }}
              />
            )}
          </button>
          <button
            onClick={() => setTab("historial")}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition-all relative",
              tab === "historial"
                ? "text-red-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Historial de Ventas
            {tab === "historial" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "#DC2626" }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div
                className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"
                style={{ borderTopColor: "#DC2626" }}
              />
              <p className="text-sm text-gray-500">Cargando...</p>
            </div>
          </div>
        ) : (
          <>
            {tab === "productos" && (
              <div>
                {/* Buscador */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar productos..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
                    />
                  </div>
                </div>

                {/* Productos activos */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">
                    PRODUCTOS ACTIVOS ({productosActivos.length})
                  </h3>
                  {productosActivos.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                      <Package
                        size={48}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p className="text-sm text-gray-500">
                        No hay productos activos
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {productosActivos.map((producto) => {
                        const stockBajo =
                          producto.stock <= producto.stock_minimo;
                        const esIndumentaria = producto.categoria === "Indumentaria";
                        return (
                          <div
                            key={producto.id}
                            className={cn(
                              "bg-white rounded-xl border p-4 transition-all hover:shadow-lg",
                              stockBajo
                                ? "border-red-200 bg-red-50/30"
                                : "border-gray-100",
                            )}
                          >
                            {stockBajo && (
                              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-red-100 border border-red-200 rounded-lg">
                                <AlertTriangle
                                  size={14}
                                  className="text-red-600"
                                />
                                <span className="text-xs font-semibold text-red-700">
                                  Stock bajo
                                </span>
                              </div>
                            )}

                            <div className="mb-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                {esIndumentaria && (
                                  <Shirt
                                    size={14}
                                    className="text-gray-400 shrink-0"
                                  />
                                )}
                                <h4 className="font-bold text-gray-900 truncate">
                                  {producto.nombre}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-2xl font-bold"
                                  style={{ color: "#DC2626" }}
                                >
                                  ${producto.precio_venta.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              {/* Categoria */}
                              {esIndumentaria && (
                                <div className="mb-2">
                                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                    Indumentaria
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Stock total:</span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    stockBajo
                                      ? "text-red-600"
                                      : "text-gray-900",
                                  )}
                                >
                                  {producto.stock} unidades
                                </span>
                              </div>

                              {/* Desglose de talles */}
                              {esIndumentaria && producto.talles && Object.keys(producto.talles).length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Talles:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(producto.talles).map(([talle, qty]) => (
                                      <span
                                        key={talle}
                                        className={cn(
                                          "text-xs font-semibold px-2 py-0.5 rounded-full border",
                                          qty === 0
                                            ? "border-gray-200 text-gray-400 line-through bg-gray-50"
                                            : "border-blue-200 text-blue-700 bg-blue-50"
                                        )}
                                      >
                                        {talle}: {qty}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Stock mínimo:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {producto.stock_minimo}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Costo:</span>
                                <span className="font-semibold text-gray-900">
                                  ${producto.precio_costo.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Ganancia:</span>
                                <span
                                  className="font-semibold"
                                  style={{ color: "#16A34A" }}
                                >
                                  $
                                  {(
                                    producto.precio_venta -
                                    producto.precio_costo
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setProductoEdit(producto);
                                  setShowProductoModal(true);
                                }}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleActivo(producto)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                title="Desactivar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Productos inactivos */}
                {productosInactivos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">
                      PRODUCTOS INACTIVOS ({productosInactivos.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {productosInactivos.map((producto) => (
                        <div
                          key={producto.id}
                          className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-60"
                        >
                          <div className="mb-3">
                            <h4 className="font-bold text-gray-700 mb-1">
                              {producto.nombre}
                            </h4>
                            <span className="text-xl font-bold text-gray-500">
                              ${producto.precio_venta.toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleActivo(producto)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
                          >
                            Reactivar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "historial" && (
              <div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Talle
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Ganancia
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            Notas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ventas.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center">
                              <ShoppingCart
                                size={48}
                                className="mx-auto mb-3 text-gray-300"
                              />
                              <p className="text-sm text-gray-500">
                                No hay ventas registradas
                              </p>
                            </td>
                          </tr>
                        ) : (
                          ventas.map((venta) => (
                            <tr
                              key={venta.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(venta.created_at).toLocaleDateString(
                                  "es-AR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                {venta.productos?.nombre || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {venta.talle_vendido ? (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                                    {venta.talle_vendido}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900">
                                {venta.cantidad}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900">
                                ${venta.precio_unitario.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                ${(venta.total || 0).toFixed(2)}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-right font-semibold"
                                style={{
                                  color:
                                    (venta.ganancia || 0) >= 0
                                      ? "#16A34A"
                                      : "#DC2626",
                                }}
                              >
                                ${(venta.ganancia || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {venta.notas || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


          </>
        )}
      </div>

      {/* Modals */}
      {showProductoModal && (
        <ProductoModal
          producto={productoEdit}
          onClose={() => {
            setShowProductoModal(false);
            setProductoEdit(undefined);
          }}
          onSaved={loadData}
        />
      )}

      {showVentaModal && (
        <VentaModal
          productos={productos}
          onClose={() => setShowVentaModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
