import { env } from '../config/env.js';

export interface AssetMeta {
  id: string;
  category: 'brand' | 'surface' | 'pack';
  name: string;
  path: string;
  url: string;
  description: string;
  surfaceNumber?: string;
  role?: string;
}

export interface BrandAssets {
  logoHorizontal: string;
  logoStacked: string;
  logoMonochrome: string;
  wordmark: string;
  lockup: string;
  favicon: string;
}

export interface UiSurfaceAsset {
  id: string;
  surfaceNumber: string;
  name: string;
  filename: string;
  path: string;
  url: string;
  description: string;
  role: string;
}

export interface AssetPack {
  name: string;
  path: string;
  count: number;
  format: string;
  description: string;
}

class RocksoulAssetRegistry {
  private readonly baseUrl: string;

  constructor(baseUrl: string = env.ROCKSOUL_ASSETS_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Resolves a relative asset path to full raw CDN URL
   */
  resolve(relativePath: string): string {
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * Canonical brand assets
   */
  getBrand(): BrandAssets {
    return {
      logoHorizontal: this.resolve('moonwitness/brand/logo-horizontal.svg'),
      logoStacked: this.resolve('moonwitness/brand/logo-stacked.svg'),
      logoMonochrome: this.resolve('moonwitness/brand/logo-monochrome.svg'),
      wordmark: this.resolve('moonwitness/brand/wordmark.svg'),
      lockup: this.resolve('moonwitness/brand/rocksoul-lockup.svg'),
      favicon: this.resolve('moonwitness/brand/favicon.svg'),
    };
  }

  /**
   * Canonical UI v2 surfaces (17 - 27 + Application Shell)
   */
  getSurfaces(): UiSurfaceAsset[] {
    return [
      {
        id: 'shell',
        surfaceNumber: 'Shell',
        name: 'Application Shell',
        filename: 'application-shell.svg',
        path: 'moonwitness/ui/v2/application-shell.svg',
        url: this.resolve('moonwitness/ui/v2/application-shell.svg'),
        description: 'Canonical application shell frame, navigation bar, and operational workspace layout',
        role: 'Unified Application Frame',
      },
      {
        id: '17-dashboard',
        surfaceNumber: '17',
        name: 'Operational Dashboard',
        filename: '17-dashboard.svg',
        path: 'moonwitness/ui/v2/17-dashboard.svg',
        url: this.resolve('moonwitness/ui/v2/17-dashboard.svg'),
        description: 'Primary console telemetry, telemetry cards, and multi-domain activity view',
        role: 'Dashboard & Metrics',
      },
      {
        id: '18-command-palette',
        surfaceNumber: '18',
        name: 'Command Palette',
        filename: '18-command-palette.svg',
        path: 'moonwitness/ui/v2/18-command-palette.svg',
        url: this.resolve('moonwitness/ui/v2/18-command-palette.svg'),
        description: 'Global search and fast keyboard navigation across all 5 domains',
        role: 'Search & Quick Action',
      },
      {
        id: '19-notifications',
        surfaceNumber: '19',
        name: 'Notifications Center',
        filename: '19-notifications.svg',
        path: 'moonwitness/ui/v2/19-notifications.svg',
        url: this.resolve('moonwitness/ui/v2/19-notifications.svg'),
        description: 'System events, correlation updates, and operational alerts stream',
        role: 'Alerts & Telemetry',
      },
      {
        id: '20-kanban',
        surfaceNumber: '20',
        name: 'Kanban Board',
        filename: '20-kanban.svg',
        path: 'moonwitness/ui/v2/20-kanban.svg',
        url: this.resolve('moonwitness/ui/v2/20-kanban.svg'),
        description: 'Task board, operational pipelines, and stage management',
        role: 'Workflow Execution',
      },
      {
        id: '21-calendar',
        surfaceNumber: '21',
        name: 'Calendar & Timelines',
        filename: '21-calendar.svg',
        path: 'moonwitness/ui/v2/21-calendar.svg',
        url: this.resolve('moonwitness/ui/v2/21-calendar.svg'),
        description: 'Temporal event mapping and synchronized schedule tracking',
        role: 'Timeline Scheduling',
      },
      {
        id: '22-chat',
        surfaceNumber: '22',
        name: 'Chat Workspace',
        filename: '22-chat.svg',
        path: 'moonwitness/ui/v2/22-chat.svg',
        url: this.resolve('moonwitness/ui/v2/22-chat.svg'),
        description: 'Real-time collaborative channels, peer messaging, and team discussions',
        role: 'Collaboration',
      },
      {
        id: '23-ai-workspace',
        surfaceNumber: '23',
        name: 'AI Agent Workspace',
        filename: '23-ai-workspace.svg',
        path: 'moonwitness/ui/v2/23-ai-workspace.svg',
        url: this.resolve('moonwitness/ui/v2/23-ai-workspace.svg'),
        description: 'Multi-agent orchestration, tool invocations, and autonomous coding/browser runs',
        role: 'AI Autonomous Runtime',
      },
      {
        id: '24-resources',
        surfaceNumber: '24',
        name: 'AutoMenu & Resources',
        filename: '24-resources.svg',
        path: 'moonwitness/ui/v2/24-resources.svg',
        url: this.resolve('moonwitness/ui/v2/24-resources.svg'),
        description: 'Dynamic schema-driven AutoTable, AutoCRUD, and resource directory',
        role: 'Resource Navigation',
      },
      {
        id: '25-profile-settings',
        surfaceNumber: '25',
        name: 'Profile & Settings',
        filename: '25-profile-settings.svg',
        path: 'moonwitness/ui/v2/25-profile-settings.svg',
        url: this.resolve('moonwitness/ui/v2/25-profile-settings.svg'),
        description: 'Account parameters, API credentials, and preferences configuration',
        role: 'Operator Settings',
      },
      {
        id: '26-authorization',
        surfaceNumber: '26',
        name: 'Authorization UX',
        filename: '26-authorization.svg',
        path: 'moonwitness/ui/v2/26-authorization.svg',
        url: this.resolve('moonwitness/ui/v2/26-authorization.svg'),
        description: 'Canonical authorization and credential consent boundary screen',
        role: 'Security & Access Control',
      },
      {
        id: '27-system-states',
        surfaceNumber: '27',
        name: 'System States',
        filename: '27-system-states.svg',
        path: 'moonwitness/ui/v2/27-system-states.svg',
        url: this.resolve('moonwitness/ui/v2/27-system-states.svg'),
        description: 'Error boundaries, maintenance banners, empty states, and degraded recovery',
        role: 'Resilience & Status',
      },
    ];
  }

  /**
   * Asset packs definitions
   */
  getPacks(): AssetPack[] {
    return [
      {
        name: 'Product Icons',
        path: 'moonwitness/icons/',
        count: 44,
        format: 'SVG',
        description: 'Crisp SVG iconography for operational menus and state indicators',
      },
      {
        name: 'Dashboard Pack',
        path: 'moonwitness/dashboard-pack/',
        count: 20,
        format: 'SVG Widgets',
        description: 'Prebuilt modular telemetry cards and monitoring widgets',
      },
      {
        name: 'Data-Viz Pack',
        path: 'moonwitness/data-viz/',
        count: 16,
        format: 'SVG Components',
        description: 'Node-link, provenance, timeline, evidence-matrix, and graph visualizations',
      },
      {
        name: 'Hero Backgrounds',
        path: 'moonwitness/hero-backgrounds/',
        count: 8,
        format: 'SVG Vectors',
        description: 'Vector ambience and thematic backgrounds for application surfaces',
      },
      {
        name: 'State Illustrations',
        path: 'moonwitness/state-illustrations/',
        count: 12,
        format: 'SVG Illustrations',
        description: 'Empty, error, 404, loading, and recovery state illustrations',
      },
      {
        name: 'Motion Pack',
        path: 'moonwitness/motion/',
        count: 6,
        format: 'Animated SVGs',
        description: 'Motion cues and state transition curves',
      },
    ];
  }

  /**
   * Returns flat catalog for programmatic APIs and inspection
   */
  getAllAssetsCatalog(): AssetMeta[] {
    const brand = this.getBrand();
    const brandItems: AssetMeta[] = [
      {
        id: 'brand-logo-horizontal',
        category: 'brand',
        name: 'MoonWitness Horizontal Logo',
        path: 'moonwitness/brand/logo-horizontal.svg',
        url: brand.logoHorizontal,
        description: 'Official horizontal primary brand lockup',
      },
      {
        id: 'brand-rocksoul-lockup',
        category: 'brand',
        name: 'MoonWitness × Rocksoul Ecosystem Lockup',
        path: 'moonwitness/brand/rocksoul-lockup.svg',
        url: brand.lockup,
        description: 'Combined ecosystem mark connecting MoonWitness and Rocksoul',
      },
      {
        id: 'brand-logo-stacked',
        category: 'brand',
        name: 'MoonWitness Stacked Logo',
        path: 'moonwitness/brand/logo-stacked.svg',
        url: brand.logoStacked,
        description: 'Stacked vertical mark for compact representations',
      },
      {
        id: 'brand-logo-monochrome',
        category: 'brand',
        name: 'MoonWitness Monochrome Logo',
        path: 'moonwitness/brand/logo-monochrome.svg',
        url: brand.logoMonochrome,
        description: 'Single-color silhouette for dark/print media',
      },
      {
        id: 'brand-wordmark',
        category: 'brand',
        name: 'MoonWitness Wordmark',
        path: 'moonwitness/brand/wordmark.svg',
        url: brand.wordmark,
        description: 'Clean typographic wordmark',
      },
      {
        id: 'brand-favicon',
        category: 'brand',
        name: 'Favicon & Mark Icon',
        path: 'moonwitness/brand/favicon.svg',
        url: brand.favicon,
        description: 'Square mark for browser tabs and mobile shortcuts',
      },
    ];

    const surfaceItems: AssetMeta[] = this.getSurfaces().map((s) => ({
      id: `surface-${s.id}`,
      category: 'surface',
      name: s.name,
      path: s.path,
      url: s.url,
      description: s.description,
      surfaceNumber: s.surfaceNumber,
      role: s.role,
    }));

    const packItems: AssetMeta[] = this.getPacks().map((p, idx) => ({
      id: `pack-${idx}`,
      category: 'pack',
      name: p.name,
      path: p.path,
      url: this.resolve(p.path),
      description: `${p.description} (${p.count} ${p.format})`,
    }));

    return [...brandItems, ...surfaceItems, ...packItems];
  }

  /**
   * Helper snapshot for view templates
   */
  getSnapshot() {
    return {
      baseUrl: this.baseUrl,
      brand: this.getBrand(),
      surfaces: this.getSurfaces(),
      packs: this.getPacks(),
      totalCanonicalSurfaces: this.getSurfaces().length,
      totalPacks: this.getPacks().length,
    };
  }
}

export const rocksoulAssets = new RocksoulAssetRegistry();
export type RocksoulAssetSnapshot = ReturnType<RocksoulAssetRegistry['getSnapshot']>;
