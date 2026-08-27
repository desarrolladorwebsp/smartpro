(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
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

//# sourceMappingURL=section_1o7wrfz._.js.map