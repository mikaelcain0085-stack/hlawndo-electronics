"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

type OrderItem = {
  id: number;
  name: string;
  category?: string;
  price: number;
  image?: string;
  quantity: number;
  subtotal?: number;
};

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  total: number;
  items: OrderItem[] | string;
  status: string;
  cancellation_reason?: string | null;
  created_at: string;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [showCancelBox, setShowCancelBox] =
    useState(false);

  const [cancellationReason, setCancellationReason] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* =========================
     LOAD ORDER FROM SUPABASE
  ========================== */

  const loadOrder = async (
    orderId: number,
    customerPhone: string,
    showLoading = false
  ) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq(
            "phone",
            customerPhone.trim()
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Order search error:",
          error
        );

        setMessage(
          `Could not find your order: ${error.message}`
        );

        return null;
      }

      if (!data) {
        return null;
      }

      setOrder(data);

      return data;
    } catch (error) {
      console.error(
        "Unexpected order error:",
        error
      );

      setMessage(
        error instanceof Error
          ? `Something went wrong: ${error.message}`
          : "Something went wrong while loading your order."
      );

      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /* =========================
     FIND ORDER
  ========================== */

  const findOrder = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setOrder(null);
    setShowCancelBox(false);
    setCancellationReason("");

    if (
      !orderNumber.trim() ||
      !phone.trim()
    ) {
      setMessage(
        "Please enter your order number and phone number."
      );

      return;
    }

    const orderId =
      Number(orderNumber);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      setMessage(
        "Please enter a valid order number."
      );

      return;
    }

    const foundOrder =
      await loadOrder(
        orderId,
        phone,
        true
      );

    if (!foundOrder) {
      setMessage(
        "No order was found with that order number and phone number. Please check and try again."
      );
    }
  };

  /* =========================
     REFRESH ORDER STATUS
  ========================== */

  const refreshOrder = async () => {
    if (!order) return;

    setRefreshing(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .eq("id", order.id)
          .eq(
            "phone",
            order.phone
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Refresh order error:",
          error
        );

        setMessage(
          `Could not refresh order: ${error.message}`
        );

        return;
      }

      if (!data) {
        setMessage(
          "Order could not be found."
        );

        return;
      }

      setOrder(data);

      setMessage(
        `Order status refreshed: ${data.status}`
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Unexpected refresh error:",
        error
      );

      setMessage(
        "Could not refresh your order."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================
     CANCEL ORDER
  ========================== */

  const cancelOrder = async () => {
    if (!order) return;

    if (!cancellationReason.trim()) {
      setMessage(
        "Please tell us why you want to cancel this order."
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );

    if (!confirmed) return;

    setCancelling(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .update({
            status: "Cancelled",
            cancellation_reason:
              cancellationReason.trim(),
          })
          .eq("id", order.id)
          .eq("phone", order.phone)
          .select()
          .single();

      if (error) {
        console.error(
          "Cancel order error:",
          error
        );

        setMessage(
          `Could not cancel your order: ${error.message}`
        );

        return;
      }

      if (data) {
        setOrder(data);
      }

      setShowCancelBox(false);

      setCancellationReason("");

      setMessage(
        "Your order has been cancelled successfully."
      );
    } catch (error) {
      console.error(
        "Unexpected cancellation error:",
        error
      );

      setMessage(
        "Something went wrong while cancelling your order."
      );
    } finally {
      setCancelling(false);
    }
  };

  /* =========================
     AUTOMATIC STATUS CHECK

     Checks Supabase every
     5 seconds while an order
     is open.
  ========================== */

  useEffect(() => {
    if (!order) return;

    const interval =
      setInterval(async () => {
        try {
          const { data, error } =
            await supabase
              .from("orders")
              .select("*")
              .eq(
                "id",
                order.id
              )
              .eq(
                "phone",
                order.phone
              )
              .maybeSingle();

          if (
            !error &&
            data
          ) {
            setOrder(data);
          }
        } catch (error) {
          console.error(
            "Automatic status refresh error:",
            error
          );
        }
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [
    order?.id,
    order?.phone,
  ]);

  /* =========================
     GET ORDER ITEMS
  ========================== */

  const getOrderItems = (
    items:
      | OrderItem[]
      | string
  ): OrderItem[] => {
    if (
      Array.isArray(items)
    ) {
      return items;
    }

    try {
      return JSON.parse(
        items
      );
    } catch {
      return [];
    }
  };

  /* =========================
     FORMAT PRICE
  ========================== */

  const formatPrice = (
    price: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(price)
    );
  };

  /* =========================
     FORMAT DATE
  ========================== */

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  /* =========================
     ORDER STATUSES
  ========================== */

  const statuses = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const getStatusIndex = (
    status: string
  ) => {
    return statuses.indexOf(
      status
    );
  };

  /* =========================
     STATUS STYLE
  ========================== */

  const getStatusStyle = (
    status: string
  ) => {
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

  return (
    <main className="min-h-screen bg-[#080d14] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>
            <p className="text-xs tracking-[0.3em] text-[#e9a33f]">
              HLAWNDO ELECTRONICS
            </p>

            <h1 className="mt-3 text-4xl font-normal md:text-3xl">
              Track Your{" "}

              <span className="text-[#e9a33f]">
                Order
              </span>
            </h1>

            <p className="mt-3 text-gray-400">
              Enter your order number and phone number to check your order status.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f]"
          >
            ← Back to Store
          </a>

        </div>

        {/* SEARCH FORM */}

        <section className="mt-10 rounded-3xl border border-white/10 bg-[#0d141d] p-6 shadow-2xl md:p-8">

          <form
            onSubmit={findOrder}
            className="grid gap-6"
          >

            <div className="grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Order Number
                </label>

                <input
                  type="number"
                  value={orderNumber}
                  onChange={(
                    event
                  ) =>
                    setOrderNumber(
                      event.target.value
                    )
                  }
                  placeholder="Example: 9"
                  min="1"
                  className="w-full rounded-xl border border-white/10 bg-[#080d14] px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(
                    event
                  ) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="Enter your phone number"
                  className="w-full rounded-xl border border-white/10 bg-[#080d14] px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#e9a33f] px-6 py-5 font-bold text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Searching..."
                : "Track My Order"}
            </button>

          </form>

          {message && (
            <div className="mt-6 rounded-xl border border-[#e9a33f]/20 bg-[#e9a33f]/10 px-5 py-4 text-sm text-[#ffd078]">
              {message}
            </div>
          )}

        </section>

        {/* ORDER RESULT */}

        {order && (() => {
          const orderItems =
            getOrderItems(
              order.items
            );

          const currentStatusIndex =
            getStatusIndex(
              order.status
            );

          const isCancelled =
            order.status ===
            "Cancelled";

          const canCancel =
            !isCancelled &&
            order.status !== "Shipped" &&
            order.status !== "Delivered";

          return (
            <section className="mt-10 space-y-8">

              {/* ORDER SUMMARY */}

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d141d] shadow-2xl">

                <div className="flex flex-col justify-between gap-5 border-b border-white/10 bg-[#111924] p-6 md:flex-row md:items-center">

                  <div>
                    <p className="text-xs tracking-[0.25em] text-gray-500">
                      ORDER DETAILS
                    </p>

                    <h2 className="mt-2 text-3xl font-normal">
                      Order #{order.id}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Placed on{" "}
                      {formatDate(
                        order.created_at
                      )}
                    </p>
                  </div>

                  <div className="text-left md:text-right">

                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    <p className="mt-4 text-3xl font-bold text-[#e9a33f]">
                      {formatPrice(
                        order.total
                      )}
                    </p>

                  </div>

                </div>

                <div className="p-6">

                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                    <p className="text-xs tracking-[0.25em] text-gray-500">
                      DELIVERY STATUS
                    </p>

                    <button
                      type="button"
                      onClick={
                        refreshOrder
                      }
                      disabled={
                        refreshing
                      }
                      className="rounded-xl border border-[#e9a33f]/40 px-4 py-2 text-sm font-normal text-[#e9a33f] transition hover:bg-[#e9a33f] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {refreshing
                        ? "Refreshing..."
                        : "↻ Refresh Status"}
                    </button>

                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Status automatically checks for updates every 5 seconds.
                  </p>

                  {/* CUSTOMER CANCELLATION */}

                  {canCancel && (

                    <div className="mt-6">

                      {!showCancelBox ? (

                        <button
                          type="button"
                          onClick={() => {
                            setShowCancelBox(true);
                            setMessage("");
                          }}
                          className="rounded-xl border border-red-400/40 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500 hover:text-white"
                        >
                          Cancel This Order
                        </button>

                      ) : (

                        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5">

                          <h3 className="text-lg font-medium text-red-300">
                            Cancel Your Order
                          </h3>

                          <p className="mt-2 text-sm text-red-200/70">
                            Please tell us why you would like to cancel this order.
                          </p>

                          <textarea
                            value={
                              cancellationReason
                            }
                            onChange={(
                              event
                            ) =>
                              setCancellationReason(
                                event.target.value
                              )
                            }
                            placeholder="Example: I ordered the wrong product..."
                            rows={4}
                            className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-red-400"
                          />

                          <div className="mt-4 flex flex-wrap gap-3">

                            <button
                              type="button"
                              onClick={
                                cancelOrder
                              }
                              disabled={
                                cancelling
                              }
                              className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cancelling
                                ? "Cancelling..."
                                : "Confirm Cancellation"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setShowCancelBox(
                                  false
                                );

                                setCancellationReason(
                                  ""
                                );

                                setMessage(
                                  ""
                                );
                              }}
                              disabled={
                                cancelling
                              }
                              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:border-white/30"
                            >
                              Keep My Order
                            </button>

                          </div>

                        </div>

                      )}

                    </div>

                  )}

                  {/* CANCELLED */}

                  {isCancelled ? (

                    <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-center">

                      <div className="text-5xl">
                        ❌
                      </div>

                      <h3 className="mt-4 text-xl font-bold text-red-300">
                        This Order Has Been Cancelled
                      </h3>

                      <p className="mt-2 text-sm text-red-200/70">
                        Please contact Hlawndo Electronics if you have any questions about this order.
                      </p>

                      {order.cancellation_reason && (

                        <div className="mt-5 rounded-xl border border-red-400/20 bg-[#080d14]/60 p-4 text-left">

                          <p className="text-xs tracking-[0.15em] text-red-300/70">
                            CANCELLATION REASON
                          </p>

                          <p className="mt-2 text-sm leading-relaxed text-gray-300">
                            {
                              order.cancellation_reason
                            }
                          </p>

                        </div>

                      )}

                    </div>

                  ) : (

                    <div className="mt-8">

                      <div className="grid gap-6 md:grid-cols-5">

                        {statuses.map(
                          (
                            status,
                            index
                          ) => {
                            const isCompleted =
                              currentStatusIndex >=
                              index;

                            const isCurrent =
                              order.status ===
                              status;

                            return (
                              <div
                                key={
                                  status
                                }
                                className="relative flex flex-col items-center text-center"
                              >

                                <div
                                  className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl font-normal ${
                                    isCompleted
                                      ? "border-[#e9a33f] bg-[#e9a33f] text-black"
                                      : "border-white/10 bg-[#080d14] text-gray-600"
                                  }`}
                                >
                                  {isCompleted
                                    ? "✓"
                                    : index + 1}
                                </div>

                                <p
                                  className={`mt-3 text-sm font-normal ${
                                    isCurrent
                                      ? "text-[#e9a33f]"
                                      : isCompleted
                                      ? "text-white"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {status}
                                </p>

                                {isCurrent && (
                                  <p className="mt-1 text-xs text-[#ffd078]">
                                    Current Status
                                  </p>
                                )}

                              </div>
                            );
                          }
                        )}

                      </div>

                    </div>

                  )}

                </div>

              </div>

              {/* DELIVERY DETAILS */}

              <div className="rounded-3xl border border-white/10 bg-[#0d141d] p-6 md:p-8">

                <p className="text-xs tracking-[0.25em] text-gray-500">
                  DELIVERY DETAILS
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">

                  <div>
                    <p className="text-xs text-gray-500">
                      CUSTOMER NAME
                    </p>

                    <p className="mt-2 font-medium">
                      {order.customer_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      PHONE NUMBER
                    </p>

                    <p className="mt-2 font-medium text-[#e9a33f]">
                      {order.phone}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">
                      DELIVERY ADDRESS
                    </p>

                    <p className="mt-2 leading-relaxed text-gray-200">
                      {order.address}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      PAYMENT METHOD
                    </p>

                    <p className="mt-2 font-semibold text-[#e9a33f]">
                      {order.payment_method}
                    </p>
                  </div>

                </div>

              </div>

              {/* ORDER ITEMS */}

              <div className="rounded-3xl border border-white/10 bg-[#0d141d] p-6 md:p-8">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <p className="text-xs tracking-[0.25em] text-gray-500">
                      ORDER SUMMARY
                    </p>

                    <h2 className="mt-2 text-xl font-medium">
                      Your Items
                    </h2>
                  </div>

                  <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#e9a33f]">
                    {orderItems.length} Items
                  </div>

                </div>

                <div className="mt-8 space-y-4">

                  {orderItems.length ===
                  0 ? (

                    <div className="rounded-2xl border border-white/10 bg-[#080d14] p-5 text-sm text-gray-500">
                      Could not display the ordered items.
                    </div>

                  ) : (

                    orderItems.map(
                      (item) => (

                        <div
                          key={`${order.id}-${item.id}`}
                          className="flex gap-5 rounded-2xl border border-white/10 bg-[#080d14] p-4"
                        >

                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#111924]">

                            {item.image ? (

                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.name
                                }
                                className="h-full w-full object-contain p-2"
                              />

                            ) : (

                              <span className="text-3xl">
                                📦
                              </span>

                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-xs tracking-[0.15em] text-gray-500">
                              {item.category ||
                                "PRODUCT"}
                            </p>

                            <h3 className="mt-1 text-xs font-medium">
                              {item.name}
                            </h3>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">

                              <p className="font-medium text-[#e9a33f]">
                                {formatPrice(
                                  item.price
                                )}
                              </p>

                              <p className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                                Quantity:{" "}
                                {item.quantity}
                              </p>

                            </div>

                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

              {/* TRACK ANOTHER ORDER */}

              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setOrderNumber("");
                  setPhone("");
                  setMessage("");
                  setShowCancelBox(false);
                  setCancellationReason("");

                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  });
                }}
                className="w-full rounded-xl border border-white/10 bg-[#0d141d] px-6 py-5 font-medium text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f]"
              >
                Track Another Order
              </button>

            </section>
          );
        })()}

      </div>
    </main>
  );
}