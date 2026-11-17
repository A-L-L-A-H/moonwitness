// @vitest-environment jsdom
import React, { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Checkbox,
  Skeleton,
  SkinProvider,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Toaster,
  dismissToast,
  toast,
  type SkinName,
} from "../../index";

const SKINS: readonly SkinName[] = [
  "default",
  "riot",
  "editorial",
  "technical",
  "archive",
  "transmission",
];

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  dismissToast();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    dismissToast();
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("PR 5 Foundational P0 Components", () => {
  it("supports Checkbox checked, indeterminate, disabled, form input sync, and forwardRef", () => {
    const checkRef = createRef<HTMLButtonElement>();
    const onCheckedChange = vi.fn();

    renderNode(
      <SkinProvider defaultSkin="riot" persist={false}>
        <Checkbox
          ref={checkRef}
          name="agree"
          defaultChecked="indeterminate"
          aria-label="Accept covenant"
          onCheckedChange={onCheckedChange}
        />
        <Checkbox aria-label="Disabled option" disabled />
      </SkinProvider>,
    );

    expect(checkRef.current?.getAttribute("role")).toBe("checkbox");
    expect(checkRef.current?.getAttribute("aria-checked")).toBe("mixed");

    act(() => {
      checkRef.current?.click();
    });
    expect(checkRef.current?.getAttribute("aria-checked")).toBe("true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    const hidden = container.querySelector('input[name="agree"]') as HTMLInputElement;
    expect(hidden?.checked).toBe(true);

    const disabledBtn = container.querySelector(
      '[aria-label="Disabled option"]',
    ) as HTMLButtonElement;
    expect(disabledBtn.disabled).toBe(true);
    act(() => {
      disabledBtn.click();
    });
    expect(disabledBtn.getAttribute("aria-checked")).toBe("false");
  });

  it("renders Skeleton and Alert variants across all 6 skins", () => {
    for (const skin of SKINS) {
      renderNode(
        <SkinProvider defaultSkin={skin} scope="local" persist={false}>
          <Skeleton data-testid="skel" className="h-6 w-24" />
          <Alert data-testid="alert" variant="warning">
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>Diagnostic state unmeasured</AlertDescription>
          </Alert>
        </SkinProvider>,
      );
      expect(container.querySelector('[data-testid="skel"]')?.getAttribute("aria-hidden")).toBe(
        "true",
      );
      expect(container.querySelector('[data-testid="alert"]')?.getAttribute("role")).toBe("alert");
      expect(container.querySelector('[data-testid="alert"]')?.getAttribute("data-skin")).toBe(
        skin,
      );
    }
  });

  it("renders semantic Table and Breadcrumb navigation", () => {
    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Imperium</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Table>
          <TableCaption>Active Services</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>api.a-l-l-a-h.com</TableCell>
              <TableCell>UNMEASURED</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>1 service listed</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </SkinProvider>,
    );

    expect(container.querySelector('nav[aria-label="breadcrumb"]')).not.toBeNull();
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Imperium");
    expect(container.querySelector("table caption")?.textContent).toBe("Active Services");
    expect(container.querySelectorAll("table th")).toHaveLength(2);
    expect(container.querySelector("table tbody td")?.textContent).toBe("api.a-l-l-a-h.com");
  });

  it("opens AlertDialog with role=alertdialog and requires explicit Action or Cancel", () => {
    const onConfirm = vi.fn();

    renderNode(
      <SkinProvider defaultSkin="archive" persist={false}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button data-testid="open-alert-dlg">Delete Node</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decommission Node?</AlertDialogTitle>
              <AlertDialogDescription>This removes the routing entry.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-btn">Cancel</AlertDialogCancel>
              <AlertDialogAction data-testid="confirm-btn" onClick={onConfirm}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SkinProvider>,
    );

    act(() => {
      (container.querySelector('[data-testid="open-alert-dlg"]') as HTMLButtonElement).click();
    });

    const dlg = document.querySelector('[role="alertdialog"]');
    expect(dlg).not.toBeNull();
    expect(dlg?.getAttribute("data-skin")).toBe("archive");

    act(() => {
      (document.querySelector('[data-testid="confirm-btn"]') as HTMLButtonElement).click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("displays and dismisses Toast notifications via Toaster and close button", () => {
    renderNode(
      <SkinProvider defaultSkin="transmission" persist={false}>
        <Toaster />
      </SkinProvider>,
    );

    act(() => {
      toast({
        title: "Probe Synchronized",
        description: "Recorded timestamped snapshot.",
        variant: "success",
        durationMs: 0,
      });
    });

    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain("Probe Synchronized");
    expect(status?.getAttribute("data-skin")).toBe("transmission");

    const closeBtn = container.querySelector('[aria-label="Close"]') as HTMLButtonElement;
    act(() => {
      closeBtn.click();
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
