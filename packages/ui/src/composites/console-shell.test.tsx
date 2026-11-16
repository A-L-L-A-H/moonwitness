import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsoleShell, type ConsoleShellProps } from './console-shell';
import type { HudNavItem } from '../primitives/hud-chrome';

const ITEMS: HudNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', iconPath: 'M4 4 L20 4', href: '/mission-control' },
];

function shell(overrides: Partial<ConsoleShellProps> = {}) {
  return renderToStaticMarkup(
    <ConsoleShell title="Shadow Command Center" items={ITEMS} active="dashboard" {...overrides}>
      <p>body-content</p>
    </ConsoleShell>,
  );
}

describe('ConsoleShell', () => {
  it('renders header, nav, main landmark and footer strip', () => {
    const html = shell();
    expect(html).toContain('<header');
    expect(html).toContain('<nav');
    expect(html).toContain('<main');
    expect(html).toContain('<footer');
    expect(html).toContain('body-content');
    expect(html).toContain('Shadow Command Center');
  });

  it('maps slots into rails', () => {
    const html = shell({
      headerActions: <span data-slot="actions" />,
      railFooter: <span data-slot="rail-footer" />,
      commandLeft: <span data-slot="cmd-left" />,
      commandRight: <span data-slot="cmd-right" />,
    });
    expect(html).toContain('data-slot="actions"');
    expect(html).toContain('data-slot="rail-footer"');
    expect(html).toContain('data-slot="cmd-left"');
    expect(html).toContain('data-slot="cmd-right"');
  });

  it('keeps scroll area shrinkable (min-h-0 chain for flex overflow)', () => {
    const html = shell();
    expect(html).toContain('min-h-0');
    expect(html).toContain('min-w-0');
  });

  it('renders mobile bottom rail with the same items', () => {
    const html = shell();
    const navs = html.match(/<nav /g) ?? [];
    expect(navs.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('fixed inset-x-0 bottom-0');
  });
});
