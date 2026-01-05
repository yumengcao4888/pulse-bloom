"use client";

import { useState } from "react";
import { useDemoDialog } from "@/components/home/demo-dialog";
import Popover from "@/components/shared/popover";
import Tooltip from "@/components/shared/tooltip";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/components/shared/locale-provider";

export default function DemoGrid() {
  const { Dialog, setOpen } = useDemoDialog();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <Dialog />
      <button
        onClick={() => setOpen(true)}
        className="flex w-36 items-center justify-center rounded-md border border-gray-300 px-3 py-2 transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
      >
        <p className="text-gray-600">{t("template.componentGrid.modal")}</p>
      </button>
      <Popover
        content={
          <div className="w-full rounded-md bg-white p-2 sm:w-40">
            <button className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200">
              {t("template.componentGrid.item1")}
            </button>
            <button className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200">
              {t("template.componentGrid.item2")}
            </button>
            <button className="flex w-full items-center justify-start space-x-2 rounded-md p-2 text-left text-sm transition-all duration-75 hover:bg-gray-100 active:bg-gray-200">
              {t("template.componentGrid.item3")}
            </button>
          </div>
        }
        open={popoverOpen}
        setOpen={setPopoverOpen}
      >
        <button
          onClick={() => setPopoverOpen(!popoverOpen)}
          className="flex w-36 items-center justify-between rounded-md border border-gray-300 px-4 py-2 transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100"
        >
          <p className="text-gray-600">{t("template.componentGrid.popover")}</p>
          <ChevronDown
            className={`h-4 w-4 text-gray-600 transition-all ${popoverOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </Popover>
      <Tooltip content={t("template.componentGrid.tooltipContent")}>
        <div className="flex w-36 cursor-default items-center justify-center rounded-md border border-gray-300 px-3 py-2 transition-all duration-75 hover:border-gray-800 focus:outline-none active:bg-gray-100">
          <p className="text-gray-600">{t("template.componentGrid.tooltip")}</p>
        </div>
      </Tooltip>
    </div>
  );
}
