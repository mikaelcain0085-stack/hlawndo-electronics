"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type OrderItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  stock?: number;
  quantity: number;
};

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  total: number;
  items: OrderItem[] | string | null;
  status: string | null;
  cancellation_reason: string | null;
  created_at: string;
};

const ADMIN_LOGIN_KEY = "hlawndo-admin-logged-in";

export default function OrdersPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);

  const formatDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getOrderItems = (items: OrderItem[] | string | null): OrderItem[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case "Confirmed":
        return "border-blue-400/30 bg-blue-400/10 text-blue-300";
      case "Processing":
        return "border-purple-400/30 bg-purple-400/10 text-purple-300";
      case "Shipped":
        return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
      case "Delivered":
        return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
      case "Cancelled":
        return "border-red-400/30 bg-red-400/10 text-red-300";
      default:
        return "border-[#e9a33f]/30 bg-[#e9a33f]/10 text-[#ffd078]";
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load orders error:", error);
        setMessage(`Could not load orders: ${error.message}`);
        return;
      }

      const loadedOrders = (data || []) as Order[];
      setOrders(loadedOrders);

      setSelectedStatuses((current) => {
        const updated = { ...current };
        loadedOrders.forEach((order) => {
          if (!updated[order.id]) updated[order.id] = order.status || "Pending";
        });
        return updated;
      });
    } catch (error) {
      console.error("Unexpected order loading error:", error);
      setMessage("Something went wrong while loading orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const verifyAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        sessionStorage.removeItem(ADMIN_LOGIN_KEY);
        router.replace("/admin-login");
        return;
      }

      const userEmail = session.user.email.toLowerCase();

      const { data, error } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();

      if (error || !data) {
        await supabase.auth.signOut();
        sessionStorage.removeItem(ADMIN_LOGIN_KEY);
        router.replace("/admin-login");
        return;
      }

      setIsAuthorized(true);
      loadOrders();
    };

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/admin-login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const updateOrderStatus = async (orderId: number) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      setMessage("Could not find the selected order.");
      return;
    }

    const currentStatus = order.status || "Pending";
    const newStatus = selectedStatuses[orderId] || currentStatus;

    if (newStatus === currentStatus) {
      setMessage("Please select a different status before updating.");
      window.setTimeout(() => setMessage(""), 3000);
      return;
    }

    setUpdatingOrderId(orderId);
    setMessage("Updating order status...");

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select();

      if (error) {
        console.error("Order status update error:", error);
        setMessage(`Could not update order: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setMessage("Order status could not be updated.");
        return;
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === orderId ? { ...item, status: newStatus } : item
        )
      );

      setSelectedStatuses((current) => ({
        ...current,
        [orderId]: newStatus,
      }));

      setMessage(`Order #${orderId} successfully updated to ${newStatus}.`);
      window.setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Unexpected order update error:", error);
      setMessage(
        error instanceof Error
          ? `Something went wrong: ${error.message}`
          : "Something went wrong while updating the order."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const deleteOrder = async (order: Order) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Order #${order.id}?\n\nCustomer: ${order.customer_name}\nTotal: ${formatPrice(order.total)}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingOrderId(order.id);
    setMessage(`Deleting Order #${order.id}...`);

    try {
      const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id)
        .select();

      if (error) {
        console.error("Order delete error:", error);
        setMessage(`Could not delete order: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setMessage(
          "Order could not be deleted. Please check your Supabase permissions."
        );
        return;
      }

      setOrders((current) =>
        current.filter((item) => item.id !== order.id)
      );

      setSelectedStatuses((current) => {
        const updated = { ...current };
        delete updated[order.id];
        return updated;
      });

      setMessage(`Order #${order.id} has been permanently deleted.`);
      window.setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Unexpected order delete error:", error);
      setMessage(
        error instanceof Error
          ? `Something went wrong: ${error.message}`
          : "Something went wrong while deleting the order."
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    sessionStorage.removeItem(ADMIN_LOGIN_KEY);
    router.replace("/admin-login");
  };

  if (!isAuthorized) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#162231] text-gray-400">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9a33f]/10 blur-[140px]" />
        <div className="relative flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />
          <p className="mt-5 text-sm tracking-wide">
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05080d] px-4 py-6 text-white sm:px-6 md:px-10 md:py-10">
      <div className="pointer-events-none absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full bg-[#e9a33f]/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-[-10%] top-[25%] h-[450px] w-[450px] rounded-full bg-amber-500/5 blur-[160px]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e9a33f]/30 bg-[#e9a33f]/10 text-xl">
                  ⚡
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.35em] text-[#e9a33f] sm:text-xs">
                    HLAWNDO ELECTRONICS
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    ADMINISTRATIVE CONTROL CENTER
                  </p>
                </div>
              </div>

              <h1 className="mt-8 text-3xl font-medium tracking-tight sm:text-5xl md:text-4xl">
                Customer{" "}
                <span className="bg-gradient-to-r from-[#ffd078] via-[#e9a33f] to-[#b96b19] bg-clip-text text-transparent">
                  Orders
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
                Review customer purchases, delivery details and keep every order updated.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-gray-300 transition hover:-translate-y-0.5 hover:border-[#e9a33f]/50 hover:bg-[#e9a33f]/10 hover:text-[#ffd078]"
              >
                ↑ Back to Dashboard
              </button>

              <a
                href="/"
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-gray-300 transition hover:-translate-y-0.5 hover:border-[#e9a33f]/50 hover:bg-[#e9a33f]/10 hover:text-[#ffd078]"
              >
                ← View Store
              </a>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm font-medium text-red-400 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                    Logging out...
                  </span>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </header>

        {message && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[#e9a33f]/20 bg-[#e9a33f]/10 px-4 py-3 text-sm text-[#ffd078] shadow-[0_10px_40px_rgba(233,163,63,0.08)] backdrop-blur-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9a33f]/15">
              ✦
            </span>
            <span>{message}</span>
          </div>
        )}

        <section>
          <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-normal tracking-[0.25em] text-orange-600">
                CUSTOMER MANAGEMENT
              </p>
              <h2 className="mt-4 text-1xl font-medium sm:text-1xl">
                Customer{" "}
                <span className="bg-gradient-to-r from-[#ffd078] to-[#e9a33f] bg-clip-text text-transparent">
                  Orders
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadOrders}
                disabled={ordersLoading}
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-5 py-3.5 text-sm text-gray-300 transition hover:border-[#e9a33f]/50 hover:text-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ordersLoading ? "Refreshing..." : "↻ Refresh Orders"}
              </button>

              <div className="rounded-2xl border border-[#e9a33f]/20 bg-[#e9a33f]/5 px-5 py-3.5 text-sm font-bold text-[#ffd078]">
                {orders.length} Orders
              </div>
            </div>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b1018] py-24">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />
              <p className="mt-5 text-sm text-gray-500">
                Loading customer orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-[#0b1018] py-24 text-center">
              <div className="text-3xl">🛒</div>
              <h3 className="mt-6 text-4xl font-medium">No orders yet</h3>
              <p className="mt-3 text-sm text-gray-500">
                Customer orders will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => {
                const orderItems = getOrderItems(order.items);
                const currentStatus = order.status || "Pending";

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1018]/90 shadow-2xl transition duration-300 hover:border-white/15"
                  >
                    <div className="flex flex-col justify-between gap-6 border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-4 md:flex-row md:items-center md:p-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-[#e9a33f]/10 px-3 font-medium text-[#ffd078]">
                            #{order.id}
                          </div>
                          <span
                            className={`rounded-full border px-4 py-2 text-xs font-medium ${getStatusStyle(
                              currentStatus
                            )}`}
                          >
                            {currentStatus}
                          </span>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#e9a33f]/15 bg-[#e9a33f]/5 px-6 py-4 md:text-right">
                        <p className="text-[10px] font-medium tracking-[0.2em] text-gray-500">
                          ORDER TOTAL
                        </p>
                        <p className="mt-2 text-3xl font-medium text-[#ffd078]">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[0.85fr_1.35fr]">
                      <div>
                        <p className="text-xs font-medium tracking-[0.22em] text-[#e9a33f]">
                          CUSTOMER DETAILS
                        </p>

                        <div className="mt-5 divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-[#070b11]">
                          <div className="p-4">
                            <p className="text-[10px] tracking-[0.15em] text-gray-500">
                              CUSTOMER NAME
                            </p>
                            <p className="mt-2 text-sm font-medium">
                              {order.customer_name}
                            </p>
                          </div>

                          <div className="p-5">
                            <p className="text-[10px] tracking-[0.15em] text-gray-500">
                              PHONE NUMBER
                            </p>
                            <a
                              href={`tel:${order.phone}`}
                              className="mt-2 block font-medium text-[#ffd078] transition hover:text-white"
                            >
                              {order.phone}
                            </a>
                          </div>

                          <div className="p-5">
                            <p className="text-[10px] tracking-[0.15em] text-gray-500">
                              DELIVERY ADDRESS
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-gray-300">
                              {order.address}
                            </p>
                          </div>

                          <div className="p-5">
                            <p className="text-[10px] tracking-[0.15em] text-gray-500">
                              PAYMENT METHOD
                            </p>
                            <p className="mt-2 font-medium text-[#ffd078]">
                              {order.payment_method}
                            </p>
                          </div>
                        </div>

                        {currentStatus === "Cancelled" && (
                          <div className="mt-6 overflow-hidden rounded-3xl border border-red-500/25 bg-red-500/[0.06]">
                            <div className="flex items-center gap-3 border-b border-red-500/15 px-4 py-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-lg">
                                ❌
                              </div>
                              <div>
                                <p className="text-[10px] font-bold tracking-[0.18em] text-red-400">
                                  ORDER CANCELLED
                                </p>
                                <p className="mt-1 text-xs text-red-300/60">
                                  Customer cancellation information
                                </p>
                              </div>
                            </div>
                            <div className="p-5">
                              <p className="text-[10px] font-medium tracking-[0.15em] text-gray-500">
                                CANCELLATION REASON
                              </p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                                {order.cancellation_reason?.trim()
                                  ? order.cancellation_reason
                                  : "No cancellation reason was provided by the customer."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-normal tracking-[0.22em] text-[#e9a33f]">
                          ORDERED ITEMS
                        </p>

                        <div className="mt-4 space-y-3">
                          {orderItems.length === 0 ? (
                            <div className="rounded-3xl border border-white/10 bg-[#070b11] p-6 text-sm text-gray-500">
                              Could not display the ordered items.
                            </div>
                          ) : (
                            orderItems.map((item, index) => (
                              <div
                                key={`${order.id}-${item.id}-${index}`}
                                className="group flex gap-4 rounded-3xl border border-white/10 bg-[#070b11] p-4 transition hover:border-white/20"
                              >
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.03] p-2">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-contain transition duration-300 group-hover:scale-110"
                                    />
                                  ) : (
                                    <span className="text-4xl">📦</span>
                                  )}
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col justify-center">
                                  <p className="text-[10px] font-medium tracking-[0.16em] text-gray-500">
                                    {item.category}
                                  </p>
                                  <h3 className="mt-2 text-lg font-medium">
                                    {item.name}
                                  </h3>
                                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-lg font-medium text-[#ffd078]">
                                      {formatPrice(item.price)}
                                    </p>
                                    <p className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300">
                                      Qty:{" "}
                                      <span className="font-bold text-white">
                                        {item.quantity}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 bg-[#070b11]/80 p-4 md:p-5">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                        <div>
                          <p className="text-[10px] font-medium tracking-[0.22em] text-gray-500">
                            ORDER STATUS
                          </p>
                          <p className="mt-2 text-sm font-medium">
                            Current status:{" "}
                            <span className="text-[#ffd078]">
                              {currentStatus}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <select
                            value={
                              selectedStatuses[order.id] ?? currentStatus
                            }
                            disabled={
                              updatingOrderId === order.id ||
                              deletingOrderId === order.id
                            }
                            onChange={(event) =>
                              setSelectedStatuses((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            className="rounded-2xl border border-white/10 bg-[#0b1018] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-[#e9a33f]/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          <button
                            type="button"
                            disabled={
                              updatingOrderId === order.id ||
                              deletingOrderId === order.id ||
                              (selectedStatuses[order.id] ?? currentStatus) ===
                                currentStatus
                            }
                            onClick={() => updateOrderStatus(order.id)}
                            className="rounded-2xl bg-gradient-to-r from-[#d88729] via-[#e9a33f] to-[#ffd078] px-5 py-3 text-sm font-black text-black shadow-[0_10px_30px_rgba(233,163,63,0.15)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingOrderId === order.id
                              ? "Updating..."
                              : "Update Order →"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingOrderId === order.id ||
                              updatingOrderId === order.id
                            }
                            onClick={() => deleteOrder(order)}
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-7 py-4 text-sm font-bold text-red-400 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingOrderId === order.id
                              ? "Deleting..."
                              : "🗑 Delete Order"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-24 border-t border-white/10 py-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-[#e9a33f]">⚡</span>
              HLAWNDO ELECTRONICS
            </div>
            <p className="text-xs text-gray-600">
              Premium e-commerce management system. @ 2024 All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
