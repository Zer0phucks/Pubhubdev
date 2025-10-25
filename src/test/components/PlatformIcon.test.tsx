import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlatformIcon } from '../components/PlatformIcon';

describe('PlatformIcon', () => {
  it('renders Twitter icon for twitter platform', () => {
    render(<PlatformIcon platform="twitter" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders Instagram icon for instagram platform', () => {
    render(<PlatformIcon platform="instagram" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders LinkedIn icon for linkedin platform', () => {
    render(<PlatformIcon platform="linkedin" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders Facebook image for facebook platform', () => {
    render(<PlatformIcon platform="facebook" />);
    const image = screen.getByAltText('Facebook');
    expect(image).toBeInTheDocument();
  });

  it('renders YouTube icon for youtube platform', () => {
    render(<PlatformIcon platform="youtube" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders TikTok icon for tiktok platform', () => {
    render(<PlatformIcon platform="tiktok" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders Pinterest icon for pinterest platform', () => {
    render(<PlatformIcon platform="pinterest" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders Reddit SVG for reddit platform', () => {
    render(<PlatformIcon platform="reddit" />);
    const svg = screen.getByRole('img', { hidden: true });
    expect(svg).toBeInTheDocument();
  });

  it('renders Blog icon for blog platform', () => {
    render(<PlatformIcon platform="blog" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('renders default Twitter icon for unknown platform', () => {
    render(<PlatformIcon platform="unknown" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<PlatformIcon platform="twitter" className="custom-class" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('custom-class');
  });

  it('applies custom size for Facebook image', () => {
    render(<PlatformIcon platform="facebook" size={24} />);
    const image = screen.getByAltText('Facebook');
    expect(image).toHaveStyle({ width: '24px', height: '24px' });
  });

  it('handles case insensitive platform names', () => {
    render(<PlatformIcon platform="TWITTER" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});
