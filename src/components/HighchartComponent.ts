import type { Locator, Page } from '@playwright/test';

/**
 * One Highcharts chart (the `[data-highcharts-chart]` wrapper). The site bundles Highcharts
 * without a `window.Highcharts` global, so everything is read from the rendered SVG.
 */
export class HighchartComponent {
  readonly tooltip: Locator;

  constructor(private readonly page: Page, readonly root: Locator) {
    this.tooltip = root.locator('.highcharts-tooltip');
  }

  /** Main x-axis labels. Navigator labels (they contain a zero-width space) are left out. */
  async xLabels(): Promise<string[]> {
    const all = await this.root.locator('.highcharts-xaxis-labels text').allTextContents();
    return all.map((t) => t.trim()).filter((t) => t && !t.includes('​'));
  }

  async yLabels(): Promise<string[]> {
    const all = await this.root.locator('.highcharts-yaxis-labels text').allTextContents();
    return all.map((t) => t.trim()).filter((t) => t && !t.includes('​'));
  }

  /** Screen position of the last point of the first series: the end of its line path. */
  async lastPointPosition(): Promise<{ x: number; y: number }> {
    return this.root.evaluate((el) => {
      const path = el.querySelector<SVGPathElement>('g.highcharts-series-0:not(.highcharts-navigator-series) path.highcharts-graph');
      if (!path) throw new Error('No series line found in chart');
      const end = path.getPointAtLength(path.getTotalLength());
      const pt = new DOMPoint(end.x, end.y).matrixTransform(path.getScreenCTM()!);
      return { x: pt.x, y: pt.y };
    });
  }

  /**
   * Hovers the last data point (and taps it with `tap: true`) and returns the tooltip text
   * with whitespace collapsed.
   */
  async hoverLastPoint(opts: { tap?: boolean } = {}): Promise<string> {
    await this.root.scrollIntoViewIfNeeded();
    const { x, y } = await this.lastPointPosition();
    // Approach from the left so Highcharts registers the move and snaps to the nearest point.
    await this.page.mouse.move(x - 20, y, { steps: 5 });
    await this.page.mouse.move(x, y, { steps: 5 });
    if (opts.tap) await this.page.mouse.click(x, y);
    await this.tooltip.first().waitFor({ state: 'visible' });
    return ((await this.tooltip.first().textContent()) ?? '').replace(/[\s​]+/g, ' ').trim();
  }

  /**
   * Compares the plotted line with the plot area. `clipped` is true when the line runs past
   * the top or bottom of the plot, i.e. the y-axis range does not cover the values.
   */
  async plotFit(): Promise<{ clipped: boolean; line: { top: number; bottom: number }; plot: { top: number; bottom: number } }> {
    return this.root.evaluate((el) => {
      const plot = el.querySelector('.highcharts-plot-background')!.getBoundingClientRect();
      const graphs = [...el.querySelectorAll('g.highcharts-series:not(.highcharts-navigator-series) path.highcharts-graph')];
      const boxes = graphs.map((g) => g.getBoundingClientRect()).filter((b) => b.height > 0);
      const top = Math.min(...boxes.map((b) => b.top));
      const bottom = Math.max(...boxes.map((b) => b.bottom));
      // Line stroke and spline curves can overshoot by a pixel or two.
      const tolerance = 2;
      return {
        clipped: !boxes.length || top < plot.top - tolerance || bottom > plot.bottom + tolerance,
        line: { top: Math.round(top), bottom: Math.round(bottom) },
        plot: { top: Math.round(plot.top), bottom: Math.round(plot.bottom) },
      };
    });
  }
}

/** Last number in a text, e.g. "26 Oct, 2026 Index Value (LHS) 50.86" → 50.86. */
export function lastNumberIn(text: string): number {
  const m = text.match(/-?\d+(?:\.\d+)?(?!.*\d)/);
  return m ? Number(m[0]) : NaN;
}
