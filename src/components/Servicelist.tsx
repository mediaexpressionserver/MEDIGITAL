"use client";

import React, { useState } from "react";
import Image from "next/image";

export type ServiceItem = {
  id?: string | number;
  label: string;
  iconSrc?: string;
  iconAlt?: string;
  description?: string;
};

type Props = {
  items: ServiceItem[];
  pillHeight?: number;
  iconSize?: number;
  iconInnerScale?: number;
  overlap?: number;
};

const ServicePillList: React.FC<Props> = ({
  items,
  pillHeight = 56,
  iconSize = 64,
  iconInnerScale = 0.75,
  overlap = 0.4,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ul role="list" className="space-y-6">
      {items.map((it, idx) => {
        const innerSize = Math.max(
          20,
          Math.round(iconSize * iconInnerScale)
        );
        const iconSrc = it.iconSrc?.trim();

        return (
          <li key={it.id ?? idx} className="relative">
            <div className="flex w-full items-start">
              {/* Decorative logo; it is not interactive. */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative z-20 flex shrink-0 items-center justify-center rounded-full bg-white shadow-md"
                style={{
                  width: iconSize,
                  height: iconSize,
                  marginLeft: -iconSize * overlap,
                  marginTop: (pillHeight - iconSize) / 2,
                }}
              >
                {iconSrc && (
                  <div
                    className="relative"
                    style={{ width: innerSize, height: innerSize }}
                  >
                    <Image
                      src={iconSrc}
                      alt=""
                      fill
                      sizes={`${innerSize}px`}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {/* The orange pill and white description expand in the list flow. */}
              <div
                tabIndex={0}
                role="group"
                aria-label={it.label}
                className={`relative min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-800 ${
                  activeIndex === idx ? "z-30" : "z-10"
                }`}
                style={{ marginLeft: -iconSize * 0.2 }}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(idx)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setActiveIndex(null);
                  }
                }}
              >
                <div
                  className={`pointer-events-auto flex items-center rounded-full bg-[#EEAA45] px-6 shadow-inner transition-[border-radius] duration-200 ${
                    activeIndex === idx ? "rounded-b-none" : ""
                  }`}
                  style={{ height: pillHeight * 0.92 }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onPointerEnter={() => setActiveIndex(idx)}
                >
                  <span className="pointer-events-none min-w-0 flex-1 truncate text-left text-base font-medium text-black">
                    {it.label}
                  </span>
                </div>

                <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${activeIndex === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="rounded-b-2xl bg-white px-6 pb-4 pt-3 text-left text-sm leading-relaxed text-gray-800 shadow-md">
                      {it.description ||
                        "More information about this service will be available soon."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default ServicePillList;
