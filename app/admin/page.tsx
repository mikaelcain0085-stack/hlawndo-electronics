"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

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

type Enquiry = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  message: string;
  created_at: string;
};

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  image: "",
};

const ADMIN_LOGIN_KEY = "hlawndo-admin-logged-in";

export default function AdminPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] =
    useState(false);
  const [isLoggingOut, setIsLoggingOut] =
  useState(false);  

  const [products, setProducts] =
    useState<Product[]>([]);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [activeCategory, setActiveCategory] =
    useState("all");
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

 if (category === "Laptops") {
    return (
      productCategory.includes("laptop") ||
      productCategory.includes("computer") ||
      productCategory.includes("desktop") ||
      productName.includes("laptop") ||
      productName.includes("macbook") ||
      productName.includes("computer")
    );
  }

 if (category === "Smartphones") {
  const isOtherCategory =
    productCategory.includes("tv") ||
    productCategory.includes("television") ||
    productCategory.includes("audio") ||
    productCategory.includes("headphone") ||
    productCategory.includes("earphone") ||
    productCategory.includes("speaker") ||
    productCategory.includes("charger") ||
    productCategory.includes("cable");

  if (isOtherCategory) {
    return false;
  }

  return (
    productCategory.includes("phone") ||
    productCategory.includes("smartphone") ||
    productCategory.includes("mobile") ||
    productCategory.includes("accessor") ||
    productName.includes("iphone") ||
    productName.includes("samsung") ||
    productName.includes("phone") ||
    productName.includes("mobile")
  );
}
  if (category === "Audio") {
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

  if (category === "TV") {
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

  return false;
};

const filteredProducts = useMemo(() => {
  return products.filter((product) =>
    productMatchesCategory(
      product,
      activeCategory
    )
  );
}, [products, activeCategory]);

  const [form, setForm] =
    useState(emptyForm);

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [showProductForm, setShowProductForm] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [compressionInfo, setCompressionInfo] =
    useState<{
      originalKB: number;
      compressedKB: number | null;
      status: "compressing" | "ready" | "uploaded";
    } | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [ordersLoading, setOrdersLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  const [deletingOrderId, setDeletingOrderId] =
    useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] =
  useState<number | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<number, string>>({});

  const PRODUCTS_PER_PAGE = 12;

  const [currentProductPage, setCurrentProductPage] =
  useState(1);

  const [isChangingProductPage, setIsChangingProductPage] =
  useState(false);

  const [enquiries, setEnquiries] =
    useState<Enquiry[]>([]);

  const [enquiriesLoading, setEnquiriesLoading] =
    useState(true);

  const [deletingEnquiryId, setDeletingEnquiryId] =
    useState<number | null>(null);

  /*
  ========================================
  LOAD PRODUCTS
  ========================================
  */

  const loadProducts = async () => {
    setLoading(true);

    try {
      const { data, error } =
        await supabase
          .from("products")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Load products error:",
          error
        );

        setMessage(
          `Could not load products: ${error.message}`
        );

        return;
      }

      setProducts(
        (data || []) as Product[]
      );
    } catch (error) {
      console.error(
        "Unexpected product loading error:",
        error
      );

      setMessage(
        "Something went wrong while loading products."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ========================================
  LOAD ORDERS
  ========================================
  */

  const loadOrders = async () => {
    setOrdersLoading(true);

    try {
      const { data, error } =
        await supabase
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Load orders error:",
          error
        );

        setMessage(
          `Could not load orders: ${error.message}`
        );

        return;
      }

      const loadedOrders =
        (data || []) as Order[];

      setOrders(loadedOrders);

      setSelectedStatuses((current) => {
        const updated = {
          ...current,
        };

        loadedOrders.forEach((order) => {
          if (!updated[order.id]) {
            updated[order.id] =
              order.status || "Pending";
          }
        });

        return updated;
      });
    } catch (error) {
      console.error(
        "Unexpected order loading error:",
        error
      );

      setMessage(
        "Something went wrong while loading orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  /*
  ========================================
  LOAD ENQUIRIES
  ========================================
  */

  const loadEnquiries = async () => {
    setEnquiriesLoading(true);

    try {
      const { data, error } =
        await supabase
          .from("enquiries")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Load enquiries error:",
          error
        );

        setMessage(
          `Could not load enquiries: ${error.message}`
        );

        return;
      }

      setEnquiries((data || []) as Enquiry[]);
    } catch (error) {
      console.error(
        "Unexpected enquiry loading error:",
        error
      );

      setMessage(
        "Something went wrong while loading enquiries."
      );
    } finally {
      setEnquiriesLoading(false);
    }
  };

  /*
  ========================================
  DELETE ENQUIRY
  ========================================
  */

  const deleteEnquiry =
    async (enquiry: Enquiry) => {
      const confirmDelete =
        window.confirm(
          `Are you sure you want to permanently delete this enquiry from ${enquiry.full_name}?\n\nThis action cannot be undone.`
        );

      if (!confirmDelete) {
        return;
      }

      setDeletingEnquiryId(enquiry.id);

      setMessage(
        `Deleting enquiry from ${enquiry.full_name}...`
      );

      try {
        const { data, error } =
          await supabase
            .from("enquiries")
            .delete()
            .eq("id", enquiry.id)
            .select();

        if (error) {
          console.error(
            "Enquiry delete error:",
            error
          );

          setMessage(
            `Could not delete enquiry: ${error.message}`
          );

          return;
        }

        if (!data || data.length === 0) {
          setMessage(
            "Enquiry could not be deleted. Please check your Supabase permissions."
          );

          return;
        }

        setEnquiries((current) =>
          current.filter(
            (current_enquiry) =>
              current_enquiry.id !== enquiry.id
          )
        );

        setMessage(
          `Enquiry from ${enquiry.full_name} deleted.`
        );
      } catch (error) {
        console.error(
          "Unexpected enquiry delete error:",
          error
        );

        setMessage(
          "Something went wrong while deleting the enquiry."
        );
      } finally {
        setDeletingEnquiryId(null);
      }
    };

  /*
  ========================================
  CHECK ADMIN LOGIN
  ========================================
  */

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

      loadProducts();
      loadOrders();
      loadEnquiries();
    };

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/admin-login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /*
  ========================================
  DASHBOARD STATISTICS
  ========================================
  */

  const totalRevenue = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.status !== "Cancelled"
      )
      .reduce(
        (total, order) =>
          total + Number(order.total || 0),
        0
      );
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        (order.status || "Pending") ===
        "Pending"
    ).length;
  }, [orders]);

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 5
    ).length;
  }, [products]);

  const totalStock = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + Number(product.stock || 0),
      0
    );
  }, [products]);

  const totalProductPages = Math.ceil(
  filteredProducts.length / PRODUCTS_PER_PAGE
);

const paginatedProducts = useMemo(() => {
  const startIndex =
    (currentProductPage - 1) *
    PRODUCTS_PER_PAGE;

  return filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE
  );
}, [
  filteredProducts,
  currentProductPage,
]);

const changeProductPage = (page: number) => {
  if (
    page < 1 ||
    page > totalProductPages ||
    page === currentProductPage
  ) {
    return;
  }

  setIsChangingProductPage(true);

  setTimeout(() => {
    setCurrentProductPage(page);
    setIsChangingProductPage(false);

    document
      .getElementById("inventory")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, 350);
};
  /*
  ========================================
  HANDLE FORM CHANGES
  ========================================
  */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  ========================================
  IMAGE SELECTION
  ========================================
  */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setForm((current) => ({
      ...current,
      image: previewUrl,
    }));
  };

  /*
  ========================================
  UPLOAD IMAGE TO CLOUDINARY
  ========================================
  */

  const uploadImage = async (
    file: File
  ): Promise<string | null> => {
    try {
      const cloudName =
        process.env
          .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      const uploadPreset =
        process.env
          .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        setMessage(
          "Cloudinary is not configured. Please check your environment variables."
        );

        return null;
      }

      // Automatic browser-side image optimization.
      // Images larger than 600 KB are resized/compressed before
      // being sent to Cloudinary. No extra npm package is required.
      const MAX_BYTES = 600 * 1024;
      const MAX_DIMENSION = 1800;

      let uploadFile = file;

      setCompressionInfo({
        originalKB: Math.round(file.size / 1024),
        compressedKB: null,
        status: "compressing",
      });

      setMessage(
        `Compressing image... (${(
          file.size / 1024 / 1024
        ).toFixed(2)} MB)`
      );

      if (file.size > MAX_BYTES) {
        const objectUrl = URL.createObjectURL(file);

        try {
          const image = new Image();

          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () =>
              reject(
                new Error(
                  "Could not read the selected image."
                )
              );
            image.src = objectUrl;
          });

          let width = image.naturalWidth;
          let height = image.naturalHeight;

          // Keep the original aspect ratio while limiting the
          // longest side to 1800 pixels.
          if (
            width > MAX_DIMENSION ||
            height > MAX_DIMENSION
          ) {
            const scale =
              MAX_DIMENSION /
              Math.max(width, height);

            width = Math.max(
              1,
              Math.round(width * scale)
            );
            height = Math.max(
              1,
              Math.round(height * scale)
            );
          }

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error(
              "Your browser could not create an image canvas."
            );
          }

          const createWebpBlob = async (
            canvasWidth: number,
            canvasHeight: number,
            quality: number
          ): Promise<Blob> => {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            context.clearRect(
              0,
              0,
              canvasWidth,
              canvasHeight
            );

            context.drawImage(
              image,
              0,
              0,
              canvasWidth,
              canvasHeight
            );

            const blob = await new Promise<Blob | null>(
              (resolve) => {
                canvas.toBlob(
                  resolve,
                  "image/webp",
                  quality
                );
              }
            );

            if (!blob) {
              throw new Error(
                "Could not compress the selected image."
              );
            }

            return blob;
          };

          let quality = 0.85;
          let blob = await createWebpBlob(
            width,
            height,
            quality
          );

          // First reduce WebP quality until the file is below
          // the target size or we reach a reasonable lower limit.
          while (
            blob.size > MAX_BYTES &&
            quality > 0.35
          ) {
            quality = Math.max(
              0.35,
              quality - 0.05
            );

            blob = await createWebpBlob(
              width,
              height,
              quality
            );
          }

          // If quality reduction alone is not enough, gradually
          // reduce the dimensions as well.
          while (blob.size > MAX_BYTES) {
            const nextWidth = Math.max(
              640,
              Math.round(width * 0.85)
            );
            const nextHeight = Math.max(
              640,
              Math.round(height * 0.85)
            );

            if (
              nextWidth === width &&
              nextHeight === height
            ) {
              break;
            }

            width = nextWidth;
            height = nextHeight;

            blob = await createWebpBlob(
              width,
              height,
              quality
            );
          }

          uploadFile = new File(
            [blob],
            `${file.name.replace(/\.[^/.]+$/, "")}.webp`,
            {
              type: "image/webp",
              lastModified: Date.now(),
            }
          );

          setCompressionInfo({
            originalKB: Math.round(file.size / 1024),
            compressedKB: Math.round(uploadFile.size / 1024),
            status: "ready",
          });

          setMessage(
            `Image optimized: ${Math.round(
              file.size / 1024
            )} KB → ${Math.round(
              uploadFile.size / 1024
            )} KB. Uploading...`
          );
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } else {
        setCompressionInfo({
          originalKB: Math.round(file.size / 1024),
          compressedKB: Math.round(file.size / 1024),
          status: "ready",
        });

        setMessage(
          `Image is already ${Math.round(
            file.size / 1024
          )} KB. Uploading...`
        );
      }

      const formData = new FormData();

      formData.append("file", uploadFile);
      formData.append(
        "upload_preset",
        uploadPreset
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Image upload error:",
          data
        );

        setMessage(
          `Image upload failed: ${
            data?.error?.message ||
            "Unknown error"
          }`
        );

        return null;
      }

      setCompressionInfo((current) =>
        current
          ? { ...current, status: "uploaded" }
          : current
      );

      setMessage(
        `Image uploaded successfully (${Math.round(
          uploadFile.size / 1024
        )} KB).`
      );

      return data.secure_url as string;
    } catch (error) {
      console.error(
        "Unexpected upload error:",
        error
      );

      setMessage(
        error instanceof Error
          ? `Image upload failed: ${error.message}`
          : "Image upload failed."
      );

      return null;
    }
  };

  /*
  ========================================
  DELETE IMAGE FROM STORAGE
  ========================================
  */

  const deleteImageFromStorage =
    async (
      imageUrl: string
    ) => {
      if (!imageUrl) {
        return;
      }

      try {
        const marker = "/upload/";

        const index =
          imageUrl.indexOf(marker);

        if (index === -1) {
          // Not a Cloudinary URL — nothing to delete here
          return;
        }

        let publicPath =
          imageUrl.substring(
            index + marker.length
          );

        // Strip the version segment, e.g. v1234567890/
        publicPath =
          publicPath.replace(
            /^v\d+\//,
            ""
          );

        // Strip the file extension
        const publicId =
          publicPath.replace(
            /\.[^/.]+$/,
            ""
          );

        const response = await fetch(
          "/api/delete-image",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              publicId,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            "Image delete error:",
            await response.text()
          );
        }
      } catch (error) {
        console.error(
          "Could not delete image:",
          error
        );
      }
    };

  /*
  ========================================
  ADD OR UPDATE PRODUCT
  ========================================
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === "" ||
      form.stock === ""
    ) {
      setMessage(
        "Please fill in the product name, category, price and stock."
      );

      return;
    }

    if (
      !selectedImage &&
      !form.image
    ) {
      setMessage(
        "Please select a product image."
      );

      return;
    }

    setSaving(true);

    try {
      let imageUrl =
        form.image;

      if (selectedImage) {
        setMessage(
          "Uploading image..."
        );

        const uploadedImage =
          await uploadImage(
            selectedImage
          );

        if (!uploadedImage) {
          return;
        }

        imageUrl =
          uploadedImage;
      }

      if (editingId !== null) {
        const oldProduct =
          products.find(
            (product) =>
              product.id === editingId
          );

        setMessage(
          "Updating product..."
        );

        const { error } =
          await supabase
            .from("products")
            .update({
              name:
                form.name.trim(),

              category:
                form.category,

              price:
                Number(form.price),

              stock:
                Number(form.stock),

              image:
                imageUrl,
            })
            .eq(
              "id",
              editingId
            );

        if (error) {
          console.error(
            "Product update error:",
            error
          );

          setMessage(
            `Could not update product: ${error.message}`
          );

          return;
        }

        if (
          selectedImage &&
          oldProduct?.image &&
          oldProduct.image !== imageUrl
        ) {
          await deleteImageFromStorage(
            oldProduct.image
          );
        }

        setMessage(
          "Product updated successfully!"
        );
      } else {
        setMessage(
          "Saving product..."
        );

        const { error } =
          await supabase
            .from("products")
            .insert({
              name:
                form.name.trim(),

              category:
                form.category,

              price:
                Number(form.price),

              stock:
                Number(form.stock),

              image:
                imageUrl,
            });

        if (error) {
          console.error(
            "Product insert error:",
            error
          );

          setMessage(
            `Could not add product: ${error.message}`
          );

          return;
        }

        setMessage(
          "Product added successfully!"
        );
      }

      setForm(emptyForm);
      setSelectedImage(null);
      setEditingId(null);
      setShowProductForm(false);

      await loadProducts();

      window.setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Unexpected save error:",
        error
      );

      setMessage(
        error instanceof Error
          ? `Something went wrong: ${error.message}`
          : "Something went wrong while saving the product."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  ========================================
  EDIT PRODUCT
  ========================================
  */

  const editProduct = (
    product: Product
  ) => {
    setEditingId(
      product.id
    );

    setSelectedImage(null);

    setForm({
      name:
        product.name,

      category:
        product.category,

      price:
        String(product.price),

      stock:
        String(product.stock),

      image:
        product.image,
    });

    setShowProductForm(true);
  };

  /*
  ========================================
  DELETE PRODUCT
  ========================================
  */

  const deleteProduct =
    async (
      product: Product
    ) => {
      const confirmDelete =
        window.confirm(
          `Are you sure you want to delete "${product.name}"?`
        );

      if (!confirmDelete) {
  return;
}


setDeletingProductId(product.id);

setMessage(
  "Deleting product..."
);

      try {
        const { error } =
          await supabase
            .from("products")
            .delete()
            .eq(
              "id",
              product.id
            );

        if (error) {
          console.error(
            "Product delete error:",
            error
          );

          setMessage(
            `Could not delete product: ${error.message}`
          );

          return;
        }

        if (product.image) {
          await deleteImageFromStorage(
            product.image
          );
        }

        if (
          editingId === product.id
        ) {
          setEditingId(null);
          setForm(emptyForm);
          setSelectedImage(null);
          setShowProductForm(false);
        }

        await loadProducts();

        setMessage(
          "Product deleted."
        );

        window.setTimeout(() => {
          setMessage("");
        }, 3000);
            } catch (error) {
        console.error(
          "Unexpected delete error:",
          error
        );

        setMessage(
          "Something went wrong while deleting the product."
        );
      } finally {
        setDeletingProductId(null);
      }
    };

  /*
  ========================================
  CANCEL EDIT
  ========================================
  */

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedImage(null);
    setForm(emptyForm);
    setCompressionInfo(null);
    setMessage("");
    setShowProductForm(false);
  };

  /*
  ========================================
  REMOVE SELECTED IMAGE
  ========================================
  */

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setCompressionInfo(null);

    setForm((current) => ({
      ...current,
      image: "",
    }));
  };

  /*
  ========================================
  UPDATE ORDER STATUS
  ========================================
  */

  const updateOrderStatus =
    async (
      orderId: number
    ) => {
      const order =
        orders.find(
          (item) =>
            item.id === orderId
        );

      if (!order) {
        setMessage(
          "Could not find the selected order."
        );

        return;
      }

      const currentStatus =
        order.status || "Pending";

      const newStatus =
        selectedStatuses[orderId] ||
        currentStatus;

      if (
        newStatus === currentStatus
      ) {
        setMessage(
          "Please select a different status before updating."
        );

        window.setTimeout(() => {
          setMessage("");
        }, 3000);

        return;
      }

      setUpdatingOrderId(
        orderId
      );

      setMessage(
        "Updating order status..."
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from("orders")
          .update({
            status:
              newStatus,
          })
          .eq(
            "id",
            orderId
          )
          .select();

        if (error) {
          console.error(
            "Order status update error:",
            error
          );

          setMessage(
            `Could not update order: ${error.message}`
          );

          return;
        }

        if (
          !data ||
          data.length === 0
        ) {
          setMessage(
            "Order status could not be updated."
          );

          return;
        }

        setOrders(
          (currentOrders) =>
            currentOrders.map(
              (currentOrder) =>
                currentOrder.id ===
                orderId
                  ? {
                      ...currentOrder,
                      status:
                        newStatus,
                    }
                  : currentOrder
            )
        );

        setSelectedStatuses(
          (current) => ({
            ...current,
            [orderId]:
              newStatus,
          })
        );

        setMessage(
          `Order #${orderId} successfully updated to ${newStatus}.`
        );

        window.setTimeout(() => {
          setMessage("");
        }, 3000);
      } catch (error) {
        console.error(
          "Unexpected order update error:",
          error
        );

        setMessage(
          error instanceof Error
            ? `Something went wrong: ${error.message}`
            : "Something went wrong while updating the order."
        );
      } finally {
        setUpdatingOrderId(
          null
        );
      }
    };

  /*
  ========================================
  DELETE ORDER
  ========================================
  */

  const deleteOrder =
    async (
      order: Order
    ) => {
      const confirmDelete =
        window.confirm(
          `Are you sure you want to permanently delete Order #${order.id}?\n\nCustomer: ${order.customer_name}\nTotal: ${formatPrice(order.total)}\n\nThis action cannot be undone.`
        );

      if (!confirmDelete) {
        return;
      }

      setDeletingOrderId(
        order.id
      );

      setMessage(
        `Deleting Order #${order.id}...`
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from("orders")
          .delete()
          .eq(
            "id",
            order.id
          )
          .select();

        if (error) {
          console.error(
            "Order delete error:",
            error
          );

          setMessage(
            `Could not delete order: ${error.message}`
          );

          return;
        }

        if (
          !data ||
          data.length === 0
        ) {
          setMessage(
            "Order could not be deleted. Please check your Supabase permissions."
          );

          return;
        }

        setOrders(
          (currentOrders) =>
            currentOrders.filter(
              (currentOrder) =>
                currentOrder.id !==
                order.id
            )
        );

        setSelectedStatuses(
          (current) => {
            const updated = {
              ...current,
            };

            delete updated[order.id];

            return updated;
          }
        );

        setMessage(
          `Order #${order.id} has been permanently deleted.`
        );

        window.setTimeout(() => {
          setMessage("");
        }, 3000);
      } catch (error) {
        console.error(
          "Unexpected order delete error:",
          error
        );

        setMessage(
          error instanceof Error
            ? `Something went wrong: ${error.message}`
            : "Something went wrong while deleting the order."
        );
      } finally {
        setDeletingOrderId(
          null
        );
      }
    };

  /*
  ========================================
  FORMAT PRICE
  ========================================
  */

  const formatPrice = (
    price: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency:
          "INR",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(price) || 0
    );
  };

  /*
  ========================================
  FORMAT DATE
  ========================================
  */

  const formatDate = (
    date: string
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );
  };

  /*
  ========================================
  GET ORDER ITEMS
  ========================================
  */

  const getOrderItems = (
    items:
      | OrderItem[]
      | string
      | null
  ): OrderItem[] => {
    if (!items) {
      return [];
    }

    if (
      Array.isArray(items)
    ) {
      return items;
    }

    try {
      const parsedItems =
        JSON.parse(items);

      return Array.isArray(
        parsedItems
      )
        ? parsedItems
        : [];
    } catch {
      return [];
    }
  };

  /*
  ========================================
  ORDER STATUS COLOR
  ========================================
  */

  const getStatusStyle = (
    status: string | null
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

  /*
  ========================================
  LOGOUT
  ========================================
  */

  const handleLogout = async () => {
  setIsLoggingOut(true);

  await supabase.auth.signOut();

  sessionStorage.removeItem(
    ADMIN_LOGIN_KEY
  );

  router.replace(
    "/admin-login"
  );
};

  /*
  ========================================
  PREVENT ADMIN PAGE FLASH
  ========================================
  */

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
   <main className="admin-page relative flex min-h-screen flex-col bg-[#05080d] px-4 py-6 text-white sm:px-6 md:px-10 md:py-10">

      <div className="pointer-events-none absolute left-[-10%] top-[-5%] h-[500px] w-[500px] rounded-full bg-[#e9a33f]/10 blur-[150px]" />

      <div className="pointer-events-none absolute right-[-10%] top-[25%] h-[450px] w-[450px] rounded-full bg-amber-500/5 blur-[160px]" />

      <div className="pointer-events-none absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[180px]" />

   <div className="relative mx-auto w-full max-w-7xl">

        {/* HEADER */}

       <header
  id="dashboard"
  className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-2xl backdrop-blur-xl md:p-8"
>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e9a33f]/30 bg-[#e9a33f]/10 text-xl shadow-[0_0_30px_rgba(233,163,63,0.15)]">
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

              <h1 className="mt-8 text-2xl font-medium tracking-tight sm:text-5xl md:text-4xl">

                Admin{" "}

                <span className="bg-gradient-to-r from-[#ffd078] via-[#e9a33f] to-[#b96b19] bg-clip-text text-transparent">
                  Console
                </span>

              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
                Manage your products, inventory and customer orders from one powerful dashboard.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <a
                href="/"
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-gray-300 transition duration-300 hover:-translate-y-0.5 hover:border-[#e9a33f]/50 hover:bg-[#e9a33f]/10 hover:text-[#ffd078]"
              >
                ← View Store
              </a>

              <button
  type="button"
  onClick={handleLogout}
  disabled={isLoggingOut}
  className="rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-sm font-medium text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* MESSAGE */}

        {message && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-[#e9a33f]/20 bg-[#e9a33f]/10 px-4 py-3 text-sm text-[#ffd078] shadow-[0_10px_40px_rgba(233,163,63,0.08)] backdrop-blur-xl">

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9a33f]/15">
              ✦
            </span>

            <span>
              {message}
            </span>

          </div>
        )}

        {/* DASHBOARD STATS */}

       <section
  
  className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
>

          <a
  href="#inventory"
  className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#e9a33f]/30"
>

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium tracking-[0.15em] text-gray-500">
                  TOTAL PRODUCTS
                </p>

                <p className="mt-4 text-2xl font-medium">
                  {products.length}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9a33f]/10 text-2xl">
                📦
              </div>

            </div>

            <p className="mt-5 text-xs text-gray-500">
              {totalStock} total items in inventory
            </p>

          </a>

        <a
  href="/admin/orders"
  className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-400/30"
>
            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium tracking-[0.15em] text-gray-500">
                  TOTAL ORDERS
                </p>

                <p className="mt-4 text-2xl font-medium">
                  {orders.length}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-400/10 text-2xl">
                🛒
              </div>

            </div>

            <p className="mt-5 text-xs text-gray-500">
              All customer orders received
            </p>

          </a>

         <a
  href="/admin/orders"
  

className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#e9a33f]/30"
>
            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium tracking-[0.15em] text-gray-500">
                  PENDING ORDERS
                </p>

                <p className="mt-4 text-2xl font-medium text-[#e9a33f]">
                  {pendingOrders}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9a33f]/10 text-2xl">
                ⏳
              </div>

            </div>

            <p className="mt-5 text-xs text-gray-500">
              Orders waiting for action
            </p>

          </a>

         <a
  href="/admin/orders"
  className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30"
>

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium tracking-[0.15em] text-gray-500">
                  ORDER VALUE
                </p>

                <p className="mt-4 text-xl font-medium text-emerald-400 sm:text-3xl">
                  {formatPrice(totalRevenue)}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                💰
              </div>

            </div>

            <p className="mt-5 text-xs text-gray-500">
              Cancelled orders excluded
            </p>

          </a>

          <a
           href="/admin/enquiries"
            className="group block cursor-pointer rounded-3xl border border-white/10 bg-[#0b1018]/80 p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-400/30"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-medium tracking-[0.15em] text-gray-500">
                  CUSTOMER ENQUIRIES
                </p>

                <p className="mt-4 text-2xl font-medium text-purple-300">
                  {enquiries.length}
                </p>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-400/10 text-2xl">
                💬
              </div>

            </div>

            <p className="mt-5 text-xs text-gray-500">
              Questions and requests from customers
            </p>

          </a>

        </section>

        {/* INVENTORY ALERT */}

        {lowStockProducts > 0 && (

          <div className="mb-10 flex flex-col gap-4 rounded-3xl border border-[#e9a33f]/20 bg-gradient-to-r from-[#e9a33f]/10 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9a33f]/15 text-xl">
                ⚠️
              </div>

              <div>

                <p className="font-bold text-[#ffd078]">
                  Inventory Attention Needed
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  {lowStockProducts} product
                  {lowStockProducts > 1 ? "s have" : " has"} low stock.
                </p>

              </div>

            </div>

            <span className="rounded-full border border-[#e9a33f]/20 px-4 py-2 text-sm text-[#ffd078]">
              Stock ≤ 5
            </span>

          </div>

        )}

        {/* PRODUCT FORM MODAL */}

        {showProductForm && (

          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md sm:px-6">

            <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1018]/95 shadow-2xl backdrop-blur-xl">

          <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent p-6 md:p-8">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <p className="text-xs font-semibold tracking-[0.25em] text-[#e9a33f]">
                  PRODUCT MANAGEMENT
                </p>

                <h2 className="mt-3 text-2xl font-normal">

                  {editingId !== null
                    ? "Edit Product"
                    : "Add New Product"}

                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Add products and keep your store inventory up to date.
                </p>

              </div>

              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm text-gray-300 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400"
              >
                Close
              </button>

              {editingId !== null && (

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm text-gray-300 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-400"
                >
                  Cancel Editing
                </button>

              )}

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 p-5 md:p-6"
          >

            <div>

              <label className="mb-3 block text-sm font-medium text-gray-300">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Example: Sony WH-1000XM5"
                className="w-full rounded-2xl border border-white/10 bg-[#070b11] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]/70 focus:ring-4 focus:ring-[#e9a33f]/5"
              />

            </div>

            <div className="grid gap-6 md:grid-cols-2">

              <div>

                <label className="mb-3 block text-sm font-medium text-gray-300">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#070b11] px-4 py-3 text-white outline-none transition focus:border-[#e9a33f]/70 focus:ring-4 focus:ring-[#e9a33f]/5"
                >

                  <option value="">
                    Select category
                  </option>

                  <option value="Laptops">
                    Laptops
                  </option>

                  <option value="Smartphones">
                    Smartphones & Accessories
                  </option>

                  <option value="Audio">
                    Audio & Headphones
                  </option>

                  <option value="TV">
                    Smart TVs
                  </option>

                  <option value="chargers">
                    Chargers & Cables
                  </option>

                  <option value="Accessories">
                    Accessories
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-3 block text-sm font-medium text-gray-300">
                  Price (₹)
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="4500"
                  min="0"
                  className="w-full rounded-2xl border border-white/10 bg-[#070b11] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]/70 focus:ring-4 focus:ring-[#e9a33f]/5"
                />

              </div>

            </div>

            <div>

              <label className="mb-3 block text-sm font-medium text-gray-300">
                Stock Quantity
              </label>

              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="10"
                min="0"
                className="w-full rounded-2xl border border-white/10 bg-[#070b11] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f]/70 focus:ring-4 focus:ring-[#e9a33f]/5"
              />

            </div>

            <div>

              <label className="mb-3 block text-sm font-medium text-gray-300">
                Product Image
              </label>

              <label
                htmlFor="product-image"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#e9a33f]/30 bg-gradient-to-b from-[#e9a33f]/5 to-transparent p-5 transition duration-300 hover:border-[#e9a33f]/70 hover:bg-[#e9a33f]/10"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9a33f]/10 text-3xl transition duration-300 group-hover:scale-110">
                  🖼️
                </div>

                <span className="mt-3 font-normal text-[#ffd078]">
                  Upload Product Image
                </span>

                <span className="mt-2 text-center text-xs text-gray-500">
                  Click here to choose an image from your computer
                </span>

              </label>

              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

            </div>

            {form.image && (

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b11]">

                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

                  <div>

                    <p className="font-bold">
                      Image Preview
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      This image will be displayed on your store.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>

                </div>

                <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(233,163,63,0.08),transparent_60%)] p-4">

                  <img
                    src={form.image}
                    alt="Product preview"
                    className="h-full w-full rounded-2xl object-contain"
                  />

                </div>

                {compressionInfo && (

                  <div className="border-t border-white/10 px-6 py-5">

                    <div className="rounded-2xl border border-[#e9a33f]/30 bg-[#e9a33f]/5 p-5">

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9a33f]">
                        Image Compression
                      </p>

                      {compressionInfo.status === "compressing" && (
                        <p className="mt-3 text-sm font-semibold text-white">
                          ⚡ Compressing image... {compressionInfo.originalKB} KB → checking optimized size...
                        </p>
                      )}

                      {compressionInfo.status === "ready" && (
                        <p className="mt-3 text-sm font-semibold text-white">
                          ⚡ Optimized: {compressionInfo.originalKB} KB → {compressionInfo.compressedKB} KB
                        </p>
                      )}

                      {compressionInfo.status === "uploaded" && (
                        <p className="mt-3 text-sm font-semibold text-white">
                          ✅ Uploaded to Cloudinary: {compressionInfo.originalKB} KB → {compressionInfo.compressedKB} KB
                        </p>
                      )}

                      {compressionInfo.compressedKB !== null && compressionInfo.originalKB > 0 && (
                        <p className="mt-2 text-xs text-gray-400">
                          {compressionInfo.originalKB > compressionInfo.compressedKB
                            ? `Reduced by ${Math.round(((compressionInfo.originalKB - compressionInfo.compressedKB) / compressionInfo.originalKB) * 100)}%`
                            : "No compression needed — image was already within the 600 KB target."}
                        </p>
                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

            <button
              type="submit"
              disabled={saving}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#d88729] via-[#e9a33f] to-[#ffd078] px-5 py-3 font-black text-black shadow-[0_15px_40px_rgba(233,163,63,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(233,163,63,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <span className="relative z-10">

                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Product →"
                  : "Add Product →"}

              </span>

            </button>

          </form>

            </section>

          </div>

        )}

        {/* PRODUCT LIST */}

      <section
  className="mt-20"
>

          <div className="mb-7">
            <a
              href="#dashboard"
              className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#e9a33f] hover:text-black"
            >
              ↑ Back to Dashboard
            </a>
          </div>
<div id="inventory" className="h-0" />
          <div
  className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
>

            <div>
  <p className="text-xs font-semibold tracking-[0.25em] text-[#e9a33f]">
    YOUR INVENTORY
  </p>

  <h2 className="mt-3 text-3xl font-normal">
    Products
  </h2>

  <p className="mt-3 text-sm text-gray-500">
    Manage all products currently available in your store.
  </p>

  <div className="mt-6 flex flex-wrap gap-3">

    <button
      type="button"
      onClick={() => {
        setEditingId(null);
        setForm(emptyForm);
        setSelectedImage(null);
        setCompressionInfo(null);
        setMessage("");
        setShowProductForm(true);
      }}
      className="rounded-2xl bg-gradient-to-r from-[#d88729] via-[#e9a33f] to-[#ffd078] px-5 py-3 text-sm font-black text-black shadow-[0_12px_35px_rgba(233,163,63,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(233,163,63,0.28)]"
    >
      + Add New Product
    </button>

  </div>
  <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

  {[
    {
      label: "All Products",
      value: "all",
    },
    {
      label: "Laptops & Computers",
      value: "Laptops",
    },
    {
      label: "Smartphones & Accessories",
      value: "Smartphones",
    },
    {
      label: "Audio & Headphones",
      value: "Audio",
    },
    {
      label: "Smart TVs",
      value: "TV",
    },
    {
      label: "Charger & Data Cables",
      value: "chargers",
    },
  ].map((category) => (

    <button
      key={category.value}
      type="button"
      onClick={() => {
  setActiveCategory(category.value);
  setCurrentProductPage(1);

  window.setTimeout(() => {
    document
      .getElementById("inventory")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, 50);
}}
      className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
        activeCategory === category.value
          ? "border-[#e9a33f]/60 bg-[#e9a33f]/10 text-[#ffd078] shadow-[0_0_25px_rgba(233,163,63,0.08)]"
          : "border-white/10 bg-[#0b1018] text-gray-500 hover:border-white/20 hover:text-gray-300"
      }`}
    >
      {category.label}
    </button>

  ))}

</div>


</div>

            <div className="rounded-2xl border border-white/10 bg-[#0b1018] px-5 py-3 text-sm">

              <span className="text-gray-500">
                TOTAL
              </span>

              <span className="ml-3 font-medium text-[#e9a33f]">
               {filteredProducts.length} PRODUCTS
              </span>

            </div>

          </div>

          {loading ? (

            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b1018] py-24">

              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />

              <p className="mt-5 text-sm text-gray-500">
                Loading your inventory...
              </p>

            </div>

          ) : products.length === 0 ? (

            <div className="rounded-[2rem] border border-dashed border-white/10 bg-[#0b1018] py-24 text-center">

              <div className="text-7xl">
                📦
              </div>

              <h3 className="mt-6 text-2xl font-medium">
                No products yet
              </h3>

              <p className="mt-3 text-sm text-gray-500">
                Add your first product using the form above.
              </p>

            </div>

          ) : (
              <>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

             {paginatedProducts.map((product) => (

                <div
                  key={product.id}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1018]/90 shadow-xl transition duration-300 hover:-translate-y-2 hover:border-[#e9a33f]/40 hover:shadow-[0_25px_70px_rgba(0,0,0,0.35)]"
                >

                  <div className="relative flex h-72 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)] p-6">

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1018] via-transparent to-transparent opacity-70" />

                    {product.image ? (

                      <img
                        src={product.image}
                        alt={product.name}
                        className="relative z-10 h-full w-full object-contain transition duration-500 group-hover:scale-110"
                      />

                    ) : (

                      <div className="relative z-10 flex h-full items-center justify-center text-7xl">
                        📦
                      </div>

                    )}

                    <div
                      className={`absolute right-5 top-5 rounded-full border px-3 py-1.5 text-[10px] font-bold backdrop-blur-xl ${
                        product.stock > 5
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                          : product.stock > 0
                          ? "border-[#e9a33f]/30 bg-[#e9a33f]/10 text-[#ffd078]"
                          : "border-red-400/30 bg-red-400/10 text-red-400"
                      }`}
                    >

                      {product.stock > 5
                        ? `${product.stock} IN STOCK`
                        : product.stock > 0
                        ? `LOW: ${product.stock}`
                        : "OUT OF STOCK"}

                    </div>

                  </div>

                  <div className="p-7">

                    <p className="text-[10px] font-bold tracking-[0.22em] text-[#e9a33f]">
                      {product.category.toUpperCase()}
                    </p>

                    <h3 className="mt-4 min-h-[3.5rem] text-1xl font-normal leading-tight">
                      {product.name}
                    </h3>

                    <div className="mt-6 flex items-end justify-between gap-4">

                      <div>

                        <p className="text-xs text-gray-500">
                          PRICE
                        </p>

                        <p className="mt-1 text-3xl font-black text-[#ffd078]">
                          {formatPrice(product.price)}
                        </p>

                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-right">

                        <p className="text-[9px] tracking-wider text-gray-500">
                          STOCK
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {product.stock}
                        </p>

                      </div>

                    </div>

                    <div className="mt-7 grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          editProduct(product)
                        }
                        className="rounded-2xl border border-[#e9a33f]/30 bg-[#e9a33f]/5 px-4 py-3.5 text-sm font-bold text-[#ffd078] transition hover:bg-[#e9a33f] hover:text-black"
                      >
                        Edit
                      </button>

                      <button
  type="button"
  onClick={() =>
    deleteProduct(product)
  }
  disabled={deletingProductId === product.id}
  className="rounded-2xl border border-red-500/25 bg-red-500/5 px-4 py-3.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
>
  {deletingProductId === product.id ? (
    <span className="flex items-center justify-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
      Deleting...
    </span>
  ) : (
    "Delete"
  )}
</button>

                    </div>

                  </div>

                </div>

              ))}

            </div>

              

            {totalProductPages > 1 && (
              <div className="mt-16 flex flex-col items-center gap-5">

                {/* LOADING INDICATOR */}

                <div
                  className={`flex h-5 items-center gap-2 text-xs text-gray-500 transition-opacity duration-300 ${
                    isChangingProductPage
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />

                  Loading products...
                </div>

                {/* PAGINATION */}

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1119]/80 p-2 shadow-[0_15px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">

                  {/* PREVIOUS */}

                  <button
                    type="button"
                    disabled={
                      currentProductPage === 1 ||
                      isChangingProductPage
                    }
                    onClick={() =>
                      changeProductPage(
                        currentProductPage - 1
                      )
                    }
                    className="flex h-10 items-center justify-center rounded-xl px-3 text-sm text-orange-600 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ←
                    <span className="ml-1 hidden sm:inline">
                      Prev
                    </span>
                  </button>

                  {/* PAGE NUMBERS */}

                  <div className="flex items-center gap-1">

                    {Array.from(
                      {
                        length: totalProductPages,
                      },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        disabled={
                          isChangingProductPage
                        }
                        onClick={() =>
                          changeProductPage(page)
                        }
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition ${
                          currentProductPage === page
                            ? "bg-[#e9a33f] text-black shadow-[0_8px_25px_rgba(233,163,63,0.20)]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        } disabled:cursor-not-allowed`}
                      >
                        {page}
                      </button>
                    ))}

                  </div>

                  {/* NEXT */}

                  <button
                    type="button"
                    disabled={
                      currentProductPage ===
                        totalProductPages ||
                      isChangingProductPage
                    }
                    onClick={() =>
                      changeProductPage(
                        currentProductPage + 1
                      )
                    }
                    className="flex h-10 items-center justify-center rounded-xl px-3 text-sm text-orange-600 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <span className="mr-1 hidden sm:inline">
                      Next
                    </span>
                    →
                  </button>

                </div>

                {/* PAGE COUNT */}

                <p className="text-xs tracking-wide text-gray-600">
                  Page{" "}
                  <span className="text-gray-400">
                    {currentProductPage}
                  </span>{" "}
                  of{" "}
                  <span className="text-gray-400">
                    {totalProductPages}
                  </span>
                </p>

              </div>
            )}

           </>
             )}

        </section>

        
       
        {/* FOOTER */}

       <footer className="mt-auto border-t border-white/10 py-10 text-center">

          <div className="flex flex-col items-center gap-3">

            <div className="flex items-center gap-2 text-sm font-medium">

              <span className="text-[#e9a33f]">
                ⚡
              </span>

              HLAWNDO ELECTRONICS

            </div>

            <p className="text-1xs text-gray-600">
              Premium e-commerce management system. @ 2024 All rights reserved.
            </p>

          </div>

        </footer>

      </div>

    </main>
  );
}

