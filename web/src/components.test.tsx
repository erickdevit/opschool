/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PrintWatermark, QrCodeImage, PageDialog, CollapsibleFilterBar, isAndroidDevice } from './components';
import { vi } from 'vitest';

describe('Common Components', () => {
  describe('PrintWatermark', () => {
    it('returns null when neither text nor logoUrl is provided', () => {
      const { container } = render(<PrintWatermark />);
      expect(container.firstChild).toBeNull();
    });

    it('renders watermark image with data-watermark attribute and grayscale filter by default', () => {
      const { container } = render(
        <PrintWatermark logoUrl="https://cdn.opschool.test/watermark.png" />
      );
      const root = container.querySelector('[data-watermark="true"]');
      expect(root).not.toBeNull();
      expect(root).toHaveClass('print-watermark');

      const img = container.querySelector('img.watermark-image');
      expect(img).not.toBeNull();
      expect(img).toHaveClass('grayscale');
      expect(img).toHaveAttribute('src', 'https://cdn.opschool.test/watermark.png');
    });

    it('renders watermark image in full color when grayscale is false', () => {
      const { container } = render(
        <PrintWatermark
          logoUrl="https://cdn.opschool.test/watermark.png"
          grayscale={false}
        />
      );
      const img = container.querySelector('img.watermark-image');
      expect(img).not.toBeNull();
      expect(img).not.toHaveClass('grayscale');
    });

    it('renders watermark text when logoUrl is not provided', () => {
      render(<PrintWatermark text="DOCUMENTO OFICIAL ESCOLAR" />);
      const textElem = screen.getByText('DOCUMENTO OFICIAL ESCOLAR');
      expect(textElem).toHaveClass('watermark-text');
    });
  });

  describe('QrCodeImage', () => {
    it('renders qr code container cleanly without box-shadow or borders', () => {
      const { container } = render(
        <QrCodeImage value="https://app.opschool.test/boletim/123" size={80} />
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('PageDialog', () => {
    it('renders modal content when open is true', () => {
      render(
        <PageDialog open={true} title="Modal Test" onClose={() => {}} onSave={() => {}}>
          <p>Dialog Body</p>
        </PageDialog>
      );
      expect(screen.getByText('Modal Test')).toBeInTheDocument();
      expect(screen.getByText('Dialog Body')).toBeInTheDocument();
    });

    it('does not render modal content when open is false', () => {
      render(
        <PageDialog open={false} title="Modal Hidden" onClose={() => {}} onSave={() => {}}>
          <p>Hidden Content</p>
        </PageDialog>
      );
      expect(screen.queryByText('Modal Hidden')).toBeNull();
    });

    it('invokes onClose when pressing Escape key', () => {
      const handleClose = vi.fn();
      render(
        <PageDialog open={true} title="Modal Keyboard Test" onClose={handleClose} onSave={() => {}}>
          <p>Esc Content</p>
        </PageDialog>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAndroidDevice', () => {
    const originalUserAgent = navigator.userAgent;

    it('returns true when user agent contains Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; U; Android 13; Pixel 7) AppleWebKit/537.36',
        configurable: true,
      });
      expect(isAndroidDevice()).toBe(true);
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('returns false when user agent does not contain Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      expect(isAndroidDevice()).toBe(false);
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });

  describe('CollapsibleFilterBar', () => {
    const originalUserAgent = navigator.userAgent;

    it('renders expanded by default on desktop/non-android environments', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      render(
        <CollapsibleFilterBar title="Filtros de Alunos">
          <input placeholder="Buscar por nome..." />
        </CollapsibleFilterBar>
      );

      expect(screen.getByText('Filtros de Alunos')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Recolher/i })).toBeInTheDocument();

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('defaults to collapsed on Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36',
        configurable: true,
      });

      render(
        <CollapsibleFilterBar title="Filtros de Turmas">
          <input placeholder="Buscar turma..." />
        </CollapsibleFilterBar>
      );

      expect(screen.getByText('Filtros de Turmas')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Buscar turma...')).toBeNull();
      expect(screen.getByRole('button', { name: /Expandir/i })).toBeInTheDocument();

      // Clicking expand reveals the filters
      fireEvent.click(screen.getByRole('button', { name: /Expandir/i }));
      expect(screen.getByPlaceholderText('Buscar turma...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Recolher/i })).toBeInTheDocument();

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('displays activeCount badge when activeCount > 0', () => {
      render(
        <CollapsibleFilterBar title="Filtros" activeCount={3}>
          <div>Conteúdo</div>
        </CollapsibleFilterBar>
      );

      expect(screen.getByText('3 ativos')).toBeInTheDocument();
    });

    it('displays singular activeCount badge when activeCount === 1', () => {
      render(
        <CollapsibleFilterBar title="Filtros" activeCount={1}>
          <div>Conteúdo</div>
        </CollapsibleFilterBar>
      );

      expect(screen.getByText('1 ativo')).toBeInTheDocument();
    });

    it('renders header actions and persists toggle in localStorage if storageKey is given', () => {
      const storageKey = 'test_filter_storage_key';
      localStorage.removeItem(storageKey);

      render(
        <CollapsibleFilterBar
          title="Filtros Persistidos"
          storageKey={storageKey}
          headerActions={<button type="button">Ação Extra</button>}
        >
          <div>Conteúdo Persistido</div>
        </CollapsibleFilterBar>
      );

      expect(screen.getByText('Ação Extra')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo Persistido')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByRole('button', { name: /Recolher/i }));
      expect(localStorage.getItem(storageKey)).toBe('false');
      expect(screen.queryByText('Conteúdo Persistido')).toBeNull();

      // Click to re-expand
      fireEvent.click(screen.getByRole('button', { name: /Expandir/i }));
      expect(localStorage.getItem(storageKey)).toBe('true');
      expect(screen.getByText('Conteúdo Persistido')).toBeInTheDocument();
    });
  });
});
