// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Label,
  MASTER_DNA_IDS,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SkinProvider,
  SkinRoot,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
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

describe("PR 4 Core Components Contract, Skin Matrix & Accessibility", () => {
  it("contains zero hardcoded 6-digit hex literals inside packages/ui/src/components/ui", () => {
    const dir = resolve(import.meta.dirname);
    const files = readdirSync(dir).filter(
      (name) => (name.endsWith(".ts") || name.endsWith(".tsx")) && !name.includes(".test."),
    );
    const hits: string[] = [];
    for (const file of files) {
      const content = readFileSync(resolve(dir, file), "utf8");
      if (/#[0-9a-fA-F]{6}\b/.test(content)) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });

  it("supports forwardRef, native semantics, loading, and disabled states across core primitives", () => {
    const btnRef = createRef<HTMLButtonElement>();
    const inputRef = createRef<HTMLInputElement>();
    const badgeRef = createRef<HTMLDivElement>();
    const cardRef = createRef<HTMLDivElement>();
    const textareaRef = createRef<HTMLTextAreaElement>();
    const onClick = vi.fn();

    renderNode(
      <SkinProvider defaultSkin="riot">
        <Card ref={cardRef} data-testid="card">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="name-input">Name</Label>
            <Input ref={inputRef} id="name-input" aria-invalid="true" defaultValue="Test" />
            <Textarea ref={textareaRef} aria-label="Notes" defaultValue="Details" />
            <Badge ref={badgeRef} variant="secondary">
              Status
            </Badge>
            <Button ref={btnRef} loading onClick={onClick}>
              Save
            </Button>
            <Button asChild variant="outline">
              <a href="#go">Anchor Button</a>
            </Button>
          </CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      </SkinProvider>,
    );

    expect(cardRef.current?.tagName).toBe("DIV");
    expect(badgeRef.current?.tagName).toBe("DIV");
    expect(inputRef.current?.tagName).toBe("INPUT");
    expect(inputRef.current?.getAttribute("aria-invalid")).toBe("true");
    expect(textareaRef.current?.tagName).toBe("TEXTAREA");
    expect(btnRef.current?.tagName).toBe("BUTTON");
    expect(btnRef.current?.disabled).toBe(true);
    expect(btnRef.current?.getAttribute("aria-busy")).toBe("true");

    act(() => {
      btnRef.current?.click();
    });
    expect(onClick).not.toHaveBeenCalled();

    const linkBtn = container.querySelector('a[href="#go"]');
    expect(linkBtn).not.toBeNull();
    expect(linkBtn?.getAttribute("data-skin")).toBe("riot");
  });

  it("changes rendered classes and data-skin attributes across all 6 skins", () => {
    const classNamesBySkin = new Map<SkinName, string>();

    for (const skin of SKINS) {
      renderNode(
        <SkinProvider defaultSkin={skin} scope="local" persist={false}>
          <Button data-testid="skin-btn">Action</Button>
          <Card data-testid="skin-card">Panel</Card>
          <Input data-testid="skin-input" aria-label="Probe" />
          <Badge data-testid="skin-badge">Tag</Badge>
        </SkinProvider>,
      );

      const btn = container.querySelector('[data-testid="skin-btn"]')!;
      const card = container.querySelector('[data-testid="skin-card"]')!;
      const inp = container.querySelector('[data-testid="skin-input"]')!;
      const badge = container.querySelector('[data-testid="skin-badge"]')!;

      expect(btn.getAttribute("data-skin")).toBe(skin);
      expect(card.getAttribute("data-skin")).toBe(skin);
      expect(inp.getAttribute("data-skin")).toBe(skin);
      expect(badge.getAttribute("data-skin")).toBe(skin);

      classNamesBySkin.set(skin, `${btn.className}|${card.className}|${inp.className}`);
    }

    // All 6 skins produce distinct styling recipes on the same components
    expect(new Set(classNamesBySkin.values()).size).toBe(6);
  });

  it("propagates all 7 Master DNA identities into shadcn components inside SkinRoot", () => {
    for (const dnaId of MASTER_DNA_IDS) {
      renderNode(
        <SkinRoot dnaId={dnaId}>
          <Button data-testid="dna-btn">World Action</Button>
        </SkinRoot>,
      );
      const btn = container.querySelector('[data-testid="dna-btn"]')!;
      expect(btn.getAttribute("data-dna")).toBe(dnaId);
    }
  });

  it("supports interactive Dialog & Sheet closing via Close button with accessible name", () => {
    renderNode(
      <SkinProvider defaultSkin="technical" persist={false}>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="open-dialog">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>Check access</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button data-testid="open-sheet">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Inspector</SheetTitle>
          </SheetContent>
        </Sheet>
      </SkinProvider>,
    );

    const trigger = container.querySelector('[data-testid="open-dialog"]') as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    const closeBtn = document.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    expect(closeBtn?.type).toBe("button");

    act(() => {
      closeBtn?.click();
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders remaining interactive controls with proper ARIA roles and semantic navigation", () => {
    const onSwitch = vi.fn();
    renderNode(
      <SkinProvider defaultSkin="editorial" persist={false}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button>Tip</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip copy</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover>
          <PopoverTrigger asChild>
            <Button>Pop</Button>
          </PopoverTrigger>
          <PopoverContent>Popover copy</PopoverContent>
        </Popover>

        <HoverCard>
          <HoverCardTrigger asChild>
            <a href="#hover">Hover target</a>
          </HoverCardTrigger>
          <HoverCardContent>Preview card</HoverCardContent>
        </HoverCard>

        <Select defaultValue="one">
          <SelectTrigger aria-label="Choose world">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one">One</SelectItem>
            <SelectItem value="two">Two</SelectItem>
          </SelectContent>
        </Select>

        <Tabs defaultValue="t1">
          <TabsList aria-label="Sections">
            <TabsTrigger value="t1">Tab One</TabsTrigger>
            <TabsTrigger value="t2">Tab Two</TabsTrigger>
          </TabsList>
          <TabsContent value="t1">Panel One</TabsContent>
          <TabsContent value="t2">Panel Two</TabsContent>
        </Tabs>

        <Switch aria-label="Enable telemetry" onCheckedChange={onSwitch} />
        <Slider aria-label="Volume" defaultValue={[40]} max={100} />
        <RadioGroup aria-label="Mode" defaultValue="a">
          <RadioGroupItem value="a" aria-label="Mode A" />
          <RadioGroupItem value="b" aria-label="Mode B" />
        </RadioGroup>
        <Progress aria-label="Completion" value={65} />
        <Toggle aria-label="Pin">Pin</Toggle>
        <ToggleGroup type="single" defaultValue="left">
          <ToggleGroupItem value="left">L</ToggleGroupItem>
          <ToggleGroupItem value="right">R</ToggleGroupItem>
        </ToggleGroup>
        <Avatar>
          <AvatarImage src="/avatar.png" alt="User avatar" />
          <AvatarFallback>MW</AvatarFallback>
        </Avatar>
        <Separator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>File</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#nav">Nav</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <ScrollArea className="h-16 w-48">
          <p>Scrollable copy</p>
        </ScrollArea>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#p1" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </SkinProvider>,
    );

    const switchEl = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(switchEl.getAttribute("aria-checked")).toBe("false");
    act(() => {
      switchEl.click();
    });
    expect(switchEl.getAttribute("aria-checked")).toBe("true");
    expect(onSwitch).toHaveBeenCalledWith(true);

    expect(container.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow")).toBe(
      "65",
    );
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("1");
    expect(container.querySelector('button[aria-label="Previous page"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Next page"]')).not.toBeNull();
  });
});
