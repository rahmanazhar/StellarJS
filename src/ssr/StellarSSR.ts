/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { Request, Response } from 'express';
import { createLogger } from '../utils/helpers';

const logger = createLogger('StellarSSR');

export type RenderMode = 'ssr' | 'ssg' | 'spa' | 'isr';

export interface PageProps {
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  req?: Request;
}

export interface GetServerPropsResult<TProps = any> {
  props: TProps;
  revalidate?: number; // seconds, for ISR
  redirect?: { destination: string; permanent?: boolean };
  notFound?: boolean;
}

export type GetServerProps<TProps = any> = (
  context: PageProps
) => Promise<GetServerPropsResult<TProps>>;

export interface PageModule {
  default: React.ComponentType<any>;
  getServerProps?: GetServerProps;
  renderMode?: RenderMode;
  revalidate?: number;
}

export interface SSROptions {
  /** HTML document template */
  template?: string;
  /** Inject into <head> */
  headTags?: string;
  /** Path to client bundle (injected as <script src=...>) */
  clientBundlePath?: string;
  /** Enable streaming SSR via renderToPipeableStream (default: true) */
  streaming?: boolean;
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StellarJS App</title>
    {{HEAD_TAGS}}
  </head>
  <body>
    <div id="stellar-root">{{SSR_CONTENT}}</div>
    <script>window.__STELLAR_PROPS__ = {{PROPS}};</script>
    {{CLIENT_SCRIPT}}
  </body>
</html>`;

export class SSREngine {
  private pageCache = new Map<string, { html: string; timestamp: number; revalidate?: number }>();
  private options: SSROptions;

  constructor(options: SSROptions = {}) {
    this.options = {
      streaming: true,
      ...options,
    };
  }

  async renderPage(
    pageModule: PageModule,
    context: PageProps,
    req: Request,
    res: Response
  ): Promise<void> {
    const mode = pageModule.renderMode || 'ssr';

    if (mode === 'spa') {
      this.renderSPA(res);
      return;
    }

    if (mode === 'ssg' || mode === 'isr') {
      await this.renderWithCache(pageModule, context, req, res);
      return;
    }

    // SSR - render on every request
    await this.renderSSR(pageModule, context, req, res);
  }

  private async renderSSR(
    pageModule: PageModule,
    context: PageProps,
    req: Request,
    res: Response
  ): Promise<void> {
    let props: any = {};

    if (pageModule.getServerProps) {
      try {
        const result = await pageModule.getServerProps({ ...context, req });

        if (result.redirect) {
          res.redirect(result.redirect.permanent ? 301 : 302, result.redirect.destination);
          return;
        }

        if (result.notFound) {
          res.status(404).send(this.buildHTML('<h1>404 - Page Not Found</h1>', {}));
          return;
        }

        props = result.props;
      } catch (error) {
        logger.error('getServerProps failed:', error);
        res.status(500).send(this.buildHTML('<h1>500 - Server Error</h1>', {}));
        return;
      }
    }

    try {
      const html = await this.renderComponent(pageModule.default, props);

      if (this.options.streaming) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.write(this.buildHTMLOpen(props));
        res.write(html);
        res.write(this.buildHTMLClose(props));
        res.end();
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(this.buildHTML(html, props));
      }
    } catch (error) {
      logger.error('SSR render failed:', error);
      res.status(500).send(this.buildHTML('<h1>500 - Render Error</h1>', {}));
    }
  }

  private async renderWithCache(
    pageModule: PageModule,
    context: PageProps,
    req: Request,
    res: Response
  ): Promise<void> {
    const cacheKey = req.path;
    const cached = this.pageCache.get(cacheKey);
    const revalidate = pageModule.revalidate;

    if (cached) {
      const isStale = revalidate ? Date.now() - cached.timestamp > revalidate * 1000 : false;

      if (!isStale) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Stellar-Cache', 'HIT');
        res.send(cached.html);
        return;
      }
    }

    // Generate fresh HTML
    let props: any = {};
    if (pageModule.getServerProps) {
      const result = await pageModule.getServerProps({ ...context, req });
      props = result.props || {};
    }

    const html = await this.renderComponent(pageModule.default, props);
    const fullHtml = this.buildHTML(html, props);

    this.pageCache.set(cacheKey, {
      html: fullHtml,
      timestamp: Date.now(),
      revalidate,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Stellar-Cache', 'MISS');
    res.send(fullHtml);
  }

  private renderSPA(res: Response): void {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(this.buildHTML('<div id="app-loading">Loading...</div>', {}));
  }

  private async renderComponent(Component: React.ComponentType<any>, props: any): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const React = require('react');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { renderToString } = require('react-dom/server');
      const element = React.createElement(Component, props);
      return renderToString(element);
    } catch (e: any) {
      logger.error('Component render error:', e);
      throw e;
    }
  }

  private buildHTML(content: string, props: any): string {
    const template = this.options.template || DEFAULT_TEMPLATE;
    const clientScript = this.options.clientBundlePath
      ? `<script src="${this.options.clientBundlePath}" defer></script>`
      : '';

    return template
      .replace('{{HEAD_TAGS}}', this.options.headTags || '')
      .replace('{{SSR_CONTENT}}', content)
      .replace('{{PROPS}}', JSON.stringify(props).replace(/</g, '\\u003c'))
      .replace('{{CLIENT_SCRIPT}}', clientScript);
  }

  private buildHTMLOpen(_props: unknown): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StellarJS App</title>
    ${this.options.headTags || ''}
  </head>
  <body>
    <div id="stellar-root">`;
  }

  private buildHTMLClose(props: any): string {
    const clientScript = this.options.clientBundlePath
      ? `<script src="${this.options.clientBundlePath}" defer></script>`
      : '';

    return `</div>
    <script>window.__STELLAR_PROPS__ = ${JSON.stringify(props).replace(/</g, '\\u003c')};</script>
    ${clientScript}
  </body>
</html>`;
  }

  /** Invalidate cached page (for on-demand ISR revalidation) */
  invalidateCache(path: string): void {
    this.pageCache.delete(path);
    logger.info(`Cache invalidated for: ${path}`);
  }

  /** Pre-generate static pages (SSG build step) */
  async prerender(
    paths: string[],
    pageModule: PageModule,
    getContext: (path: string) => PageProps
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const path of paths) {
      const context = getContext(path);
      let props: any = {};

      if (pageModule.getServerProps) {
        const result = await pageModule.getServerProps(context);
        props = result.props || {};
      }

      const html = await this.renderComponent(pageModule.default, props);
      results.set(path, this.buildHTML(html, props));
    }

    logger.info(`Pre-rendered ${results.size} pages`);
    return results;
  }
}

let globalSSR: SSREngine | null = null;

export const initSSR = (options?: SSROptions): SSREngine => {
  globalSSR = new SSREngine(options);
  return globalSSR;
};

export const getSSR = (): SSREngine => {
  if (!globalSSR) globalSSR = new SSREngine();
  return globalSSR;
};
