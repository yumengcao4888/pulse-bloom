"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import useMediaQuery from "@/lib/hooks/use-media-query";

export default function Modal({
  children,
  className,
  open,
  setOpen,
  title = "Modal",
}: {
  children: React.ReactNode;
  className?: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  title?: string;
}) {
  const { isMobile } = useMediaQuery();
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!isMobile || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateOffset = () => {
      const offset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardOffset(offset);
    };

    updateOffset();
    viewport.addEventListener("resize", updateOffset);
    viewport.addEventListener("scroll", updateOffset);
    return () => {
      viewport.removeEventListener("resize", updateOffset);
      viewport.removeEventListener("scroll", updateOffset);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-gray-100 bg-opacity-10 backdrop-blur" />
        <Drawer.Portal>
          <Drawer.Content
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 mt-24 max-h-[85dvh] overflow-y-auto rounded-t-[10px] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]",
              className,
            )}
            style={
              keyboardOffset > 0
                ? { transform: `translateY(-${keyboardOffset}px)` }
                : undefined
            }
          >
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <div className="sticky top-0 z-20 flex w-full items-center justify-center rounded-t-[10px] bg-inherit">
              <div className="my-3 h-1 w-12 rounded-full bg-gray-300" />
            </div>
            {children}
          </Drawer.Content>
          <Drawer.Overlay />
        </Drawer.Portal>
      </Drawer.Root>
    );
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          // for detecting when there's an active opened modal
          id="modal-backdrop"
          className="animate-fade-in fixed inset-0 z-40 bg-gray-100 bg-opacity-50 backdrop-blur-md"
        />
        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "animate-scale-in fixed inset-0 z-40 m-auto max-h-fit w-full max-w-md overflow-hidden border border-gray-200 bg-white p-0 shadow-xl md:rounded-2xl",
            className,
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
