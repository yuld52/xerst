"use client";

import {
  type ReactNode,
  type HTMLAttributes,
  type ElementType,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  createElement,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface SharedLayoutBgProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  inset?: number;
  pillClassName?: string;
  pillContainerClassName?: string;
}

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      as = "div",
      children,
      className,
      inset = 0,
      pillClassName,
      pillContainerClassName,
      ...rest
    },
    ref,
  ) {
    const containerRef = useRef<HTMLElement>(null);
    const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

    const handlePointerMove = useCallback((e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest(
        "[data-slot='sidebar-menu-item']",
      );
      if (!target || !containerRef.current) {
        setHoveredRect(null);
        return;
      }
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setHoveredRect(
        new DOMRect(
          targetRect.x - containerRect.x,
          targetRect.y - containerRect.y,
          targetRect.width,
          targetRect.height,
        ),
      );
    }, []);

    const handlePointerLeave = useCallback(() => {
      setHoveredRect(null);
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      el.addEventListener("pointermove", handlePointerMove);
      el.addEventListener("pointerleave", handlePointerLeave);
      return () => {
        el.removeEventListener("pointermove", handlePointerMove);
        el.removeEventListener("pointerleave", handlePointerLeave);
      };
    }, [handlePointerMove, handlePointerLeave]);

    const setRefs = useCallback(
      (node: HTMLElement | null) => {
        (containerRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      },
      [ref],
    );

    return createElement(
      as,
      { ...rest, ref: setRefs, className: cn("relative", className) },
      <>
        <AnimatePresence>
          {hoveredRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn("pointer-events-none absolute z-0", pillContainerClassName)}
              style={{
                top: hoveredRect.y - inset,
                left: hoveredRect.x - inset,
                width: hoveredRect.width + inset * 2,
                height: hoveredRect.height + inset * 2,
              }}
            >
              <motion.div
                layoutId="shared-layout-bg-pill"
                className={cn("size-full", pillClassName)}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </>,
    );
  },
);
