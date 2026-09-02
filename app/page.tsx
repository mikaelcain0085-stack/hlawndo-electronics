"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import ChatWidget from "./components/ChatWidget";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
};

type CartItem = Product & {
  quantity: number;
};

const categories = [
  {
    key: "laptops",
    icon: "💻",
    items: "LAPTOPS",
    title: "Laptops & Computers",
    glow: "bg-[#e9a33f]/10",
    iconStyle: "border-[#e9a33f]/20 bg-[#e9a33f]/10",
  },
  {
    key: "smartphones",
    icon: "📱",
    items: "SMARTPHONES",
    title: "Smartphones & Accessories",
    glow: "bg-blue-500/10",
    iconStyle: "border-blue-400/20 bg-blue-400/10",
  },
  {
    key: "audio",
    icon: "🎧",
    items: "AUDIO",
    title: "Audio & Headphones",
    glow: "bg-purple-500/10",
    iconStyle: "border-purple-400/20 bg-purple-400/10",
  },
  {
    key: "tv",
    icon: "📺",
    items: "TELEVISIONS",
    title: "Smart TVs",
    glow: "bg-cyan-500/10",
    iconStyle: "border-cyan-400/20 bg-cyan-400/10",
  },
  {
    key: "chargers",
    icon: "🔌",
    items: "CHARGERS & CABLES",
    title: "Charger & Data Cables",
    glow: "bg-red-500/10",
    iconStyle: "border-red-400/20 bg-red-400/10",
  },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [activeCategory, setActiveCategory] = useState("all");

  // PRODUCT SEARCH
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  const [isPlacingOrder, setIsPlacingOrder] =
    useState(false);

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [orderId, setOrderId] =
    useState<number | null>(null);

  const [checkoutError, setCheckoutError] =
    useState("");

  const [showQrPayment, setShowQrPayment] =
    useState(false);
    const [qrPaymentAmount, setQrPaymentAmount] =
  useState<number | null>(null);

  /*
    ENQUIRY FORM STATE
  */

  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryAddress, setEnquiryAddress] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");

  const [isSubmittingEnquiry, setIsSubmittingEnquiry] =
    useState(false);

  const [enquirySuccess, setEnquirySuccess] =
    useState(false);

  const [enquiryError, setEnquiryError] =
    useState("");

  const submitEnquiry = async () => {
    setEnquiryError("");
    setEnquirySuccess(false);

    if (!enquiryName.trim()) {
      setEnquiryError("Please enter your full name.");
      return;
    }

    if (!enquiryPhone.trim()) {
      setEnquiryError("Please enter your phone number.");
      return;
    }

    if (!enquiryAddress.trim()) {
      setEnquiryError("Please enter your address.");
      return;
    }

    if (!enquiryMessage.trim()) {
      setEnquiryError("Please enter your enquiry.");
      return;
    }

    setIsSubmittingEnquiry(true);

    try {
      const { error: enquiryInsertError } = await supabase
        .from("enquiries")
        .insert([
          {
            full_name: enquiryName.trim(),
            phone: enquiryPhone.trim(),
            address: enquiryAddress.trim(),
            message: enquiryMessage.trim(),
          },
        ]);

      if (enquiryInsertError) {
        console.error(
          "Supabase enquiry error:",
          JSON.stringify(enquiryInsertError, null, 2)
        );

        setEnquiryError(
          "Something went wrong submitting your enquiry. Please try again."
        );

        return;
      }

      setEnquirySuccess(true);
      setEnquiryName("");
      setEnquiryPhone("");
      setEnquiryAddress("");
      setEnquiryMessage("");
    } catch (err) {
      console.error("Enquiry submit error:", err);
      setEnquiryError(
        "Something went wrong submitting your enquiry. Please try again."
      );
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  /*
    LOAD PRODUCTS FROM SUPABASE
  */

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(
        "Could not load products:",
        error
      );
    } else {
      setProducts(data || []);
    }

    setIsLoaded(true);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /*
    CATEGORY MATCHING FUNCTION
  */

  const productMatchesCategory = (
    product: Product,
    category: string
  ) => {
    const productCategory =
      product.category.toLowerCase();

    const productName =
      product.name.toLowerCase();

    if (category === "all") {
      return true;
    }

    if (category === "laptops") {
      return (
        productCategory.includes("laptop") ||
        productCategory.includes("computer") ||
        productCategory.includes("desktop") ||
        productName.includes("laptop") ||
        productName.includes("macbook") ||
        productName.includes("computer")
      );
    }

    if (category === "smartphones") {
      return (
        productCategory.includes("phone") ||
        productCategory.includes("smartphone") ||
        productCategory.includes("mobile") ||
        productName.includes("iphone") ||
        productName.includes("samsung") ||
        productName.includes("phone")
      );
    }

    if (category === "audio") {
      return (
        productCategory.includes("audio") ||
        productCategory.includes("headphone") ||
        productCategory.includes("earphone") ||
        productCategory.includes("speaker") ||
        productName.includes("headphone") ||
        productName.includes("earphone") ||
        productName.includes("speaker")
      );
    }

    if (category === "tv") {
      return (
        productCategory.includes("tv") ||
        productCategory.includes("television") ||
        productCategory.includes("smart tv") ||
        productName.includes("tv")
      );
    }

    if (category === "chargers") {
      return (
        productCategory.includes("charger") ||
        productCategory.includes("cable") ||
        productCategory.includes("data") ||
        productName.includes("charger") ||
        productName.includes("cable") ||
        productName.includes("data cable")
      );
    }

    return true;
  };

  /*
    FILTER PRODUCTS BY CATEGORY + SEARCH
  */

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        productMatchesCategory(
          product,
          activeCategory
        );

      const searchText =
        searchQuery
          .trim()
          .toLowerCase();

      const matchesSearch =
        searchText === "" ||
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.category
          .toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    products,
    activeCategory,
    searchQuery,
  ]);

  /*
    CATEGORY FILTER + SCROLL
  */

  const selectCategory = (
    category: string
  ) => {
    setActiveCategory(category);

    setSearchQuery("");

    setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  /*
    PRODUCT SEARCH
  */

  const handleSearch = (
    value: string
  ) => {
    setSearchQuery(value);

    setActiveCategory("all");

    setTimeout(() => {
      document
        .getElementById("products")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  /*
    CART COUNT
  */

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [cart]
  );

  /*
    CART TOTAL
  */

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          item.price * item.quantity,
        0
      ),
    [cart]
  );

  /*
    FORMAT PRICE
  */

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
    ).format(price);
  };

  /*
    SCROLL TO PRODUCTS
  */

  const scrollToProducts = () => {
    setActiveCategory("all");
    setSearchQuery("");

    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  /*
    ADD TO CART
  */

  const addToCart = (
    product: Product
  ) => {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) =>
            item.id === product.id
        );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.stock
                ),
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setIsCartOpen(true);
  };

  /*
    UPDATE CART QUANTITY
  */

  const updateQuantity = (
    productId: number,
    change: number
  ) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (
            item.id !== productId
          ) {
            return item;
          }

          const newQuantity =
            Math.min(
              Math.max(
                item.quantity +
                  change,
                0
              ),
              item.stock
            );

          return {
            ...item,
            quantity:
              newQuantity,
          };
        })
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  /*
    REMOVE FROM CART
  */

  const removeFromCart = (
    productId: number
  ) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== productId
      )
    );
  };

  /*
    OPEN CHECKOUT
  */

  const openCheckout = () => {
    if (cart.length === 0) return;

    setCheckoutError("");
    setOrderSuccess(false);

    setIsCartOpen(false);

    setIsCheckoutOpen(true);
  };

  /*
    PLACE ORDER
  */

  const placeOrder = async () => {
    setCheckoutError("");

    if (!customerName.trim()) {
      setCheckoutError(
        "Please enter your full name."
      );
      return;
    }

    if (!phone.trim()) {
      setCheckoutError(
        "Please enter your phone number."
      );
      return;
    }

    if (!address.trim()) {
      setCheckoutError(
        "Please enter your delivery address."
      );
      return;
    }

    if (cart.length === 0) {
      setCheckoutError(
        "Your cart is empty."
      );
      return;
    }

    setIsPlacingOrder(true);

    try {
      const productIds =
        cart.map(
          (item) => item.id
        );

      const {
        data: latestProducts,
        error: stockCheckError,
      } = await supabase
        .from("products")
        .select("id, name, stock")
        .in("id", productIds);

      if (stockCheckError) {
        console.error(
          "Stock check error:",
          stockCheckError
        );

        setCheckoutError(
          "Could not verify product stock. Please try again."
        );

        return;
      }

      for (
        const cartItem of cart
      ) {
        const latestProduct =
          latestProducts?.find(
            (product) =>
              product.id ===
              cartItem.id
          );

        if (!latestProduct) {
          setCheckoutError(
            `${cartItem.name} is no longer available.`
          );
          return;
        }

        if (
          latestProduct.stock <
          cartItem.quantity
        ) {
          setCheckoutError(
            `Sorry, ${cartItem.name} does not have enough stock available anymore.`
          );

          await loadProducts();

          return;
        }
      }

      const orderItems =
        cart.map((item) => ({
          id: item.id,
          name: item.name,
          category:
            item.category,
          price: item.price,
          quantity:
            item.quantity,
          subtotal:
            item.price *
            item.quantity,
        }));

      const {
        data: placeOrderResult,
        error: orderError,
      } = await supabase.rpc(
        "place_order",
        {
          p_customer_name:
            customerName.trim(),
          p_phone: phone.trim(),
          p_address: address.trim(),
          p_payment_method:
            paymentMethod,
          p_total: cartTotal,
          p_items: orderItems,
        }
      );

      if (orderError) {
        console.error(
          "Supabase order error:",
          JSON.stringify(
            orderError,
            null,
            2
          )
        );

        setCheckoutError(
          orderError.message ||
            "Could not place your order. Please try again."
        );

        return;
      }

      const newOrderId =
        Array.isArray(placeOrderResult) &&
        placeOrderResult.length > 0
          ? placeOrderResult[0].id
          : null;

      if (!newOrderId) {
        setCheckoutError(
          "Could not place your order. Please try again."
        );

        return;
      }

      await loadProducts();

      setOrderId(newOrderId);
      setQrPaymentAmount(cartTotal);

      setCart([]);

      if (paymentMethod === "Google Pay / UPI") {
        setShowQrPayment(true);
      } else {
        setOrderSuccess(true);
      }

      setCustomerName("");
      setPhone("");
      setAddress("");

      setPaymentMethod(
        "Cash on Delivery"
      );
    } catch (error) {
      console.error(
        "Unexpected checkout error:",
        error
      );

      setCheckoutError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };
  
   // UPI QR PAYMENT

  const upiId = "sangteahlondo-1@okhdfcbank";

  const paymentAmount = qrPaymentAmount ?? 0;

  const upiPaymentUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent("HLAWNDO ELECTRONICS")}` +
    `&am=${paymentAmount.toFixed(2)}` +
    `&cu=INR` +
    (orderId
      ? `&tn=${encodeURIComponent(`Order #${orderId}`)}`
      : "");

  const qrCodeUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      upiPaymentUrl
    )}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#080d14] text-white">

      <style jsx>{`
        .hero-background {
          position: absolute;
          inset: -5%;
          z-index: 0;

          background-image:
            linear-gradient(
              90deg,
              rgba(2, 12, 11, 0.82) 0%,
              rgba(4, 25, 21, 0.5) 45%,
              rgba(3, 12, 14, 0.62) 100%
            ),
            url("/images/electronics-bg.jpeg");

          background-size: cover;
          background-position: center;

          transform: scale(1.08);

          animation: heroZoom 9s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @keyframes heroZoom {
          from {
            transform: scale(1.08);
          }

          to {
            transform: scale(1);
          }
        }

        .hero-content-enter {
          opacity: 0;
          transform: translateY(80px);

          animation:
            heroContentEnter
            1.4s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .hero-card-enter {
          opacity: 0;
          transform: translateY(100px);

          animation:
            heroCardEnter
            1.5s
            cubic-bezier(0.16, 1, 0.3, 1)
            0.25s
            forwards;
        }

        @keyframes heroContentEnter {
          from {
            opacity: 0;
            transform: translateY(80px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroCardEnter {
          from {
            opacity: 0;
            transform: translateY(100px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .glass-card {
          background:
            rgba(8, 16, 22, 0.7);

          border:
            1px solid
            rgba(255, 255, 255, 0.12);

          backdrop-filter:
            blur(20px);

          -webkit-backdrop-filter:
            blur(20px);

          box-shadow:
            0 30px 80px
              rgba(0, 0, 0, 0.55),
            inset 0 1px 0
              rgba(255, 255, 255, 0.05);
        }

        .bazaar-gradient {
          background:
            linear-gradient(
              110deg,
              #6b4212 0%,
              #a9691d 12%,
              #e6a443 24%,
              #ffd987 36%,
              rgba(255, 215, 130, 0.25)
                45%,
              rgba(255, 255, 255, 0.03)
                50%,
              rgba(255, 255, 255, 0.01)
                55%,
              rgba(255, 210, 120, 0.2)
                60%,
              #b46f1e 70%,
              #f0b452 82%,
              #7b4b13 100%
            );

          background-size:
            350% 100%;

          -webkit-background-clip:
            text;

          background-clip:
            text;

          -webkit-text-fill-color:
            transparent;

          animation:
            rocketGold
            5s
            linear
            infinite;
        }

        @keyframes rocketGold {
          0% {
            background-position:
              150% center;
          }

          100% {
            background-position:
              -150% center;
          }
        }

        .grid-glow {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.025)
                1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.025)
                1px,
              transparent 1px
            );

          background-size:
            60px 60px;

          mask-image:
            linear-gradient(
              to bottom,
              transparent,
              black,
              transparent
            );
        }

        .hero-title {
          text-shadow:
            0 15px 60px
            rgba(0, 0, 0, 0.7);
        }
      `}</style>

      {/* HERO */}

      <section
        id="home"
        className="relative min-h-screen overflow-hidden"
      >
        <div className="hero-background" />

        <div className="grid-glow pointer-events-none absolute inset-0 z-[1] opacity-40" />

        <header className="relative z-20 flex items-center justify-between border-b border-white/10 px-5 py-5 md:px-10 lg:px-14">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center text-xl text-[#e9a33f]">
              ✦
            </div>

            <div className="text-base font-medium tracking-tight sm:text-lg md:text-2xl">
              HLAWNDO{" "}

              <span className="text-[#e9a33f]">
                ELECTRONICS
              </span>

            </div>

          </div>

          <nav className="hidden items-center gap-8 text-sm text-gray-300 lg:flex">

            <a
              href="#home"
              className="transition hover:text-[#e9a33f]"
            >
              Home
            </a>

            <a
              href="#products"
              className="transition hover:text-[#e9a33f]"
            >
              Products
            </a>

            <a
              href="#deals"
              className="transition hover:text-[#e9a33f]"
            >
              Deals
            </a>

            <a
              href="#support"
              className="transition hover:text-[#e9a33f]"
            >
              Support
            </a>

          </nav>

          <div className="flex items-center gap-3 sm:gap-5">

            <button
              onClick={() =>
                setIsCartOpen(true)
              }
              className="relative text-gray-300 transition hover:text-[#e9a33f]"
              aria-label="Open shopping cart"
            >
              🛒

              {cartCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#e9a33f] text-[10px] font-bold text-black">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 sm:gap-3">

              <a
                href="/track-order"
                className="rounded-full border border-white/15 px-3 py-2 text-xs text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f] sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">
                  Track Order
                </span>

                <span className="sm:hidden">
                  📦
                </span>
              </a>

              <a
                href="/admin"
                className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f] sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:block">
                  Admin Login
                </span>

                <span>👤</span>
              </a>

            </div>

          </div>

        </header>

        {/* PRODUCT SEARCH */}

        <div className="relative z-10 flex justify-end px-5 pt-7 md:px-14">

          {!isSearchOpen ? (

            <button
              onClick={() =>
                setIsSearchOpen(true)
              }
              className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-3 text-[10px] font-thin tracking-[0.18em] text-gray-200 backdrop-blur-xl transition hover:border-[#e9a33f] hover:text-[#e9a33f] sm:text-xs"
            >

              <span className="text-base">
                🔍
              </span>

              SEARCH PRODUCTS

            </button>

          ) : (

            <div className="flex items-center gap-2 rounded-full border border-[#e9a33f]/50 bg-black/70 px-3 py-2 backdrop-blur-xl">

              <span className="pl-2">
                🔍
              </span>

              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  handleSearch(
                    event.target.value
                  )
                }
                placeholder="Search products..."
                className="w-40 bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-gray-500 sm:w-56"
              />

              {searchQuery && (

                <button
                  onClick={() =>
                    setSearchQuery("")
                  }
                  className="text-gray-400 transition hover:text-[#e9a33f]"
                >
                  ✕
                </button>

              )}

              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm transition hover:bg-red-500/20 hover:text-red-400"
                aria-label="Close search"
              >
                ×
              </button>

            </div>

          )}

        </div>

        <div className="relative z-10 mx-auto grid min-h-[720px] max-w-[1550px] items-center gap-12 px-6 pb-20 pt-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-14">

          <div className="hero-content-enter">

            <p className="mb-20 text-[10px] font-normal tracking-[0.3em] text-gray-300 sm:text-xs md:mb-28">
              EST. 2024 · AIZAWL
            </p>

            <div className="hero-title">

              <div className="flex flex-wrap items-end gap-x-3">

                <span className="mb-2 text-4xl font-thin italic text-gray-100 sm:text-5xl md:text-6xl">
                  rawn
                </span>

                <span className="bazaar-gradient text-[4.6rem] font-semibold leading-none tracking-[-0.07em] sm:text-[7rem] md:text-[9rem] lg:text-[10rem]">
                  BAZAAR
                </span>

              </div>

              <h2 className="mt-4 text-5xl font-thin leading-none tracking-tight text-gray-100 sm:text-6xl md:text-7xl lg:text-6xl">
                RAWH LE
              </h2>

            </div>

            <p className="mt-16 text-center text-[10px] tracking-[0.3em] text-gray-400 sm:text-xs">
              SCROLL TO EXPLORE
            </p>

          </div>

          <div className="glass-card hero-card-enter mx-auto w-full max-w-[480px] rounded-[30px] p-7 sm:p-10">

            <p className="text-lg leading-relaxed text-gray-100 sm:text-1xs">
              Electronic bungrua quality tha leh belchian dawl —
              <br className="hidden sm:block" />
              darkar 48 chungin kan deliver thei e.
            </p>

            <div className="my-8 h-px bg-white/10" />

            <div className="grid grid-cols-3 gap-3">

              <div>
                <p className="text-[9px] tracking-[0.15em] text-gray-400 sm:text-[10px]">
                  PRODUCTS
                </p>

                <p className="mt-2 text-xl font-bold text-[#e9a33f] sm:text-2xl">
                  {products.length}+
                </p>
              </div>

              <div>
                <p className="text-[9px] leading-tight tracking-[0.15em] text-gray-400 sm:text-[10px]">
                  HAPPY
                  <br />
                  CUSTOMERS
                </p>

                <p className="mt-2 text-xl font-bold text-[#e9a33f] sm:text-2xl">
                  1K+
                </p>
              </div>

              <div>
                <p className="text-[9px] tracking-[0.15em] text-gray-400 sm:text-[10px]">
                  WARRANTY
                </p>

                <p className="mt-2 text-xl font-bold text-[#e9a33f] sm:text-2xl">
                  1 Yr
                </p>
              </div>

            </div>

            <button
              onClick={scrollToProducts}
              className="mt-10 flex w-full items-center justify-between rounded-2xl bg-[#eba441] px-6 py-5 font-semibold text-[#191107] transition duration-300 hover:bg-[#ffd078]"
            >
              <span>
                Shop All Products
              </span>

              <span className="text-2xl">
                →
              </span>
            </button>

          </div>

        </div>

      </section>

      {/* CATEGORY SECTION */}

      <section className="border-t border-white/10 bg-[#080d14] px-6 py-24 md:px-14">

        <div className="mx-auto max-w-[1400px]">

          <p className="text-xs tracking-[0.3em] text-gray-500">
            EXPLORE OUR STORE
          </p>

          <h2 className="mt-5 text-5xl font-medium tracking-tight sm:text-6xl md:text-5xl">
            Shop by{" "}

            <span className="bazaar-gradient">
              Category
            </span>
          </h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {categories.map(
              (category) => (

                <button
                  key={category.key}
                  onClick={() =>
                    selectCategory(
                      category.key
                    )
                  }
                  className={`group relative min-h-[300px] overflow-hidden rounded-3xl border bg-gradient-to-br from-[#151d27] via-[#101720] to-[#080d14] p-8 text-left transition duration-500 hover:-translate-y-2 hover:border-[#e9a33f]/60 hover:shadow-[0_25px_70px_rgba(233,163,63,0.18)] ${
                    activeCategory ===
                    category.key
                      ? "border-[#e9a33f]"
                      : "border-white/10"
                  }`}
                >

                  <div
                    className={`absolute -right-10 -top-10 h-44 w-44 rounded-full ${category.glow} blur-3xl transition duration-500 group-hover:scale-150`}
                  />

                  <div className="relative flex min-h-[235px] flex-col justify-between">

                    <div>

                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${category.iconStyle} text-4xl transition duration-500 group-hover:scale-110`}
                      >
                        {category.icon}
                      </div>

                      <p className="mt-10 text-xs tracking-[0.25em] text-slate-400">
                        {category.items}
                      </p>

                      <h3 className="mt-3 text-2xl font-normal tracking-tight transition duration-300 group-hover:text-[#e9a33f]">
                        {category.title}
                      </h3>

                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-5 text-sm font-medium text-[#e9a33f]">

                      <span>
                        Explore category
                      </span>

                      <span className="text-xl transition duration-300 group-hover:translate-x-2">
                        →
                      </span>

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        </div>

      </section>

      {/* PRODUCTS */}

      <section
        id="products"
        className="border-t border-white/10 bg-[#060a0f] px-6 py-24 md:px-14"
      >

        <div className="mx-auto max-w-[1400px]">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-xs tracking-[0.3em] text-gray-500">
                FEATURED PRODUCTS
              </p>

              <h2 className="mt-5 text-5xl font-medium tracking-tight sm:text-5xl">
                Latest{" "}

                <span className="bazaar-gradient">
                  Products
                </span>
              </h2>

              <div className="mt-8 flex flex-wrap gap-3">

                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setSearchQuery("");
                  }}
                  className={`rounded-full border px-5 py-2 text-sm transition ${
                    activeCategory === "all" &&
                    !searchQuery
                      ? "border-[#e9a33f] bg-[#e9a33f] text-black"
                      : "border-white/10 text-gray-300 hover:border-[#e9a33f]"
                  }`}
                >
                  All Products
                </button>

                {categories.map(
                  (category) => (

                    <button
                      key={category.key}
                      onClick={() => {
                        setActiveCategory(
                          category.key
                        );
                        setSearchQuery("");
                      }}
                      className={`rounded-full border px-5 py-2 text-sm transition ${
                        activeCategory ===
                        category.key
                          ? "border-[#e9a33f] bg-[#e9a33f] text-black"
                          : "border-white/10 text-gray-300 hover:border-[#e9a33f]"
                      }`}
                    >
                      {category.icon}{" "}
                      {category.title}
                    </button>

                  )
                )}

              </div>

            </div>

            <button
              onClick={() =>
                setIsCartOpen(true)
              }
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f]"
            >
              View Cart ({cartCount})
            </button>

          </div>

          {/* PRODUCT COUNT + SEARCH RESULT */}

          <div className="mt-10">

            <p className="text-sm text-gray-500">

              Showing{" "}

              <span className="text-[#e9a33f]">
                {filteredProducts.length}
              </span>{" "}

              {filteredProducts.length === 1
                ? "product"
                : "products"}

              {searchQuery && (
                <>
                  {" "}for{" "}

                  <span className="text-white">
                    "{searchQuery}"
                  </span>
                </>
              )}

            </p>

            {searchQuery && (

              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="mt-3 text-xs text-[#e9a33f] transition hover:text-[#ffd078]"
              >
                Clear search ×
              </button>

            )}

          </div>

          {!isLoaded ? (

            <div className="mt-16 text-center text-gray-500">
              Loading products...
            </div>

          ) : products.length === 0 ? (

            <div className="mt-16 rounded-3xl border border-white/10 bg-[#0b1119] p-16 text-center">

              <div className="text-6xl">
                📦
              </div>

              <h3 className="mt-6 text-2xl font-normal">
                No products available
              </h3>

              <p className="mt-3 text-gray-500">
                Add products from the admin console.
              </p>

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="mt-16 rounded-3xl border border-white/10 bg-[#0b1119] p-16 text-center">

              <div className="text-6xl">
                🔍
              </div>

              <h3 className="mt-6 text-2xl font-normal">
                No products found
              </h3>

              <p className="mt-3 text-gray-500">
                Try searching for a different product.
              </p>

              <button
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="mt-8 rounded-xl bg-[#e9a33f] px-6 py-4 font-bold text-black transition hover:bg-[#ffd078]"
              >
                View All Products
              </button>

            </div>

          ) : (

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {filteredProducts.map(
                (product) => (

                  <div
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0b1119] transition duration-500 hover:-translate-y-2 hover:border-[#e9a33f]/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                  >

                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#151d27] to-[#080d14]">

                      {product.image ? (

                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
                        />

                      ) : (

                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-950 text-7xl">
                          📦
                        </div>

                      )}

                      {product.stock <= 0 && (

                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">

                          <span className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold">
                            OUT OF STOCK
                          </span>

                        </div>

                      )}

                    </div>

                    <div className="p-7">

                      <div className="flex items-center justify-between gap-3">

                        <span className="text-xs tracking-[0.2em] text-gray-500">
                          {product.category.toUpperCase()}
                        </span>

                        <span
                          className={`text-xs ${
                            product.stock > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {product.stock > 0
                            ? `${product.stock} IN STOCK`
                            : "OUT OF STOCK"}
                        </span>

                      </div>

                      <h3 className="mt-4 text-xl font-normal">
                        {product.name}
                      </h3>

                      <div className="mt-7 flex items-center justify-between gap-4">

                        <p className="text-2xl font-bold text-[#e9a33f]">
                          {formatPrice(
                            product.price
                          )}
                        </p>

                        <button
                          disabled={
                            product.stock <= 0
                          }
                          onClick={() =>
                            addToCart(
                              product
                            )
                          }
                          className="rounded-xl bg-[#e9a33f] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {product.stock > 0
                            ? "Add to Cart"
                            : "Sold Out"}
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </section>

      {/* CART */}

      {isCartOpen && (

        <div className="fixed inset-0 z-50">

          <button
            onClick={() =>
              setIsCartOpen(false)
            }
            className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
            aria-label="Close cart"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0b1119] shadow-2xl">

            <div className="flex items-center justify-between border-b border-white/10 p-6">

              <div>

                <p className="text-xs tracking-[0.25em] text-gray-500">
                  YOUR ORDER
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Shopping Cart
                </h2>

              </div>

              <button
                onClick={() =>
                  setIsCartOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f]"
              >
                ×
              </button>

            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {cart.length === 0 ? (

                <div className="flex h-full flex-col items-center justify-center text-center">

                  <div className="text-7xl">
                    🛒
                  </div>

                  <h3 className="mt-6 text-2xl font-bold">
                    Your cart is empty
                  </h3>

                  <p className="mt-3 text-sm text-gray-400">
                    Add some products and they will appear here.
                  </p>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      scrollToProducts();
                    }}
                    className="mt-8 rounded-xl bg-[#e9a33f] px-6 py-4 font-bold text-black"
                  >
                    Continue Shopping
                  </button>

                </div>

              ) : (

                <div className="space-y-5">

                  {cart.map(
                    (item) => (

                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >

                        <div className="flex gap-4">

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#151d27]">

                            {item.image ? (

                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain p-1"
                              />

                            ) : (

                              <div className="flex h-full w-full items-center justify-center text-3xl">
                                📦
                              </div>

                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div>

                                <p className="text-xs text-gray-500">
                                  {item.category}
                                </p>

                                <h3 className="mt-1 font-bold">
                                  {item.name}
                                </h3>

                              </div>

                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.id
                                  )
                                }
                                className="text-gray-500 transition hover:text-red-400"
                              >
                                ✕
                              </button>

                            </div>

                            <div className="mt-4 flex items-center justify-between">

                              <p className="font-bold text-[#e9a33f]">
                                {formatPrice(
                                  item.price
                                )}
                              </p>

                              <div className="flex items-center rounded-xl border border-white/10">

                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      -1
                                    )
                                  }
                                  className="px-3 py-2 text-lg text-gray-300 transition hover:text-[#e9a33f]"
                                >
                                  −
                                </button>

                                <span className="min-w-8 text-center text-sm font-bold">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      1
                                    )
                                  }
                                  className="px-3 py-2 text-lg text-gray-300 transition hover:text-[#e9a33f]"
                                >
                                  +
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {cart.length > 0 && (

              <div className="border-t border-white/10 bg-[#080d14] p-6">

                <div className="flex items-center justify-between">

                  <span className="text-gray-400">
                    Total
                  </span>

                  <span className="text-3xl font-bold text-[#e9a33f]">
                    {formatPrice(
                      cartTotal
                    )}
                  </span>

                </div>

                <button
                  onClick={openCheckout}
                  className="mt-6 flex w-full items-center justify-between rounded-2xl bg-[#e9a33f] px-6 py-5 font-bold text-black transition hover:bg-[#ffd078]"
                >

                  <span>
                    Proceed to Checkout
                  </span>

                  <span className="text-2xl">
                    →
                  </span>

                </button>

              </div>

            )}

          </aside>

        </div>

      )}

      {/* CHECKOUT */}

      {isCheckoutOpen && (

        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#060a0f]">

          <div className="mx-auto min-h-screen max-w-6xl px-5 py-8 md:px-10 md:py-12">

            <div className="mb-10 flex items-center justify-between">

              <div>

                <p className="text-xs tracking-[0.3em] text-gray-500">
                  COMPLETE YOUR ORDER
                </p>

                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Secure{" "}

                  <span className="bazaar-gradient">
                    Checkout
                  </span>
                </h2>

              </div>

              {!orderSuccess && !showQrPayment && (

                <button
                  onClick={() =>
                    setIsCheckoutOpen(false)
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-2xl text-gray-300 transition hover:border-[#e9a33f] hover:text-[#e9a33f]"
                  aria-label="Close checkout"
                >
                  ×
                </button>

              )}

            </div>

            {showQrPayment ? (

              <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-[#e9a33f]/30 bg-[#0b1119] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:p-12">

                <p className="text-xs tracking-[0.3em] text-[#e9a33f]">
                  SCAN TO PAY
                </p>

                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Pay with Google Pay
                </h2>

                <p className="mx-auto mt-4 max-w-md leading-relaxed text-gray-400">
                  Scan the QR code below using Google Pay or any
                  UPI app to complete your payment.
                </p>

                {orderId && (

                  <div className="mx-auto mt-6 w-fit rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">

                    <p className="text-xs tracking-[0.2em] text-gray-500">
                      ORDER NUMBER
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#e9a33f]">
                      #{orderId}
                    </p>

                  </div>

                )}

                <div className="mx-auto mt-8 flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-4">

                  <img
  src={qrCodeUrl}
  alt="UPI Payment QR Code"
  className="h-full w-full object-contain"
/>
                </div>

                <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-gray-500">
                  After completing the payment, tap the button
                  below to finish your order.
                </p>

                <button
                  onClick={() => {
                    setShowQrPayment(false);
                    setOrderSuccess(true);
                  }}
                  className="mt-8 w-full rounded-2xl bg-[#e9a33f] px-6 py-5 font-bold text-black transition hover:bg-[#ffd078]"
                >
                  I&apos;ve Paid — Confirm
                </button>

              </div>

            ) : orderSuccess ? (

              <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-[#e9a33f]/30 bg-[#0b1119] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.5)] sm:p-12">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-5xl text-emerald-400">
                  ✓
                </div>

                <p className="mt-8 text-xs tracking-[0.3em] text-emerald-400">
                  ORDER SUCCESSFUL
                </p>

                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Thank You for Your Order!
                </h2>

                <p className="mx-auto mt-5 max-w-md leading-relaxed text-gray-400">
                  Your order has been received successfully.
                  We will contact you using the phone number
                  you provided to confirm your order and delivery.
                </p>

                {orderId && (

                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                    <p className="text-xs tracking-[0.2em] text-gray-500">
                      ORDER NUMBER
                    </p>

                    <p className="mt-2 text-3xl font-bold text-[#e9a33f]">
                      #{orderId}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-400">
                      Please save or remember this Order ID for future reference and order tracking.
                   </p>

                  </div>

                )}

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setOrderSuccess(false);
                    setOrderId(null);
                  }}
                  className="mt-8 w-full rounded-2xl bg-[#e9a33f] px-6 py-5 font-bold text-black transition hover:bg-[#ffd078]"
                >
                  Continue Shopping
                </button>

              </div>

            ) : (

              <div className="grid gap-8 lg:grid-cols-2">

                <div className="min-w-0 rounded-3xl border border-white/10 bg-[#0b1119] p-6 sm:p-8">

                  <h3 className="text-2xl font-bold">
                    Delivery Details
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Please enter your information for order
                    confirmation and delivery.
                  </p>

                  <div className="mt-8 space-y-6">

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={customerName}
                        onChange={(event) =>
                          setCustomerName(
                            event.target.value
                          )
                        }
                        placeholder="Enter your full name"
                        className="w-full rounded-xl border border-white/10 bg-[#080d14] px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]"
                      />

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value
                          )
                        }
                        placeholder="Enter your phone number"
                        className="w-full rounded-xl border border-white/10 bg-[#080d14] px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]"
                      />

                    </div>

                    <div>

                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Delivery Address
                      </label>

                      <textarea
                        value={address}
                        onChange={(event) =>
                          setAddress(
                            event.target.value
                          )
                        }
                        placeholder="Enter your complete delivery address"
                        rows={5}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#080d14] px-5 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]"
                      />

                    </div>

                    <div>

                      <label className="mb-4 block text-sm font-medium text-gray-300">
                        Payment Method
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            setPaymentMethod(
                              "Cash on Delivery"
                            )
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            paymentMethod ===
                            "Cash on Delivery"
                              ? "border-[#e9a33f] bg-[#e9a33f]/10"
                              : "border-white/10 bg-[#080d14] hover:border-white/30"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <span className="text-3xl">
                              💵
                            </span>

                            <div>

                              <p className="font-bold">
                                Cash on Delivery
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Pay when your order arrives
                              </p>

                            </div>

                          </div>

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPaymentMethod(
                              "Google Pay / UPI"
                            )
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            paymentMethod ===
                            "Google Pay / UPI"
                              ? "border-[#e9a33f] bg-[#e9a33f]/10"
                              : "border-white/10 bg-[#080d14] hover:border-white/30"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <span className="text-3xl">
                              📱
                            </span>

                            <div>

                              <p className="font-bold">
                                Google Pay / UPI
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Online payment
                              </p>

                            </div>

                          </div>

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

                <div className="h-fit min-w-0 rounded-3xl border border-white/10 bg-[#0b1119] p-6 sm:p-8 lg:sticky lg:top-8">

                  <p className="text-xs tracking-[0.25em] text-gray-500">
                    YOUR ORDER
                  </p>

                  <h3 className="mt-3 text-2xl font-bold">
                    Order Summary
                  </h3>

                  <div className="my-7 h-px bg-white/10" />

                  <div className="space-y-5">

                    {cart.map(
                      (item) => (

                        <div
                          key={item.id}
                          className="flex gap-4"
                        >

                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#151d27]">

                            {item.image ? (

                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain p-1"
                              />

                            ) : (

                              <span className="text-2xl">
                                📦
                              </span>

                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <h4 className="truncate font-bold">
                              {item.name}
                            </h4>

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity:{" "}
                              {item.quantity}
                            </p>

                            <p className="mt-2 font-bold text-[#e9a33f]">
                              {formatPrice(
                                item.price *
                                  item.quantity
                              )}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                  <div className="my-7 h-px bg-white/10" />

                  <div className="flex items-center justify-between">

                    <span className="text-gray-400">
                      Total
                    </span>

                    <span className="text-3xl font-bold text-[#e9a33f]">
                      {formatPrice(
                        cartTotal
                      )}
                    </span>

                  </div>

                  {checkoutError && (

                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                      {checkoutError}
                    </div>

                  )}

                  <button
                    onClick={placeOrder}
                    disabled={isPlacingOrder}
                    className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e9a33f] px-6 py-5 font-bold text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {isPlacingOrder ? (

                      <>

                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />

                        Placing Order...

                      </>

                    ) : (

                      <>

                        Place Order

                        <span className="text-xl">
                          →
                        </span>

                      </>

                    )}

                  </button>

                  <p className="mt-5 text-center text-xs leading-relaxed text-gray-600">
                    By placing your order, you agree to be
                    contacted for order confirmation and delivery.
                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

      {/* DEALS */}

      <section
        id="deals"
        className="border-t border-white/10 bg-[#080d14] px-6 py-20 text-center"
      >

        <p className="text-xs tracking-[0.3em] text-gray-500">
          SPECIAL OFFERS
        </p>

        <h2 className="mt-5 text-xl font-medium sm:text-xl">
          Bungrua rawn thleng thar a awm leh zel dawn e.Harsatna i neih chuan a hnuaia Enquiry Form atang hian i harsatna minlo hrilh in, i mamawh min lo zawt ang che.
        </h2>

      </section>

      {/* ENQUIRY FORM */}

      <section
        id="enquiry"
        className="border-t border-white/10 bg-[#080d14] px-6 py-20"
      >
        <div className="mx-auto max-w-xl">

          <div className="text-center">
            <p className="text-xs tracking-[0.3em] text-[#e9a33f]">
              GET IN TOUCH
            </p>

            <h2 className="mt-4 text-3xl font-bold text-white">
              Send us an{" "}
              <span className="text-[#e9a33f]">Enquiry</span>
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              Have a question about a product or need something
              special? Fill this out and we&apos;ll get back to you.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#0d141d] p-7 shadow-2xl md:p-10">

            {enquirySuccess && (
              <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                Thanks! Your enquiry has been sent — we&apos;ll be in touch soon.
              </div>
            )}

            {enquiryError && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {enquiryError}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitEnquiry();
              }}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={enquiryName}
                  onChange={(event) => {
                    setEnquiryName(event.target.value);
                    setEnquiryError("");
                  }}
                  placeholder="Enter your full name"
                  disabled={isSubmittingEnquiry}
                  className="w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={enquiryPhone}
                  onChange={(event) => {
                    setEnquiryPhone(event.target.value);
                    setEnquiryError("");
                  }}
                  placeholder="Enter your phone number"
                  disabled={isSubmittingEnquiry}
                  className="w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Address
                </label>
                <input
                  type="text"
                  value={enquiryAddress}
                  onChange={(event) => {
                    setEnquiryAddress(event.target.value);
                    setEnquiryError("");
                  }}
                  placeholder="Enter your address"
                  disabled={isSubmittingEnquiry}
                  className="w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Enquiry
                </label>
                <textarea
                  value={enquiryMessage}
                  onChange={(event) => {
                    setEnquiryMessage(event.target.value);
                    setEnquiryError("");
                  }}
                  placeholder="Type your enquiry here"
                  rows={5}
                  disabled={isSubmittingEnquiry}
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEnquiry}
                className="w-full rounded-xl bg-[#e9a33f] px-6 py-4 font-bold text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingEnquiry ? "Sending..." : "Submit Enquiry"}
              </button>
            </form>

          </div>

        </div>
      </section>

      {/* FOOTER */}

      <footer
        id="support"
        className="border-t border-white/10 bg-[#060a0f] px-6 py-16 text-center text-gray-500"
      >
        © 2024 Hlawndo Electronics. All rights reserved.
        <br />
        Admin: 9089993697 / 6909917041
      </footer>

      <ChatWidget />

    </main>
  );
}
