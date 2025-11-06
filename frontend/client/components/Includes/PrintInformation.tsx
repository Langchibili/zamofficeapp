
// src/components/Includes/PrintInformation.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// If your Alert component uses a different API, replace this small inline alert with it.
import { format } from "date-fns";

type Company = {
  cost_per_page?: number;
  cost_per_color_print_per_page?: number;
  cost_per_laminated_doc?: number; // per page lamination
  cost_per_bound_doc?: number; // per page binding
  lamination_flat_price?: number; // flat per doc
  binding_flat_price?: number; // flat per doc
  hasColorPrints?: boolean;
  hasLamination?: boolean;
  hasBinding?: boolean;
  allowsPrintScheduling?: boolean;
};

type PrintObj = {
  id?: number | string;
  pdf_file?: {
    data?: {
      attributes?: {
        name?: string;
        url?: string;
      };
    };
  };
  file_pages_count?: number;
  cost_per_page?: number;
  cost_per_color_print_per_page?: number;
  // persisted preferences (if any)
  colored?: boolean;
  laminated?: boolean;
  bound?: boolean;
  copies?: number;
  scheduled?: boolean;
  scheduled_time?: string;
  state?: string;
  queue_position?: number;
};

type Props = {
  draftPrint?: PrintObj | null;   // matches your CompanyPage prop name
  company?: Company | null;
  setPrintPreferences?: (prefs: Record<string, any>) => void;
};

function trimFileNameMiddle(name?: string, max = 30) {
  if (!name) return "";
  if (name.length <= max) return name;
  const head = Math.floor((max - 3) / 2);
  const tail = max - 3 - head;
  return `${name.slice(0, head)}...${name.slice(name.length - tail)}`;
}

export default function PrintInformation({
  draftPrint,
  company,
  setPrintPreferences,
}: Props) {
  // State initialized from draftPrint (keeps UI and parent in sync)
  const [copies, setCopies] = useState<number>(draftPrint?.copies ?? 1);
  const [colored, setColored] = useState<boolean>(!!draftPrint?.colored);
  const [laminated, setLaminated] = useState<boolean>(!!draftPrint?.laminated);
  const [bound, setBound] = useState<boolean>(!!draftPrint?.bound);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Resync when draftPrint changes (e.g. after upload parent re-fetch)
  useEffect(() => {
    setCopies(draftPrint?.copies ?? 1);
    setColored(!!draftPrint?.colored);
    setLaminated(!!draftPrint?.laminated);
    setBound(!!draftPrint?.bound);
  }, [draftPrint?.id, draftPrint?.file_pages_count]);

  // Extract safe filename
  const fileName = draftPrint?.pdf_file?.data?.attributes?.name
    ?? draftPrint?.pdf_file?.data?.attributes?.url?.split("/").pop()
    ?? "Unknown file";

  // Pages fallback
  const totalPages = Math.max(1, draftPrint?.file_pages_count ?? 1);

  // Per-page costs (company preferred, fallback to print object if provided)
  const perPageBW = company?.cost_per_page ?? draftPrint?.cost_per_page ?? 0;
  const perPageColor = company?.cost_per_color_print_per_page ?? draftPrint?.cost_per_color_print_per_page ?? 0;

  // choose per-page rate depending on color selection — but only use color rate if > 0
  const selectedPerPage =
    colored && perPageColor > 0 ? perPageColor : perPageBW;

  // PAGE COST = per-page * pages (only if selectedPerPage > 0)
  const pageCost = selectedPerPage > 0 ? selectedPerPage * totalPages : 0;

  // LAMINATION: flat takes precedence, otherwise per-page
  const laminationFlat = company?.lamination_flat_price ?? 0;
  const laminationPerPage = company?.cost_per_laminated_doc ?? 0;
  const laminationCostPerCopy = (() => {
    if (!laminated) return 0;
    if (laminationFlat > 0) return laminationFlat;
    if (laminationPerPage > 0) return laminationPerPage * totalPages;
    return 0;
  })();

  // BINDING: only relevant when pages > 1
  const bindingFlat = company?.binding_flat_price ?? 0;
  const bindingPerPage = company?.cost_per_bound_doc ?? 0;
  const bindingCostPerCopy = (() => {
    if (!bound) return 0;
    if (totalPages <= 1) return 0; // enforce rule: cannot bind single-page
    if (bindingFlat > 0) return bindingFlat;
    if (bindingPerPage > 0) return bindingPerPage * totalPages;
    return 0;
  })();

  // cost per single copy (one printed document)
  const costPerCopy = pageCost + laminationCostPerCopy + bindingCostPerCopy;

  // total cost for requested copies
  const totalCost = costPerCopy * Math.max(1, copies);

  // Send full preferences & calculated costs upstream whenever anything changes
  useEffect(() => {
    if (!setPrintPreferences) return;
    setPrintPreferences({
      printId: draftPrint?.id,
      fileName,
      pages: totalPages,
      copies,
      colored,
      laminated,
      bound,
      pageCost,                // pages * per-page-rate
      perPageRate: selectedPerPage,
      laminationCostPerCopy,
      bindingCostPerCopy,
      costPerCopy,
      totalCost,
    });
  }, [
    draftPrint?.id,
    fileName,
    totalPages,
    copies,
    colored,
    laminated,
    bound,
    pageCost,
    selectedPerPage,
    laminationCostPerCopy,
    bindingCostPerCopy,
    costPerCopy,
    totalCost,
    setPrintPreferences
  ])

  // Helper: present cost or "N/A" when missing
  const formatZMW = (v: number) => `ZMW ${v.toFixed(2)}`;

  return (
    <Card>
      {/* Reduced padding around parent: CardContent uses small padding */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Print information</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={draftPrint?.state === "queued" ? "default" : "secondary"}>
              {draftPrint?.state ?? "unprinted"}
            </Badge>
            {draftPrint?.queue_position && (
              <Badge variant="outline" className="font-mono">
                #{draftPrint.queue_position}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 space-y-2">
        {/* FILE */}
        <div className="text-sm">
          <div className="font-medium">
            FILE: {trimFileNameMiddle(fileName)}
          </div>
          <div className="text-xs text-muted-foreground">Pages: {totalPages}</div>
        </div>

        {/* cost per print (document) */}
        <div className="text-sm font-medium">
          Cost per print ({colored ? "Color" : "Black & White"}):
          {" "}
          {pageCost > 0 ? formatZMW(pageCost) + " /print" : "N/A"}
        </div>

        {/* If color is available, show color per-print info */}
        {company?.hasColorPrints && (
          <div className="text-xs text-muted-foreground">
            {perPageColor > 0
              ? `Color per-page: ${formatZMW(perPageColor)} → per-print: ${formatZMW(perPageColor * totalPages)}`
              : `No color rate set (company).`}
          </div>
        )}

        {/* Copies with +/- buttons */}
        <div className="flex items-center gap-2">
          <Label htmlFor="copies">Copies</Label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setCopies((c) => Math.max(1, c - 1))}
              aria-label="decrease copies"
            >
              −
            </button>
            <input
              id="copies"
              type="number"
              className="w-20 text-center border rounded px-2 py-1"
              value={copies}
              min={1}
              onChange={(e) => {
                const n = parseInt(e.target.value || "1", 10);
                setCopies(Math.max(1, isNaN(n) ? 1 : n));
              }}
            />
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => setCopies((c) => c + 1)}
              aria-label="increase copies"
            >
              +
            </button>
          </div>
        </div>

        {/* Color toggle (main UI) */}
        {company?.hasColorPrints && (
          <div className="flex items-center gap-2">
            <Switch
              id="color-toggle"
              checked={colored}
              onCheckedChange={(v) => setColored(Boolean(v))}
            />
            <Label htmlFor="color-toggle">Print in color</Label>
            {perPageColor > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                {formatZMW(perPageColor * totalPages)}/print if color selected
              </span>
            )}
          </div>
        )}

        {/* Advanced options toggle */}
        {/* Advanced options toggle — only show if at least one advanced option is allowed */}
        {(company?.hasLamination || company?.hasBinding) && (
          <div>
            <button
              type="button"
              className="px-2 py-1 text-sm border rounded"
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? "Hide" : "Show"} advanced options
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-2">
                {/* Lamination */}
                {company?.hasLamination && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="lamination-toggle"
                        checked={laminated}
                        onCheckedChange={(v) => setLaminated(Boolean(v))}
                      />
                      <Label htmlFor="lamination-toggle">Lamination</Label>
                      {laminationFlat > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          flat: {formatZMW(laminationFlat)} /doc
                        </span>
                      ) : laminationPerPage > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {formatZMW(laminationPerPage)} /page
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">no lamination price set</span>
                      )}
                    </div>

                    {laminated && totalPages > 1 && (
                      <div role="alert" className="text-xs text-red-600">
                        Warning: each page will be laminated separately. Not recommended — laminate single-page docs only.
                      </div>
                    )}
                  </div>
                )}

                {/* Binding */}
                {company?.hasBinding && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="binding-toggle"
                        checked={bound}
                        onCheckedChange={(v) => setBound(Boolean(v))}
                        disabled={totalPages === 1}
                      />
                      <Label htmlFor="binding-toggle">Binding</Label>
                      {bindingFlat > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          flat: {formatZMW(bindingFlat)} /doc
                        </span>
                      ) : bindingPerPage > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {formatZMW(bindingPerPage)} /page
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">no binding price set</span>
                      )}
                    </div>

                    {totalPages === 1 && (
                      <div className="text-xs text-red-600">
                        Binding not available for single-page documents.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* cost breakdown */}
        <div className="text-sm">
          <div>Per-copy breakdown:</div>
          <ul className="text-xs ml-4 list-disc">
            <li>Pages ({totalPages} × {selectedPerPage > 0 ? `${formatZMW(selectedPerPage)}/page` : "N/A"}): {formatZMW(pageCost)}</li>
            {laminated && laminationCostPerCopy > 0 && <li>Lamination: {formatZMW(laminationCostPerCopy)} {laminationFlat > 0 ? "(flat)" : "/doc (per-page applied)"}</li>}
            {bound && bindingCostPerCopy > 0 && <li>Binding: {formatZMW(bindingCostPerCopy)} {bindingFlat > 0 ? "(flat)" : "/doc (per-page applied)"}</li>}
            <li className="font-semibold">Cost per copy: {formatZMW(costPerCopy)}</li>
            <li className="font-semibold">Total for {copies} copies: <Badge variant="secondary"><strong>{formatZMW(totalCost)}</strong></Badge></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
