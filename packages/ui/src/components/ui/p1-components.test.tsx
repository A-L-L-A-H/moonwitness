// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AspectRatio,
  BarChart,
  Calendar,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DataTable,
  DatePicker,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  Empty,
  EmptyDescription,
  EmptyTitle,
  Form,
  FormField,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Prose,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SkinProvider,
  Typography,
} from "../../index";

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("PR 6 P1 Advanced & Composed Components", () => {
  it("supports Accordion keyboard navigation & Collapsible toggling", () => {
    renderNode(
      <SkinProvider defaultSkin="editorial" persist={false}>
        <Accordion type="single" collapsible defaultValue="a1">
          <AccordionItem value="a1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>First panel</AccordionContent>
          </AccordionItem>
          <AccordionItem value="a2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Second panel</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Collapsible>
          <CollapsibleTrigger data-testid="col-btn">More</CollapsibleTrigger>
          <CollapsibleContent data-testid="col-panel">Expanded body</CollapsibleContent>
        </Collapsible>
      </SkinProvider>,
    );

    const triggers = container.querySelectorAll('button[data-accordion-trigger="true"]');
    expect(triggers[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(triggers[1]?.getAttribute("aria-expanded")).toBe("false");

    act(() => {
      (triggers[0] as HTMLButtonElement).focus();
      triggers[0]?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect(document.activeElement).toBe(triggers[1]);

    act(() => {
      (triggers[1] as HTMLButtonElement).click();
    });
    expect(triggers[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(triggers[0]?.getAttribute("aria-expanded")).toBe("false");

    const colBtn = container.querySelector('[data-testid="col-btn"]') as HTMLButtonElement;
    expect(colBtn.getAttribute("aria-expanded")).toBe("false");
    act(() => {
      colBtn.click();
    });
    expect(colBtn.getAttribute("aria-expanded")).toBe("true");
  });

  it("supports Command filtering, keyboard selection, Combobox, Calendar, and DatePicker", () => {
    const onSelectCmd = vi.fn();
    const onPickDate = vi.fn();
    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <Command>
          <CommandInput aria-label="Filter commands" placeholder="Search..." />
          <CommandList>
            <CommandGroup heading="Worlds">
              <CommandItem value="moonwitness" onSelect={onSelectCmd}>
                MoonWitness
              </CommandItem>
              <CommandItem value="rocksoul" onSelect={onSelectCmd}>
                Rocksoul DX
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <Combobox
          aria-label="World combobox"
          value="mw"
          options={[
            { value: "mw", label: "MoonWitness" },
            { value: "rs", label: "Rocksoul" },
          ]}
        />
        <Calendar defaultMonth={new Date(2026, 10, 1)} onSelect={onPickDate} />
        <DatePicker aria-label="Choose event date" value={new Date(2026, 10, 18)} />
      </SkinProvider>,
    );

    const items = container.querySelectorAll('[role="option"]');
    expect(items).toHaveLength(2);
    act(() => {
      (items[1] as HTMLButtonElement).click();
    });
    expect(onSelectCmd).toHaveBeenCalledWith("rocksoul");

    const dayBtn = container.querySelector('button[role="gridcell"]') as HTMLButtonElement;
    act(() => {
      dayBtn.click();
    });
    expect(onPickDate).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[aria-label="World combobox"]')?.textContent).toContain(
      "MoonWitness",
    );
  });

  it("supports Carousel navigation, InputOTP slots, Resizable keyboard adjustment, and ContextMenu/Drawer", () => {
    const onOtpChange = vi.fn();
    const onSizesChange = vi.fn();
    renderNode(
      <SkinProvider defaultSkin="riot" persist={false}>
        <AspectRatio ratio={16 / 9}>
          <div>Frame</div>
        </AspectRatio>
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <InputOTP maxLength={4} onChange={onOtpChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
        <ResizablePanelGroup onSizesChange={onSizesChange}>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
        <ContextMenu>
          <ContextMenuTrigger data-testid="ctx-trigger">Right click target</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Inspect</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <Drawer>
          <DrawerTrigger data-testid="drawer-open">Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Drawer Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
        <Kbd>Ctrl+K</Kbd>
      </SkinProvider>,
    );

    const nextSlide = container.querySelector(
      'button[aria-label="Next slide"]',
    ) as HTMLButtonElement;
    expect(nextSlide.disabled).toBe(false);
    act(() => {
      nextSlide.click();
    });

    const handle = container.querySelector('[role="separator"][tabindex="0"]') as HTMLElement;
    act(() => {
      handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(onSizesChange).toHaveBeenCalledWith([55, 45]);

    const ctxTarget = container.querySelector('[data-testid="ctx-trigger"]')!;
    act(() => {
      ctxTarget.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 20 }),
      );
    });
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
  });

  it("supports Form/Field ARIA wiring, DataTable sort/pagination, Typography/Prose, Empty, and Chart", () => {
    const rows = [
      { id: "1", name: "Beta", count: 20 },
      { id: "2", name: "Alpha", count: 5 },
      { id: "3", name: "Gamma", count: 99 },
    ];
    renderNode(
      <SkinProvider defaultSkin="archive" persist={false}>
        <Form errors={{ email: "Required field" }}>
          <FormField name="email" label="Operator Email" description="Used for alerts.">
            <Input />
          </FormField>
        </Form>
        <DataTable
          data={rows}
          pageSize={2}
          getRowKey={(r) => r.id}
          columns={[
            {
              id: "name",
              header: "Name",
              accessor: (r) => r.name,
              sortValue: (r) => r.name,
            },
            {
              id: "count",
              header: "Count",
              accessor: (r) => r.count,
              sortValue: (r) => r.count,
            },
          ]}
        />
        <Typography variant="display">Imperium Headline</Typography>
        <Prose>
          <p>Editorial prose block.</p>
        </Prose>
        <Empty>
          <EmptyTitle>Idle Queue</EmptyTitle>
          <EmptyDescription>No pending jobs.</EmptyDescription>
        </Empty>
        <ChartContainer title="Signal Distribution">
          <BarChart
            data={[
              { label: "S1", value: 12 },
              { label: "S2", value: 24 },
            ]}
          />
          <ChartLegend items={[{ label: "S1", value: 12 }]} />
          <ChartTooltip>S1: 12</ChartTooltip>
        </ChartContainer>
      </SkinProvider>,
    );

    const err = container.querySelector('[role="alert"]');
    expect(err?.textContent).toBe("Required field");
    const emailInput = container.querySelector('input[aria-invalid="true"]');
    expect(emailInput).not.toBeNull();

    // Sort Name ascending -> Alpha becomes first row
    const sortBtn = Array.from(container.querySelectorAll("th button")).find((b) =>
      b.textContent?.includes("Name"),
    ) as HTMLButtonElement;
    act(() => {
      sortBtn.click();
    });
    expect(container.querySelector("tbody td")?.textContent).toBe("Alpha");
    expect(container.textContent).toContain("Page 1 of 2");
    expect(container.querySelector('svg[role="img"][aria-label="Bar chart"]')).not.toBeNull();
  });

  it("only references rendered field descriptions and preserves caller-provided IDs", () => {
    renderNode(
      <SkinProvider defaultSkin="archive" persist={false}>
        <Form
          errors={{
            errorOnly: "This field is required.",
            describedAndError: "This value is invalid.",
          }}
        >
          <FormField name="plain" label="Plain field">
            <Input data-testid="plain-control" aria-describedby="external-help" />
          </FormField>
          <FormField name="help" label="Field with help" description="Helpful context.">
            <Input data-testid="help-control" aria-describedby="external-help" />
          </FormField>
          <FormField name="errorOnly" label="Field with error">
            <Input data-testid="error-control" />
          </FormField>
          <FormField
            name="describedAndError"
            label="Field with help and error"
            description="Additional context."
          >
            <Input data-testid="described-error-control" aria-describedby="external-help" />
          </FormField>
        </Form>
        <p id="external-help">Shared help text.</p>
      </SkinProvider>,
    );

    const getControl = (testId: string) => {
      const control = container.querySelector(`[data-testid="${testId}"]`);
      if (!(control instanceof HTMLInputElement)) {
        throw new Error(`Expected input for ${testId}`);
      }
      return control;
    };
    const getReferencedIds = (control: HTMLInputElement) =>
      (control.getAttribute("aria-describedby") ?? "").trim().split(" ").filter(Boolean);

    const plainIds = getReferencedIds(getControl("plain-control"));
    expect(plainIds).toEqual(["external-help"]);

    const helpIds = getReferencedIds(getControl("help-control"));
    expect(helpIds).toContain("external-help");
    expect(helpIds.some((id) => id !== "external-help")).toBe(true);
    expect(new Set(helpIds).size).toBe(helpIds.length);

    const errorControl = getControl("error-control");
    const errorIds = getReferencedIds(errorControl);
    expect(errorControl.getAttribute("aria-invalid")).toBe("true");
    expect(errorIds).toHaveLength(1);
    expect(document.getElementById(errorIds[0] ?? "")?.textContent).toBe(
      "This field is required.",
    );

    const describedErrorControl = getControl("described-error-control");
    const describedErrorIds = getReferencedIds(describedErrorControl);
    expect(describedErrorControl.getAttribute("aria-invalid")).toBe("true");
    expect(describedErrorIds).toContain("external-help");
    expect(new Set(describedErrorIds).size).toBe(describedErrorIds.length);
    expect(
      describedErrorIds
        .filter((id) => id !== "external-help")
        .every((id) => document.getElementById(id) !== null),
    ).toBe(true);
  });
});
