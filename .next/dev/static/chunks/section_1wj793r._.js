(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/section/Footer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/motion/dist/es/react.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up-right.mjs [app-client] (ecmascript) <export default as ArrowUpRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.mjs [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.mjs [app-client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.mjs [app-client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
/* ============================================================
   CONSTANTES
============================================================ */ const FOOTER_ASSETS = {
    logo: "/images/logo/logo-smartpro-01.png",
    payment: "/images/payment/webpay.png"
};
const CONTACT_INFO = [
    {
        id: "address",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
        label: "Providencia 1017 Of 41 Providencia, RM, Chile",
        href: "https://www.google.com/maps/search/?api=1&query=Providencia+1017+Providencia+Chile",
        external: true
    },
    {
        id: "postal-code",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"],
        label: "Código Postal: 7500000",
        href: null,
        external: false
    },
    {
        id: "email",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"],
        label: "contacto@smartpro.cl",
        href: "mailto:contacto@smartpro.cl",
        external: false
    },
    {
        id: "phone",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"],
        label: "(+56) 9 4977 3707",
        href: "tel:+56949773707",
        external: false
    }
];
const SITE_MAP = [
    {
        label: "Inicio",
        href: "#inicio"
    },
    {
        label: "Modelos",
        href: "#voceros"
    },
    {
        label: "Servicios",
        href: "#servicios"
    },
    {
        label: "Planes",
        href: "#planes"
    },
    {
        label: "Proyectos",
        href: "#proyectos"
    },
    {
        label: "Testimonios",
        href: "#testimonios"
    },
    {
        label: "SmartSell®",
        href: "/smartsell"
    },
    {
        label: "Contacto",
        href: "#contacto"
    },
    {
        label: "Políticas",
        href: "/politica-privacidad"
    }
];
const SOCIAL_LINKS = [
    {
        label: "Facebook",
        href: "https://www.facebook.com/profile.php?id=61568563559545",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaFacebookF"]
    },
    {
        label: "Instagram",
        href: "https://www.instagram.com/smartpro.chile/",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaInstagram"]
    },
    {
        label: "X",
        href: "https://x.com/smartpro2025",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaXTwitter"]
    },
    {
        label: "Threads",
        href: "https://www.threads.com/@smartpro.chile",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaThreads"]
    }
];
function Footer() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        id: "contacto",
        className: "\n        relative\n        overflow-hidden\n        bg-navy\n        text-white\n      ",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "\n          pointer-events-none\n          absolute\n          -left-40\n          -top-40\n          h-[420px]\n          w-[420px]\n          rounded-full\n          bg-primary/15\n          blur-[130px]\n        "
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "\n          pointer-events-none\n          absolute\n          -bottom-44\n          right-0\n          h-[400px]\n          w-[400px]\n          rounded-full\n          bg-magenta/10\n          blur-[130px]\n        "
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 151,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          h-px\n          w-full\n          bg-gradient-to-r\n          from-transparent\n          via-primary/70\n          to-magenta/70\n        "
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          relative\n          mx-auto\n          max-w-[1500px]\n          px-5\n          py-16\n          sm:px-6\n          sm:py-20\n          lg:px-8\n          lg:py-24\n        ",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "\n            grid\n            gap-12\n            md:grid-cols-2\n            lg:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]\n            lg:gap-10\n            xl:gap-16\n          ",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true,
                                amount: 0.2
                            },
                            transition: {
                                duration: 0.55
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    "aria-label": "Ir al inicio de SmartPro",
                                    className: "inline-flex",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "\n                  rounded-2xl\n                  border\n                  border-white/10\n                  bg-white\n                  px-4\n                  py-3\n                  shadow-[0_12px_40px_rgba(0,0,0,0.12)]\n                  transition-transform\n                  duration-300\n                  hover:-translate-y-1\n                ",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            src: FOOTER_ASSETS.logo,
                                            alt: "SmartPro",
                                            width: 180,
                                            height: 58,
                                            className: "\n                    h-auto\n                    w-[145px]\n                    object-contain\n                    sm:w-[165px]\n                  "
                                        }, void 0, false, {
                                            fileName: "[project]/section/Footer.tsx",
                                            lineNumber: 248,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/section/Footer.tsx",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 229,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "\n                mt-6\n                max-w-sm\n                text-sm\n                leading-7\n                text-white/60\n              ",
                                    children: "Estrategia, creatividad y tecnología para impulsar marcas, empresas y proyectos en el entorno digital."
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 265,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-7 space-y-4",
                                    children: CONTACT_INFO.map((item)=>{
                                        const Icon = item.icon;
                                        const content = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "\n                        flex\n                        h-9\n                        w-9\n                        shrink-0\n                        items-center\n                        justify-center\n                        rounded-xl\n                        border\n                        border-primary/20\n                        bg-primary/10\n                        text-violet-300\n                        transition-all\n                        duration-300\n                        group-hover:border-primary/40\n                        group-hover:bg-primary/20\n                      ",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        size: 16,
                                                        strokeWidth: 1.8
                                                    }, void 0, false, {
                                                        fileName: "[project]/section/Footer.tsx",
                                                        lineNumber: 305,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Footer.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "\n                        text-sm\n                        leading-6\n                        text-white/65\n                        transition-colors\n                        duration-300\n                        group-hover:text-white\n                      ",
                                                    children: item.label
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Footer.tsx",
                                                    lineNumber: 308,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/section/Footer.tsx",
                                            lineNumber: 285,
                                            columnNumber: 19
                                        }, this);
                                        if (!item.href) {
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "\n                        flex\n                        items-start\n                        gap-3\n                      ",
                                                children: content
                                            }, item.id, false, {
                                                fileName: "[project]/section/Footer.tsx",
                                                lineNumber: 325,
                                                columnNumber: 21
                                            }, this);
                                        }
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: item.href,
                                            target: item.external ? "_blank" : undefined,
                                            rel: item.external ? "noopener noreferrer" : undefined,
                                            className: "\n                      group\n                      flex\n                      items-start\n                      gap-3\n                    ",
                                            children: content
                                        }, item.id, false, {
                                            fileName: "[project]/section/Footer.tsx",
                                            lineNumber: 339,
                                            columnNumber: 19
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 280,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 210,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true,
                                amount: 0.2
                            },
                            transition: {
                                duration: 0.55,
                                delay: 0.08
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FooterTitle, {
                                    children: "Mapa del sitio"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 380,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                    "aria-label": "Mapa del sitio",
                                    className: "mt-6",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-3",
                                        children: SITE_MAP.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: item.href,
                                                    className: "\n                        group\n                        inline-flex\n                        items-center\n                        gap-2\n                        text-sm\n                        text-white/60\n                        transition-colors\n                        duration-300\n                        hover:text-white\n                      ",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "\n                          h-1\n                          w-1\n                          rounded-full\n                          bg-primary\n                          transition-all\n                          duration-300\n                          group-hover:w-3\n                          group-hover:bg-magenta\n                        "
                                                        }, void 0, false, {
                                                            fileName: "[project]/section/Footer.tsx",
                                                            lineNumber: 400,
                                                            columnNumber: 23
                                                        }, this),
                                                        item.label
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/section/Footer.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 21
                                                }, this)
                                            }, item.label, false, {
                                                fileName: "[project]/section/Footer.tsx",
                                                lineNumber: 385,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/section/Footer.tsx",
                                        lineNumber: 383,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 382,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 362,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true,
                                amount: 0.2
                            },
                            transition: {
                                duration: 0.55,
                                delay: 0.14
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FooterTitle, {
                                    children: "Formas de pago"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 443,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "\n                mt-6\n                text-sm\n                leading-6\n                text-white/55\n              ",
                                    children: "Realiza tus pagos de forma segura mediante nuestros medios disponibles."
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 445,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "\n                mt-5\n                inline-flex\n                max-w-[210px]\n                items-center\n                justify-center\n                rounded-2xl\n                border\n                border-white/10\n                bg-white\n                p-4\n                transition-all\n                duration-300\n                hover:-translate-y-1\n                hover:shadow-[0_15px_40px_rgba(109,40,217,0.15)]\n              ",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: FOOTER_ASSETS.payment,
                                        alt: "Webpay",
                                        width: 220,
                                        height: 105,
                                        className: "\n                  h-auto\n                  w-full\n                  object-contain\n                "
                                    }, void 0, false, {
                                        fileName: "[project]/section/Footer.tsx",
                                        lineNumber: 477,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 459,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 425,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            whileInView: {
                                opacity: 1,
                                y: 0
                            },
                            viewport: {
                                once: true,
                                amount: 0.2
                            },
                            transition: {
                                duration: 0.55,
                                delay: 0.2
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FooterTitle, {
                                    children: "Síguenos"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 513,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "\n                mt-6\n                max-w-xs\n                text-sm\n                leading-6\n                text-white/55\n              ",
                                    children: "Síguenos y conoce nuestras novedades, proyectos y contenido."
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 515,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "\n                mt-6\n                flex\n                flex-wrap\n                gap-3\n              ",
                                    children: SOCIAL_LINKS.map((social)=>{
                                        const Icon = social.icon;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].a, {
                                            href: social.href,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            "aria-label": `SmartPro en ${social.label}`,
                                            whileHover: {
                                                y: -3
                                            },
                                            whileTap: {
                                                scale: 0.94
                                            },
                                            className: "\n                      group\n                      flex\n                      h-11\n                      w-11\n                      items-center\n                      justify-center\n                      rounded-xl\n                      border\n                      border-white/10\n                      bg-white/[0.05]\n                      text-white/70\n                      backdrop-blur-md\n                      transition-all\n                      duration-300\n                      hover:border-primary/50\n                      hover:bg-primary\n                      hover:text-white\n                      hover:shadow-[0_8px_25px_rgba(109,40,217,0.25)]\n                    ",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                size: 17
                                            }, void 0, false, {
                                                fileName: "[project]/section/Footer.tsx",
                                                lineNumber: 574,
                                                columnNumber: 21
                                            }, this)
                                        }, social.label, false, {
                                            fileName: "[project]/section/Footer.tsx",
                                            lineNumber: 541,
                                            columnNumber: 19
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 529,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "#contacto",
                                    className: "\n                group\n                mt-8\n                inline-flex\n                items-center\n                gap-2\n                text-sm\n                font-semibold\n                text-violet-300\n                transition-colors\n                duration-300\n                hover:text-white\n              ",
                                    children: [
                                        "Cuéntanos tu proyecto",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpRight$3e$__["ArrowUpRight"], {
                                            size: 16,
                                            className: "\n                  transition-transform\n                  duration-300\n                  group-hover:-translate-y-0.5\n                  group-hover:translate-x-0.5\n                "
                                        }, void 0, false, {
                                            fileName: "[project]/section/Footer.tsx",
                                            lineNumber: 599,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 582,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 495,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/section/Footer.tsx",
                    lineNumber: 196,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 183,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          relative\n          border-t\n          border-white/[0.08]\n          bg-black/10\n        ",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "\n            mx-auto\n            flex\n            max-w-[1500px]\n            flex-col\n            gap-4\n            px-5\n            py-6\n            sm:px-6\n            md:flex-row\n            md:items-center\n            md:justify-between\n            lg:px-8\n          ",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "\n                text-sm\n                font-medium\n                text-white/70\n              ",
                                    children: "Empresa Comercial LyV SpA"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 642,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "\n                mt-1\n                text-xs\n                text-white/40\n              ",
                                    children: "RUT 78.206.607-2"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 652,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 641,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "\n              flex\n              flex-col\n              gap-2\n              text-xs\n              text-white/40\n              sm:flex-row\n              sm:items-center\n              sm:gap-5\n            ",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Copyright © 2025 SmartPro.cl"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 675,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/politica-privacidad",
                                    className: "\n                transition-colors\n                duration-300\n                hover:text-white\n              ",
                                    children: "Política de privacidad"
                                }, void 0, false, {
                                    fileName: "[project]/section/Footer.tsx",
                                    lineNumber: 677,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Footer.tsx",
                            lineNumber: 663,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/section/Footer.tsx",
                    lineNumber: 625,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 617,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/Footer.tsx",
        lineNumber: 123,
        columnNumber: 5
    }, this);
}
_c = Footer;
/* ============================================================
   TÍTULOS
============================================================ */ function FooterTitle({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "\n          text-sm\n          font-semibold\n          uppercase\n          tracking-[0.18em]\n          text-white\n        ",
                children: children
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 701,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          mt-3\n          h-[2px]\n          w-8\n          rounded-full\n          bg-gradient-to-r\n          from-primary\n          to-magenta\n        "
            }, void 0, false, {
                fileName: "[project]/section/Footer.tsx",
                lineNumber: 713,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/Footer.tsx",
        lineNumber: 700,
        columnNumber: 5
    }, this);
}
_c1 = FooterTitle;
var _c, _c1;
__turbopack_context__.k.register(_c, "Footer");
__turbopack_context__.k.register(_c1, "FooterTitle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/section/HeroSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeroSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/motion/dist/es/react.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar-days.mjs [app-client] (ecmascript) <export default as CalendarDays>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const HERO_IMAGES = [
    {
        src: "/images/hero/hero-01.png",
        alt: "Equipo creativo de SmartPro trabajando en estrategia y diseño"
    },
    {
        src: "/images/hero/hero-02.png",
        alt: "Equipo de SmartPro desarrollando soluciones digitales"
    },
    {
        src: "/images/hero/hero-03.png",
        alt: "Producción y creatividad digital de SmartPro"
    }
];
const AUTOPLAY_INTERVAL = 6000;
function HeroSection() {
    _s();
    const [currentSlide, setCurrentSlide] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [direction, setDirection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [isPaused, setIsPaused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const nextSlide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HeroSection.useCallback[nextSlide]": ()=>{
            setDirection(1);
            setCurrentSlide({
                "HeroSection.useCallback[nextSlide]": (current)=>current === HERO_IMAGES.length - 1 ? 0 : current + 1
            }["HeroSection.useCallback[nextSlide]"]);
        }
    }["HeroSection.useCallback[nextSlide]"], []);
    const previousSlide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HeroSection.useCallback[previousSlide]": ()=>{
            setDirection(-1);
            setCurrentSlide({
                "HeroSection.useCallback[previousSlide]": (current)=>current === 0 ? HERO_IMAGES.length - 1 : current - 1
            }["HeroSection.useCallback[previousSlide]"]);
        }
    }["HeroSection.useCallback[previousSlide]"], []);
    const goToSlide = (index)=>{
        if (index === currentSlide) return;
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeroSection.useEffect": ()=>{
            if (isPaused) return;
            const timer = window.setInterval({
                "HeroSection.useEffect.timer": ()=>{
                    nextSlide();
                }
            }["HeroSection.useEffect.timer"], AUTOPLAY_INTERVAL);
            return ({
                "HeroSection.useEffect": ()=>window.clearInterval(timer)
            })["HeroSection.useEffect"];
        }
    }["HeroSection.useEffect"], [
        isPaused,
        nextSlide
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "relative overflow-hidden bg-background",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          relative h-[330px] w-full overflow-hidden\n          sm:h-[400px]\n          md:h-[460px]\n          lg:h-[500px]\n          xl:h-[560px]\n        ",
                onMouseEnter: ()=>setIsPaused(true),
                onMouseLeave: ()=>setIsPaused(false),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        initial: false,
                        custom: direction,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            custom: direction,
                            initial: {
                                opacity: 0,
                                scale: 1.025
                            },
                            animate: {
                                opacity: 1,
                                scale: 1
                            },
                            exit: {
                                opacity: 0,
                                scale: 1.01
                            },
                            transition: {
                                opacity: {
                                    duration: 0.8,
                                    ease: "easeInOut"
                                },
                                scale: {
                                    duration: 1.2,
                                    ease: "easeOut"
                                }
                            },
                            className: "absolute inset-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: HERO_IMAGES[currentSlide].src,
                                    alt: HERO_IMAGES[currentSlide].alt,
                                    fill: true,
                                    priority: currentSlide === 0,
                                    className: "object-cover object-center",
                                    sizes: "100vw"
                                }, void 0, false, {
                                    fileName: "[project]/section/HeroSection.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "\n                absolute inset-0\n                bg-gradient-to-t\n                from-black/15\n                via-transparent\n                to-black/[0.03]\n              "
                                }, void 0, false, {
                                    fileName: "[project]/section/HeroSection.tsx",
                                    lineNumber: 118,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, currentSlide, true, {
                            fileName: "[project]/section/HeroSection.tsx",
                            lineNumber: 81,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                        type: "button",
                        "aria-label": "Mostrar imagen anterior",
                        onClick: previousSlide,
                        whileTap: {
                            scale: 0.92
                        },
                        className: "\n            group absolute left-4 top-1/2 z-20\n            flex h-11 w-11 -translate-y-1/2\n            items-center justify-center\n            rounded-full\n            border border-white/40\n            bg-white/90\n            text-foreground\n            shadow-lg\n            backdrop-blur-md\n            transition-all duration-300\n            hover:scale-105\n            hover:bg-white\n            hover:text-primary\n            sm:left-6\n            lg:left-8\n            lg:h-12\n            lg:w-12\n          ",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                            size: 22,
                            strokeWidth: 1.8,
                            className: "\n              transition-transform duration-300\n              group-hover:-translate-x-0.5\n            "
                        }, void 0, false, {
                            fileName: "[project]/section/HeroSection.tsx",
                            lineNumber: 159,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                        type: "button",
                        "aria-label": "Mostrar imagen siguiente",
                        onClick: nextSlide,
                        whileTap: {
                            scale: 0.92
                        },
                        className: "\n            group absolute right-4 top-1/2 z-20\n            flex h-11 w-11 -translate-y-1/2\n            items-center justify-center\n            rounded-full\n            border border-white/40\n            bg-white/90\n            text-foreground\n            shadow-lg\n            backdrop-blur-md\n            transition-all duration-300\n            hover:scale-105\n            hover:bg-white\n            hover:text-primary\n            sm:right-6\n            lg:right-8\n            lg:h-12\n            lg:w-12\n          ",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                            size: 22,
                            strokeWidth: 1.8,
                            className: "\n              transition-transform duration-300\n              group-hover:translate-x-0.5\n            "
                        }, void 0, false, {
                            fileName: "[project]/section/HeroSection.tsx",
                            lineNumber: 198,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "\n            absolute bottom-5 left-1/2 z-20\n            flex -translate-x-1/2 items-center\n            gap-2 rounded-full\n            bg-black/20 px-3 py-2\n            backdrop-blur-md\n          ",
                        children: HERO_IMAGES.map((image, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "aria-label": `Ir a imagen ${index + 1}`,
                                "aria-current": currentSlide === index ? "true" : undefined,
                                onClick: ()=>goToSlide(index),
                                className: "\n                flex h-5 items-center\n                justify-center\n              ",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `
                  block h-1.5 rounded-full
                  transition-all duration-500
                  ${currentSlide === index ? "w-7 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"}
                `
                                }, void 0, false, {
                                    fileName: "[project]/section/HeroSection.tsx",
                                    lineNumber: 233,
                                    columnNumber: 15
                                }, this)
                            }, image.src, false, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/HeroSection.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: "\n            pointer-events-none\n            absolute left-1/2 top-8\n            h-56 w-[500px]\n            -translate-x-1/2\n            rounded-full\n            bg-primary/10\n            blur-[90px]\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: "\n            pointer-events-none\n            absolute bottom-0 left-0\n            h-56 w-56 opacity-20\n            [background-image:radial-gradient(circle,var(--color-primary)_1px,transparent_1px)]\n            [background-size:10px_10px]\n            [mask-image:linear-gradient(to_right,black,transparent)]\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: "\n            pointer-events-none\n            absolute bottom-0 right-0\n            h-56 w-56 opacity-20\n            [background-image:radial-gradient(circle,var(--color-magenta)_1px,transparent_1px)]\n            [background-size:10px_10px]\n            [mask-image:linear-gradient(to_left,black,transparent)]\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 285,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "\n            relative mx-auto\n            flex max-w-5xl\n            flex-col items-center\n            px-6\n            py-12\n            text-center\n            sm:py-14\n            lg:py-16\n          ",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].p, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                transition: {
                                    duration: 0.5,
                                    ease: "easeOut"
                                },
                                className: "\n              mb-4\n              text-xs font-semibold\n              uppercase\n              tracking-[0.24em]\n              text-magenta\n              sm:text-sm\n            ",
                                children: "Agencia de marketing digital"
                            }, void 0, false, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 311,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].h1, {
                                initial: {
                                    opacity: 0,
                                    y: 20
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                transition: {
                                    duration: 0.65,
                                    delay: 0.08,
                                    ease: "easeOut"
                                },
                                className: "\n              max-w-4xl\n              text-balance\n              text-[2.6rem]\n              font-bold\n              leading-[0.98]\n              tracking-[-0.045em]\n              text-foreground\n              sm:text-5xl\n              md:text-6xl\n              lg:text-[64px]\n            ",
                                children: [
                                    "Llevamos tu marca",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "\n                mt-1 block\n                bg-gradient-to-r\n                from-primary\n                via-violet-500\n                to-magenta\n                bg-clip-text\n                text-transparent\n              ",
                                        children: "al siguiente nivel"
                                    }, void 0, false, {
                                        fileName: "[project]/section/HeroSection.tsx",
                                        lineNumber: 354,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 332,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    scaleX: 0
                                },
                                animate: {
                                    opacity: 1,
                                    scaleX: 1
                                },
                                transition: {
                                    duration: 0.5,
                                    delay: 0.2
                                },
                                className: "\n              my-6\n              h-[3px]\n              w-14\n              origin-center\n              rounded-full\n              bg-gradient-to-r\n              from-primary\n              to-magenta\n            "
                            }, void 0, false, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 371,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].p, {
                                initial: {
                                    opacity: 0,
                                    y: 14
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.18
                                },
                                className: "\n              max-w-2xl\n              text-pretty\n              text-base\n              leading-7\n              text-muted\n              sm:text-lg\n            ",
                                children: "Estrategia, creatividad y tecnología para generar resultados reales y hacer crecer tu negocio."
                            }, void 0, false, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 398,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    y: 16
                                },
                                animate: {
                                    opacity: 1,
                                    y: 0
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.28
                                },
                                className: "mt-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#contacto",
                                    className: "\n                group\n                inline-flex min-h-12\n                items-center justify-center\n                gap-3\n                rounded-full\n                bg-gradient-to-r\n                from-primary\n                to-magenta\n                px-7 py-3.5\n                text-sm\n                font-semibold\n                text-white\n                shadow-[0_12px_35px_rgba(109,40,217,0.22)]\n                transition-all\n                duration-300\n                hover:-translate-y-0.5\n                hover:shadow-[0_16px_40px_rgba(109,40,217,0.3)]\n                sm:text-base\n              ",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2d$days$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CalendarDays$3e$__["CalendarDays"], {
                                            size: 18,
                                            strokeWidth: 1.8,
                                            className: "\n                  transition-transform\n                  duration-300\n                  group-hover:scale-110\n                "
                                        }, void 0, false, {
                                            fileName: "[project]/section/HeroSection.tsx",
                                            lineNumber: 452,
                                            columnNumber: 15
                                        }, this),
                                        "Agendar reunión"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/section/HeroSection.tsx",
                                    lineNumber: 429,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/section/HeroSection.tsx",
                                lineNumber: 420,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/section/HeroSection.tsx",
                        lineNumber: 297,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/HeroSection.tsx",
                lineNumber: 253,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          h-px w-full\n          bg-gradient-to-r\n          from-transparent\n          via-primary/40\n          to-magenta/40\n        "
            }, void 0, false, {
                fileName: "[project]/section/HeroSection.tsx",
                lineNumber: 469,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/HeroSection.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_s(HeroSection, "08d5b2F3vh1f2G+tgkxjlfN6aag=");
_c = HeroSection;
var _c;
__turbopack_context__.k.register(_c, "HeroSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/section/Navbar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Navbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/motion/dist/es/react.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/menu.mjs [app-client] (ecmascript) <export default as Menu>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.mjs [app-client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
/* ============================================================
   CONSTANTES
============================================================ */ const LOGOS = {
    icon: "/images/logo/logo-smartpro-02.png",
    wordmark: "/images/logo/logo-smartpro-01.png"
};
const NAV_ITEMS = [
    {
        label: "Inicio",
        href: "/"
    },
    {
        label: "Servicios",
        href: "#servicios"
    },
    {
        label: "Proyectos",
        href: "#proyectos"
    },
    {
        label: "Nosotros",
        href: "#nosotros"
    },
    {
        label: "Contacto",
        href: "#contacto"
    }
];
function Navbar() {
    _s();
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mobileMenuOpen, setMobileMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ------------------------------------------------------------
     DETECTAR SCROLL
  ------------------------------------------------------------ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            const handleScroll = {
                "Navbar.useEffect.handleScroll": ()=>{
                    setScrolled(window.scrollY > 20);
                }
            }["Navbar.useEffect.handleScroll"];
            handleScroll();
            window.addEventListener("scroll", handleScroll, {
                passive: true
            });
            return ({
                "Navbar.useEffect": ()=>{
                    window.removeEventListener("scroll", handleScroll);
                }
            })["Navbar.useEffect"];
        }
    }["Navbar.useEffect"], []);
    /* ------------------------------------------------------------
     BLOQUEAR SCROLL CUANDO EL MENÚ MOBILE ESTÁ ABIERTO
  ------------------------------------------------------------ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Navbar.useEffect": ()=>{
            if (mobileMenuOpen) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "";
            }
            return ({
                "Navbar.useEffect": ()=>{
                    document.body.style.overflow = "";
                }
            })["Navbar.useEffect"];
        }
    }["Navbar.useEffect"], [
        mobileMenuOpen
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].header, {
                initial: {
                    opacity: 0,
                    y: -20
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    duration: 0.65,
                    ease: "easeOut"
                },
                className: `
          fixed inset-x-0 top-0 z-50
          transition-all duration-500
          ${scrolled ? `
                bg-white/92
                shadow-[0_10px_40px_rgba(16,16,36,0.08)]
                backdrop-blur-xl
              ` : `
                bg-white/80
                backdrop-blur-lg
              `}
        `,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `
              flex items-center justify-between
              transition-all duration-500
              ${scrolled ? "h-[72px]" : "h-[84px]"}
            `,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    "aria-label": "Ir al inicio de SmartPro",
                                    className: "group flex items-center gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                            whileHover: {
                                                y: -2,
                                                scale: 1.03
                                            },
                                            whileTap: {
                                                scale: 0.98
                                            },
                                            transition: {
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 22
                                            },
                                            className: "\n                  relative\n                  flex\n                  h-[52px]\n                  w-[58px]\n                  items-center\n                  justify-center\n                  overflow-hidden\n                  rounded-2xl\n                  border\n                  border-primary/15\n                  bg-white\n                  shadow-[0_8px_30px_rgba(109,40,217,0.12)]\n                  transition-shadow\n                  duration-300\n\n                  group-hover:\n                  shadow-[0_12px_35px_rgba(109,40,217,0.20)]\n\n                  sm:h-[56px]\n                  sm:w-[62px]\n                ",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    "aria-hidden": "true",
                                                    className: "\n                    pointer-events-none\n                    absolute\n                    -bottom-7\n                    -right-7\n                    h-20\n                    w-20\n                    rounded-full\n                    bg-primary/20\n                    blur-2xl\n                  "
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Navbar.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    src: LOGOS.icon,
                                                    alt: "SmartPro",
                                                    width: 48,
                                                    height: 48,
                                                    priority: true,
                                                    className: "\n                    relative\n                    z-10\n                    h-auto\n                    w-[38px]\n                    object-contain\n                    transition-transform\n                    duration-500\n                    group-hover:scale-105\n                    sm:w-[42px]\n                  "
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Navbar.tsx",
                                                    lineNumber: 193,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 140,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative hidden sm:block",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                src: LOGOS.wordmark,
                                                alt: "SmartPro",
                                                width: 160,
                                                height: 50,
                                                priority: true,
                                                className: "\n                    h-auto\n                    w-[135px]\n                    object-contain\n                    transition-all\n                    duration-300\n                    lg:w-[150px]\n                  "
                                            }, void 0, false, {
                                                fileName: "[project]/section/Navbar.tsx",
                                                lineNumber: 216,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 215,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 133,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                    "aria-label": "Navegación principal",
                                    className: "\n                hidden\n                items-center\n                gap-1\n                lg:flex\n              ",
                                    children: NAV_ITEMS.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavItem, {
                                            href: item.href,
                                            label: item.label
                                        }, item.label, false, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 248,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 238,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "hidden lg:flex",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].a, {
                                        href: "#contacto",
                                        whileHover: {
                                            y: -2
                                        },
                                        whileTap: {
                                            scale: 0.97
                                        },
                                        className: "\n                  group\n                  relative\n                  inline-flex\n                  min-h-11\n                  items-center\n                  justify-center\n                  overflow-hidden\n                  rounded-full\n                  bg-primary\n                  px-6\n                  text-sm\n                  font-semibold\n                  text-white\n                  shadow-[0_10px_28px_rgba(109,40,217,0.20)]\n                  transition-all\n                  duration-300\n\n                  hover:\n                  bg-primary-hover\n                  hover:\n                  shadow-[0_14px_35px_rgba(109,40,217,0.28)]\n                ",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                "aria-hidden": "true",
                                                className: "\n                    absolute\n                    -left-10\n                    top-0\n                    h-full\n                    w-8\n                    rotate-12\n                    bg-white/20\n                    blur-md\n                    transition-all\n                    duration-700\n                    group-hover:left-[120%]\n                  "
                                            }, void 0, false, {
                                                fileName: "[project]/section/Navbar.tsx",
                                                lineNumber: 291,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "relative z-10",
                                                children: "Hablemos"
                                            }, void 0, false, {
                                                fileName: "[project]/section/Navbar.tsx",
                                                lineNumber: 308,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/section/Navbar.tsx",
                                        lineNumber: 257,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 256,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    "aria-label": mobileMenuOpen ? "Cerrar menú" : "Abrir menú",
                                    "aria-expanded": mobileMenuOpen,
                                    onClick: ()=>setMobileMenuOpen((current)=>!current),
                                    className: "\n                flex\n                h-11\n                w-11\n                items-center\n                justify-center\n                rounded-xl\n                border\n                border-border\n                bg-white\n                text-foreground\n                shadow-sm\n                transition-all\n                duration-300\n\n                hover:\n                border-primary/30\n\n                hover:\n                text-primary\n\n                lg:hidden\n              ",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                        mode: "wait",
                                        initial: false,
                                        children: mobileMenuOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                rotate: -90,
                                                scale: 0.8
                                            },
                                            animate: {
                                                opacity: 1,
                                                rotate: 0,
                                                scale: 1
                                            },
                                            exit: {
                                                opacity: 0,
                                                rotate: 90,
                                                scale: 0.8
                                            },
                                            transition: {
                                                duration: 0.2
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                size: 21
                                            }, void 0, false, {
                                                fileName: "[project]/section/Navbar.tsx",
                                                lineNumber: 368,
                                                columnNumber: 21
                                            }, this)
                                        }, "close", false, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 347,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                            initial: {
                                                opacity: 0,
                                                rotate: 90,
                                                scale: 0.8
                                            },
                                            animate: {
                                                opacity: 1,
                                                rotate: 0,
                                                scale: 1
                                            },
                                            exit: {
                                                opacity: 0,
                                                rotate: -90,
                                                scale: 0.8
                                            },
                                            transition: {
                                                duration: 0.2
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$menu$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Menu$3e$__["Menu"], {
                                                size: 22
                                            }, void 0, false, {
                                                fileName: "[project]/section/Navbar.tsx",
                                                lineNumber: 392,
                                                columnNumber: 21
                                            }, this)
                                        }, "menu", false, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 371,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/section/Navbar.tsx",
                                        lineNumber: 345,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 316,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Navbar.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/section/Navbar.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                        animate: {
                            opacity: scrolled ? 1 : 0.5
                        },
                        transition: {
                            duration: 0.3
                        },
                        className: "\n            h-px\n            w-full\n            bg-gradient-to-r\n            from-transparent\n            via-primary/20\n            to-transparent\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/Navbar.tsx",
                        lineNumber: 404,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/Navbar.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: mobileMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                            type: "button",
                            "aria-label": "Cerrar menú",
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            transition: {
                                duration: 0.25
                            },
                            onClick: ()=>setMobileMenuOpen(false),
                            className: "\n                fixed\n                inset-0\n                z-40\n                cursor-default\n                bg-navy/30\n                backdrop-blur-sm\n                lg:hidden\n              "
                        }, void 0, false, {
                            fileName: "[project]/section/Navbar.tsx",
                            lineNumber: 431,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: -20,
                                scale: 0.98
                            },
                            animate: {
                                opacity: 1,
                                y: 0,
                                scale: 1
                            },
                            exit: {
                                opacity: 0,
                                y: -20,
                                scale: 0.98
                            },
                            transition: {
                                duration: 0.3,
                                ease: "easeOut"
                            },
                            className: "\n                fixed\n                left-4\n                right-4\n                top-[92px]\n                z-50\n                overflow-hidden\n                rounded-[24px]\n                border\n                border-primary/10\n                bg-white/95\n                p-3\n                shadow-[0_20px_70px_rgba(16,16,36,0.16)]\n                backdrop-blur-xl\n                lg:hidden\n              ",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                    "aria-label": "Navegación móvil",
                                    className: "flex flex-col",
                                    children: NAV_ITEMS.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].a, {
                                            href: item.href,
                                            initial: {
                                                opacity: 0,
                                                x: -10
                                            },
                                            animate: {
                                                opacity: 1,
                                                x: 0
                                            },
                                            transition: {
                                                duration: 0.3,
                                                delay: index * 0.04
                                            },
                                            onClick: ()=>setMobileMenuOpen(false),
                                            className: "\n                      group\n                      flex\n                      min-h-12\n                      items-center\n                      justify-between\n                      rounded-xl\n                      px-4\n                      text-[15px]\n                      font-medium\n                      text-foreground\n                      transition-all\n                      duration-300\n\n                      hover:\n                      bg-primary/5\n\n                      hover:\n                      text-primary\n                    ",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: item.label
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Navbar.tsx",
                                                    lineNumber: 538,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    "aria-hidden": "true",
                                                    className: "\n                        h-1.5\n                        w-1.5\n                        rounded-full\n                        bg-primary\n                        opacity-0\n                        transition-all\n                        duration-300\n\n                        group-hover:\n                        opacity-100\n                      "
                                                }, void 0, false, {
                                                    fileName: "[project]/section/Navbar.tsx",
                                                    lineNumber: 540,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, item.label, true, {
                                            fileName: "[project]/section/Navbar.tsx",
                                            lineNumber: 501,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 499,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "\n                  mt-2\n                  border-t\n                  border-border\n                  pt-3\n                ",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].a, {
                                        href: "#contacto",
                                        whileTap: {
                                            scale: 0.98
                                        },
                                        onClick: ()=>setMobileMenuOpen(false),
                                        className: "\n                    flex\n                    min-h-12\n                    w-full\n                    items-center\n                    justify-center\n                    rounded-xl\n                    bg-gradient-to-r\n                    from-primary\n                    to-magenta\n                    px-5\n                    text-sm\n                    font-semibold\n                    text-white\n                  ",
                                        children: "Cuéntanos tu proyecto"
                                    }, void 0, false, {
                                        fileName: "[project]/section/Navbar.tsx",
                                        lineNumber: 569,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/section/Navbar.tsx",
                                    lineNumber: 561,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/section/Navbar.tsx",
                            lineNumber: 460,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/section/Navbar.tsx",
                    lineNumber: 428,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/section/Navbar.tsx",
                lineNumber: 426,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/Navbar.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_s(Navbar, "3dkQbJ67xTX3HLMt6OvJfxq79dI=");
_c = Navbar;
/* ============================================================
   NAV ITEM DESKTOP
============================================================ */ function NavItem({ label, href }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        className: "\n        group\n        relative\n        flex\n        h-11\n        items-center\n        px-4\n        text-sm\n        font-medium\n        text-foreground/75\n        transition-colors\n        duration-300\n        hover:text-primary\n      ",
        children: [
            label,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": "true",
                className: "\n          absolute\n          bottom-1.5\n          left-1/2\n          h-[2px]\n          w-0\n          -translate-x-1/2\n          rounded-full\n          bg-gradient-to-r\n          from-primary\n          to-magenta\n          transition-all\n          duration-300\n\n          group-hover:\n          w-5\n        "
            }, void 0, false, {
                fileName: "[project]/section/Navbar.tsx",
                lineNumber: 629,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/Navbar.tsx",
        lineNumber: 608,
        columnNumber: 5
    }, this);
}
_c1 = NavItem;
var _c, _c1;
__turbopack_context__.k.register(_c, "Navbar");
__turbopack_context__.k.register(_c1, "NavItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/section/PresentersSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PresentersSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/motion/dist/es/react.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.mjs [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/pause.mjs [app-client] (ecmascript) <export default as Pause>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/play.mjs [app-client] (ecmascript) <export default as Play>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
/* ============================================================
   PRESENTADORES
============================================================ */ const PRESENTERS = [
    {
        id: 1,
        name: "Kolinka Gavrilovics",
        role: "Modelo / Presentadora",
        video: "/videos/presenters/presenter-01.mov"
    },
    {
        id: 2,
        name: "Nicole Silva",
        role: "Modelo / Presentadora",
        video: "/videos/presenters/presenter-02.mov"
    },
    {
        id: 3,
        name: "Maritza Zúñiga",
        role: "Modelo / Presentadora",
        video: "/videos/presenters/presenter-03.mov"
    },
    {
        id: 4,
        name: "Presentadora SmartPro",
        role: "Modelo / Presentadora",
        video: "/videos/presenters/presenter-04.mov"
    }
];
const CAROUSEL_INTERVAL = 7000;
function PresentersSection() {
    _s();
    const [currentIndex, setCurrentIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    /*
   * Solo este presentador puede estar reproduciéndose.
   * Comenzamos con el primero.
   */ const [activePresenterId, setActivePresenterId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(PRESENTERS[0].id);
    const [itemsPerView, setItemsPerView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3);
    const [carouselPaused, setCarouselPaused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ==========================================================
     RESPONSIVE
  ========================================================== */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PresentersSection.useEffect": ()=>{
            const updateItemsPerView = {
                "PresentersSection.useEffect.updateItemsPerView": ()=>{
                    const width = window.innerWidth;
                    if (width < 768) {
                        setItemsPerView(1);
                    } else if (width < 1100) {
                        setItemsPerView(2);
                    } else {
                        setItemsPerView(3);
                    }
                }
            }["PresentersSection.useEffect.updateItemsPerView"];
            updateItemsPerView();
            window.addEventListener("resize", updateItemsPerView);
            return ({
                "PresentersSection.useEffect": ()=>{
                    window.removeEventListener("resize", updateItemsPerView);
                }
            })["PresentersSection.useEffect"];
        }
    }["PresentersSection.useEffect"], []);
    const maxIndex = Math.max(0, PRESENTERS.length - itemsPerView);
    /* ==========================================================
     CAROUSEL
  ========================================================== */ const nextSlide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PresentersSection.useCallback[nextSlide]": ()=>{
            setCurrentIndex({
                "PresentersSection.useCallback[nextSlide]": (current)=>current >= maxIndex ? 0 : current + 1
            }["PresentersSection.useCallback[nextSlide]"]);
        }
    }["PresentersSection.useCallback[nextSlide]"], [
        maxIndex
    ]);
    const previousSlide = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "PresentersSection.useCallback[previousSlide]": ()=>{
            setCurrentIndex({
                "PresentersSection.useCallback[previousSlide]": (current)=>current <= 0 ? maxIndex : current - 1
            }["PresentersSection.useCallback[previousSlide]"]);
        }
    }["PresentersSection.useCallback[previousSlide]"], [
        maxIndex
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PresentersSection.useEffect": ()=>{
            if (carouselPaused || maxIndex === 0) return;
            const timer = window.setInterval({
                "PresentersSection.useEffect.timer": ()=>{
                    nextSlide();
                }
            }["PresentersSection.useEffect.timer"], CAROUSEL_INTERVAL);
            return ({
                "PresentersSection.useEffect": ()=>{
                    window.clearInterval(timer);
                }
            })["PresentersSection.useEffect"];
        }
    }["PresentersSection.useEffect"], [
        carouselPaused,
        maxIndex,
        nextSlide
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PresentersSection.useEffect": ()=>{
            if (currentIndex > maxIndex) {
                setCurrentIndex(maxIndex);
            }
        }
    }["PresentersSection.useEffect"], [
        currentIndex,
        maxIndex
    ]);
    /* ==========================================================
     REPRODUCCIÓN
  ========================================================== */ const handlePlayPresenter = (id)=>{
        /*
     * Al seleccionar otro video,
     * activePresenterId cambia.
     *
     * Cada card detectará el cambio y:
     * - pausará su video si no está activo
     * - reproducirá el video seleccionado
     */ setActivePresenterId(id);
    };
    const handlePausePresenter = (id)=>{
        if (activePresenterId === id) {
            setActivePresenterId(null);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "voceros",
        className: "\n        relative\n        overflow-hidden\n        bg-background\n        py-20\n        sm:py-24\n        lg:py-28\n      ",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "\n          pointer-events-none\n          absolute\n          left-1/2\n          top-0\n          h-[360px]\n          w-[900px]\n          -translate-x-1/2\n          rounded-full\n          bg-primary/5\n          blur-[120px]\n        "
            }, void 0, false, {
                fileName: "[project]/section/PresentersSection.tsx",
                lineNumber: 161,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "\n          pointer-events-none\n          absolute\n          bottom-0\n          right-0\n          h-[300px]\n          w-[300px]\n          rounded-full\n          bg-magenta/5\n          blur-[100px]\n        "
            }, void 0, false, {
                fileName: "[project]/section/PresentersSection.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          relative\n          mx-auto\n          max-w-[1400px]\n          px-5\n          sm:px-6\n          lg:px-10\n        ",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto mb-12 max-w-4xl text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].p, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true,
                                    amount: 0.5
                                },
                                transition: {
                                    duration: 0.5
                                },
                                className: "\n              mb-4\n              text-xs\n              font-semibold\n              uppercase\n              tracking-[0.34em]\n              text-primary\n              sm:text-sm\n            ",
                                children: "Voceros para tu marca"
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].h2, {
                                initial: {
                                    opacity: 0,
                                    y: 18
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true,
                                    amount: 0.4
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.05
                                },
                                className: "\n              text-balance\n              text-4xl\n              font-bold\n              leading-[1.05]\n              tracking-[-0.04em]\n              text-foreground\n              sm:text-5xl\n              lg:text-[58px]\n            ",
                                children: [
                                    "El rostro de",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "\n                bg-gradient-to-r\n                from-primary\n                via-violet-500\n                to-magenta\n                bg-clip-text\n                text-transparent\n              ",
                                        children: "tu marca"
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 265,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block",
                                        children: "frente a la cámara."
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 277,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 236,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    scaleX: 0
                                },
                                whileInView: {
                                    opacity: 1,
                                    scaleX: 1
                                },
                                viewport: {
                                    once: true
                                },
                                transition: {
                                    duration: 0.5,
                                    delay: 0.15
                                },
                                className: "\n              mx-auto\n              my-6\n              h-[3px]\n              w-14\n              origin-center\n              rounded-full\n              bg-gradient-to-r\n              from-primary\n              to-magenta\n            "
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 282,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].p, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.15
                                },
                                className: "\n              mx-auto\n              max-w-3xl\n              text-pretty\n              text-base\n              leading-7\n              text-muted\n              sm:text-lg\n            ",
                                children: "Contamos con presentadores y modelos profesionales para representar tu empresa, producto o servicio en videos, comerciales y contenido para redes sociales."
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 313,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.22
                                },
                                className: "mt-7",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/voceros",
                                    className: "\n                group\n                inline-flex\n                min-h-12\n                items-center\n                justify-center\n                gap-3\n                rounded-full\n                bg-primary\n                px-7\n                text-sm\n                font-semibold\n                text-white\n                shadow-[0_10px_30px_rgba(109,40,217,0.20)]\n                transition-all\n                duration-300\n                hover:-translate-y-0.5\n                hover:bg-primary-hover\n                hover:shadow-[0_15px_35px_rgba(109,40,217,0.28)]\n              ",
                                    children: [
                                        "Conoce más",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                            size: 17,
                                            strokeWidth: 1.8,
                                            className: "\n                  transition-transform\n                  duration-300\n                  group-hover:translate-x-1\n                "
                                        }, void 0, false, {
                                            fileName: "[project]/section/PresentersSection.tsx",
                                            lineNumber: 388,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/section/PresentersSection.tsx",
                                    lineNumber: 364,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 346,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        onMouseEnter: ()=>setCarouselPaused(true),
                        onMouseLeave: ()=>setCarouselPaused(false),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                                type: "button",
                                "aria-label": "Mostrar presentadores anteriores",
                                onClick: previousSlide,
                                whileTap: {
                                    scale: 0.92
                                },
                                className: "\n              absolute\n              left-0\n              top-[45%]\n              z-20\n              hidden\n              h-12\n              w-12\n              -translate-x-1/2\n              -translate-y-1/2\n              items-center\n              justify-center\n              rounded-full\n              border\n              border-primary/10\n              bg-white/95\n              text-primary\n              shadow-[0_8px_28px_rgba(16,16,36,0.10)]\n              backdrop-blur-md\n              transition-all\n              duration-300\n              hover:scale-105\n              hover:bg-primary\n              hover:text-white\n              md:flex\n            ",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                    size: 23,
                                    strokeWidth: 2
                                }, void 0, false, {
                                    fileName: "[project]/section/PresentersSection.tsx",
                                    lineNumber: 446,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 412,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                    animate: {
                                        x: `-${currentIndex * (100 / itemsPerView)}%`
                                    },
                                    transition: {
                                        duration: 0.65,
                                        ease: [
                                            0.22,
                                            1,
                                            0.36,
                                            1
                                        ]
                                    },
                                    className: "flex",
                                    children: PRESENTERS.map((presenter, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "\n                      shrink-0\n                      px-2.5\n                    ",
                                            style: {
                                                width: `${100 / itemsPerView}%`
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PresenterVideoCard, {
                                                presenter: presenter,
                                                index: index,
                                                isActive: activePresenterId === presenter.id,
                                                onPlay: ()=>handlePlayPresenter(presenter.id),
                                                onPause: ()=>handlePausePresenter(presenter.id)
                                            }, void 0, false, {
                                                fileName: "[project]/section/PresentersSection.tsx",
                                                lineNumber: 475,
                                                columnNumber: 19
                                            }, this)
                                        }, presenter.id, false, {
                                            fileName: "[project]/section/PresentersSection.tsx",
                                            lineNumber: 465,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/section/PresentersSection.tsx",
                                    lineNumber: 454,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 453,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                                type: "button",
                                "aria-label": "Mostrar siguientes presentadores",
                                onClick: nextSlide,
                                whileTap: {
                                    scale: 0.92
                                },
                                className: "\n              absolute\n              right-0\n              top-[45%]\n              z-20\n              hidden\n              h-12\n              w-12\n              translate-x-1/2\n              -translate-y-1/2\n              items-center\n              justify-center\n              rounded-full\n              border\n              border-primary/10\n              bg-white/95\n              text-primary\n              shadow-[0_8px_28px_rgba(16,16,36,0.10)]\n              backdrop-blur-md\n              transition-all\n              duration-300\n              hover:scale-105\n              hover:bg-primary\n              hover:text-white\n              md:flex\n            ",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                    size: 23,
                                    strokeWidth: 2
                                }, void 0, false, {
                                    fileName: "[project]/section/PresentersSection.tsx",
                                    lineNumber: 523,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 489,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "\n              mt-7\n              flex\n              items-center\n              justify-center\n              gap-3\n              md:hidden\n            ",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        "aria-label": "Presentador anterior",
                                        onClick: previousSlide,
                                        className: "\n                flex\n                h-11\n                w-11\n                items-center\n                justify-center\n                rounded-full\n                border\n                border-primary/15\n                bg-white\n                text-primary\n                shadow-sm\n              ",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/section/PresentersSection.tsx",
                                            lineNumber: 558,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 540,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        "aria-label": "Presentador siguiente",
                                        onClick: nextSlide,
                                        className: "\n                flex\n                h-11\n                w-11\n                items-center\n                justify-center\n                rounded-full\n                border\n                border-primary/15\n                bg-white\n                text-primary\n                shadow-sm\n              ",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/section/PresentersSection.tsx",
                                            lineNumber: 579,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 561,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 530,
                                columnNumber: 11
                            }, this),
                            maxIndex > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "\n                mt-8\n                flex\n                items-center\n                justify-center\n                gap-2\n              ",
                                children: Array.from({
                                    length: maxIndex + 1
                                }).map((_, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        "aria-label": `Ir al grupo ${index + 1}`,
                                        onClick: ()=>setCurrentIndex(index),
                                        className: "\n                    flex\n                    h-6\n                    items-center\n                    justify-center\n                  ",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `
                      block
                      h-2
                      rounded-full
                      transition-all
                      duration-300

                      ${currentIndex === index ? "w-7 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/40"}
                    `
                                        }, void 0, false, {
                                            fileName: "[project]/section/PresentersSection.tsx",
                                            lineNumber: 612,
                                            columnNumber: 19
                                        }, this)
                                    }, index, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 600,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 588,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 405,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/PresentersSection.tsx",
                lineNumber: 192,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/PresentersSection.tsx",
        lineNumber: 146,
        columnNumber: 5
    }, this);
}
_s(PresentersSection, "ER8v/Wvtmoi6NT94rSQf3wfBxH0=");
_c = PresentersSection;
/* ============================================================
   VIDEO CARD
============================================================ */ function PresenterVideoCard({ presenter, index, isActive, onPlay, onPause }) {
    _s1();
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isActuallyPlaying, setIsActuallyPlaying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ==========================================================
     CONTROL CENTRALIZADO DEL VIDEO
  ========================================================== */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PresenterVideoCard.useEffect": ()=>{
            const video = videoRef.current;
            if (!video) return;
            if (isActive) {
                const playVideo = {
                    "PresenterVideoCard.useEffect.playVideo": async ()=>{
                        try {
                            await video.play();
                        } catch  {
                            /*
           * Algunos navegadores pueden bloquear autoplay.
           * En ese caso aparecerá el botón Play.
           */ setIsActuallyPlaying(false);
                        }
                    }
                }["PresenterVideoCard.useEffect.playVideo"];
                playVideo();
            } else {
                video.pause();
            }
        }
    }["PresenterVideoCard.useEffect"], [
        isActive
    ]);
    /* ==========================================================
     CLICK SOBRE EL VIDEO
  ========================================================== */ const handleVideoClick = ()=>{
        if (isActive && isActuallyPlaying) {
            onPause();
            return;
        }
        /*
     * Cambiar activePresenterId hará que
     * automáticamente todos los demás
     * videos se pausen.
     */ onPlay();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].article, {
        initial: {
            opacity: 0,
            y: 28
        },
        whileInView: {
            opacity: 1,
            y: 0
        },
        viewport: {
            once: true,
            amount: 0.15
        },
        transition: {
            duration: 0.55,
            delay: index * 0.06
        },
        className: "group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "\n          relative\n          mx-auto\n          aspect-[9/16]\n          w-full\n          max-h-[610px]\n          overflow-hidden\n          rounded-[24px]\n          bg-navy\n          shadow-[0_12px_35px_rgba(16,16,36,0.09)]\n          transition-all\n          duration-500\n          group-hover:\n          shadow-[0_18px_45px_rgba(16,16,36,0.14)]\n        ",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                        ref: videoRef,
                        src: presenter.video,
                        muted: true,
                        loop: true,
                        playsInline: true,
                        preload: presenter.id === PRESENTERS[0].id ? "auto" : "metadata",
                        onClick: handleVideoClick,
                        onPlay: ()=>setIsActuallyPlaying(true),
                        onPause: ()=>setIsActuallyPlaying(false),
                        className: "\n            h-full\n            w-full\n            cursor-pointer\n            object-cover\n            object-center\n            transition-transform\n            duration-700\n            ease-out\n            group-hover:scale-[1.015]\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 752,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: "\n            pointer-events-none\n            absolute\n            inset-0\n            bg-gradient-to-t\n            from-black/35\n            via-transparent\n            to-black/5\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 777,
                        columnNumber: 9
                    }, this),
                    isActive && isActuallyPlaying && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "\n                pointer-events-none\n                absolute\n                right-4\n                top-4\n                z-10\n                flex\n                items-center\n                gap-2\n                rounded-full\n                bg-black/35\n                px-3\n                py-1.5\n                text-[11px]\n                font-medium\n                text-white\n                backdrop-blur-md\n              ",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "\n                  relative\n                  flex\n                  h-2\n                  w-2\n                ",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "\n                    absolute\n                    inline-flex\n                    h-full\n                    w-full\n                    animate-ping\n                    rounded-full\n                    bg-white/60\n                  "
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 823,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "\n                    relative\n                    inline-flex\n                    h-2\n                    w-2\n                    rounded-full\n                    bg-white\n                  "
                                    }, void 0, false, {
                                        fileName: "[project]/section/PresentersSection.tsx",
                                        lineNumber: 835,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/section/PresentersSection.tsx",
                                lineNumber: 815,
                                columnNumber: 13
                            }, this),
                            "Reproduciendo"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 795,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].button, {
                        type: "button",
                        "aria-label": isActuallyPlaying ? `Pausar video de ${presenter.name}` : `Reproducir video de ${presenter.name}`,
                        onClick: handleVideoClick,
                        whileHover: {
                            scale: 1.08
                        },
                        whileTap: {
                            scale: 0.94
                        },
                        className: "\n            absolute\n            bottom-5\n            left-5\n            z-20\n            flex\n            h-12\n            w-12\n            items-center\n            justify-center\n            rounded-full\n            border\n            border-white/70\n            bg-black/30\n            text-white\n            shadow-lg\n            backdrop-blur-md\n            transition-all\n            duration-300\n            hover:border-primary\n            hover:bg-primary\n          ",
                        children: isActuallyPlaying ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$pause$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Pause$3e$__["Pause"], {
                            size: 18,
                            fill: "currentColor",
                            strokeWidth: 1.5
                        }, void 0, false, {
                            fileName: "[project]/section/PresentersSection.tsx",
                            lineNumber: 892,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$play$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Play$3e$__["Play"], {
                            size: 18,
                            fill: "currentColor",
                            strokeWidth: 1.5,
                            className: "ml-0.5"
                        }, void 0, false, {
                            fileName: "[project]/section/PresentersSection.tsx",
                            lineNumber: 894,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 854,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: "\n            pointer-events-none\n            absolute\n            inset-x-0\n            bottom-0\n            h-40\n            bg-gradient-to-t\n            from-primary/15\n            via-transparent\n            to-transparent\n            opacity-0\n            transition-opacity\n            duration-500\n            group-hover:opacity-100\n          "
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 907,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/PresentersSection.tsx",
                lineNumber: 735,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-1 pt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "\n            text-lg\n            font-semibold\n            tracking-[-0.025em]\n            text-foreground\n            transition-colors\n            duration-300\n            group-hover:text-primary\n          ",
                        children: presenter.name
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 932,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "\n            mt-1\n            text-sm\n            font-medium\n            text-primary\n            sm:text-[15px]\n          ",
                        children: presenter.role
                    }, void 0, false, {
                        fileName: "[project]/section/PresentersSection.tsx",
                        lineNumber: 946,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/PresentersSection.tsx",
                lineNumber: 931,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/PresentersSection.tsx",
        lineNumber: 712,
        columnNumber: 5
    }, this);
}
_s1(PresenterVideoCard, "ZAHtmP+H7ww2CIaZ7Wr/P5zkbzo=");
_c1 = PresenterVideoCard;
var _c, _c1;
__turbopack_context__.k.register(_c, "PresentersSection");
__turbopack_context__.k.register(_c1, "PresenterVideoCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/section/ServicesSection.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ServicesSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/motion/dist/es/react.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.mjs [app-client] (ecmascript) <export default as ArrowRight>");
"use client";
;
;
;
;
;
const services = [
    {
        number: "01",
        title: "Desarrollo Web",
        image: "/images/services/service-01.png",
        href: "/servicios/desarrollo-web"
    },
    {
        number: "02",
        title: "Campañas Publicitarias",
        image: "/images/services/service-02.png",
        href: "/servicios/campanas-publicitarias"
    },
    {
        number: "03",
        title: "Redes Sociales & Contenido",
        image: "/images/services/service-03.png",
        href: "/servicios/redes-sociales"
    },
    {
        number: "04",
        title: "Automatización & Conversión",
        image: "/images/services/service-04.png",
        href: "/servicios/automatizacion"
    },
    {
        number: "05",
        title: "Producción Audiovisual",
        image: "/images/services/service-05.png",
        href: "/servicios/produccion-audiovisual"
    },
    {
        number: "06",
        title: "Membresías & Negocios",
        image: "/images/services/service-06.png",
        href: "/servicios/membresias"
    }
];
function ServicesSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "servicios",
        className: "relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": "true",
                className: "\n          pointer-events-none\n          absolute left-1/2 top-0\n          h-72 w-[720px]\n          -translate-x-1/2\n          rounded-full\n          bg-primary/5\n          blur-[100px]\n        "
            }, void 0, false, {
                fileName: "[project]/section/ServicesSection.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mx-auto mb-12 max-w-4xl text-center lg:mb-14",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].p, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true,
                                    amount: 0.4
                                },
                                transition: {
                                    duration: 0.5
                                },
                                className: "\n              mb-4\n              text-xs font-semibold\n              uppercase\n              tracking-[0.35em]\n              text-primary\n              sm:text-sm\n            ",
                                children: "Capacidades"
                            }, void 0, false, {
                                fileName: "[project]/section/ServicesSection.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].h2, {
                                initial: {
                                    opacity: 0,
                                    y: 18
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true,
                                    amount: 0.35
                                },
                                transition: {
                                    duration: 0.6,
                                    delay: 0.05
                                },
                                className: "\n              text-balance\n              text-4xl\n              font-bold\n              leading-[1.05]\n              tracking-[-0.04em]\n              text-foreground\n              sm:text-5xl\n              lg:text-[58px]\n            ",
                                children: [
                                    "Todo lo que tu empresa necesita",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block",
                                        children: [
                                            "para",
                                            " ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "\n                  bg-gradient-to-r\n                  from-primary\n                  via-violet-500\n                  to-magenta\n                  bg-clip-text\n                  text-transparent\n                ",
                                                children: "crecer en digital."
                                            }, void 0, false, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 109,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 107,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/section/ServicesSection.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    scaleX: 0
                                },
                                whileInView: {
                                    opacity: 1,
                                    scaleX: 1
                                },
                                viewport: {
                                    once: true
                                },
                                transition: {
                                    duration: 0.5,
                                    delay: 0.15
                                },
                                className: "\n              mx-auto my-6\n              h-[3px]\n              w-14\n              origin-center\n              rounded-full\n              bg-gradient-to-r\n              from-primary\n              to-magenta\n            "
                            }, void 0, false, {
                                fileName: "[project]/section/ServicesSection.tsx",
                                lineNumber: 124,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].div, {
                                initial: {
                                    opacity: 0,
                                    y: 12
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true
                                },
                                transition: {
                                    duration: 0.5,
                                    delay: 0.2
                                },
                                className: "\n              flex flex-wrap\n              items-center justify-center\n              gap-x-4 gap-y-2\n              text-sm\n              font-medium\n              text-muted\n              sm:text-base\n            ",
                                children: [
                                    "Estrategia",
                                    "Tecnología",
                                    "Automatización",
                                    "Contenido",
                                    "Ventas"
                                ].map((item, index, items)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: item
                                            }, void 0, false, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 164,
                                                columnNumber: 17
                                            }, this),
                                            index < items.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-primary",
                                                children: "•"
                                            }, void 0, false, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 167,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, item, true, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 163,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/section/ServicesSection.tsx",
                                lineNumber: 141,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/section/ServicesSection.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
                        children: services.map((service, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$motion$2f$dist$2f$es$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["motion"].article, {
                                initial: {
                                    opacity: 0,
                                    y: 28
                                },
                                whileInView: {
                                    opacity: 1,
                                    y: 0
                                },
                                viewport: {
                                    once: true,
                                    amount: 0.2
                                },
                                transition: {
                                    duration: 0.55,
                                    delay: index * 0.06,
                                    ease: "easeOut"
                                },
                                className: "\n                group\n                relative\n                min-h-[360px]\n                overflow-hidden\n                rounded-[22px]\n                bg-navy\n                sm:min-h-[390px]\n                lg:min-h-[420px]\n              ",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: service.image,
                                        alt: service.title,
                                        fill: true,
                                        className: "\n                  object-cover\n                  transition-transform\n                  duration-700\n                  ease-out\n                  group-hover:scale-[1.045]\n                ",
                                        sizes: "\n                  (max-width: 767px) 100vw,\n                  (max-width: 1023px) 50vw,\n                  33vw\n                "
                                    }, void 0, false, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "\n                  absolute inset-0\n                  bg-gradient-to-tr\n                  from-black/90\n                  via-black/45\n                  to-black/5\n                "
                                    }, void 0, false, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 221,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "\n                  absolute inset-x-0 bottom-0\n                  h-2/3\n                  bg-gradient-to-t\n                  from-black/80\n                  via-black/20\n                  to-transparent\n                "
                                    }, void 0, false, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 232,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        "aria-hidden": "true",
                                        className: "\n                  pointer-events-none\n                  absolute -left-16 bottom-[-80px]\n                  h-52 w-52\n                  rounded-full\n                  bg-primary/20\n                  blur-[80px]\n                  opacity-0\n                  transition-opacity\n                  duration-500\n                  group-hover:opacity-100\n                "
                                    }, void 0, false, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 244,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative z-10 flex h-full min-h-[360px] flex-col p-6 sm:min-h-[390px] lg:min-h-[420px] lg:p-7",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "\n                      block\n                      text-2xl\n                      font-semibold\n                      tracking-[-0.03em]\n                      text-violet-300\n                    ",
                                                        children: service.number
                                                    }, void 0, false, {
                                                        fileName: "[project]/section/ServicesSection.tsx",
                                                        lineNumber: 264,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "\n                      mt-2\n                      h-[2px]\n                      w-7\n                      rounded-full\n                      bg-gradient-to-r\n                      from-primary\n                      to-magenta\n                    "
                                                    }, void 0, false, {
                                                        fileName: "[project]/section/ServicesSection.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 263,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "\n                    mt-6\n                    max-w-[280px]\n                    text-[26px]\n                    font-semibold\n                    leading-[1.08]\n                    tracking-[-0.035em]\n                    text-white\n                    sm:text-[28px]\n                  ",
                                                children: service.title
                                            }, void 0, false, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 290,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-auto pt-10",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: service.href,
                                                    className: "\n                      group/button\n                      inline-flex\n                      min-h-11\n                      items-center\n                      gap-8\n                      rounded-full\n                      border\n                      border-primary/80\n                      bg-black/10\n                      px-5\n                      text-sm\n                      font-semibold\n                      text-white\n                      backdrop-blur-sm\n                      transition-all\n                      duration-300\n                      hover:border-magenta\n                      hover:bg-primary/15\n                    ",
                                                    children: [
                                                        "Ver servicio",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                                                            size: 16,
                                                            strokeWidth: 1.8,
                                                            className: "\n                        transition-transform\n                        duration-300\n                        group-hover/button:translate-x-1\n                      "
                                                        }, void 0, false, {
                                                            fileName: "[project]/section/ServicesSection.tsx",
                                                            lineNumber: 331,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/section/ServicesSection.tsx",
                                                    lineNumber: 307,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/section/ServicesSection.tsx",
                                                lineNumber: 306,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/section/ServicesSection.tsx",
                                        lineNumber: 261,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, service.number, true, {
                                fileName: "[project]/section/ServicesSection.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/section/ServicesSection.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/section/ServicesSection.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/section/ServicesSection.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
_c = ServicesSection;
var _c;
__turbopack_context__.k.register(_c, "ServicesSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=section_1wj793r._.js.map