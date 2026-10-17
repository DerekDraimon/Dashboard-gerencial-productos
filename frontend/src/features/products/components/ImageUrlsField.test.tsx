import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ImageUrlsField } from './ImageUrlsField';

function Harness({ initial = [] }: { initial?: string[] }) {
  const [images, setImages] = useState(initial);
  return <ImageUrlsField value={images} onChange={setImages} />;
}

const urlInput = () => screen.getByLabelText('URL de imagen');
const rows = () =>
  within(screen.getByRole('list', { name: 'Imágenes agregadas' })).queryAllByRole('listitem');

async function add(url: string) {
  await userEvent.clear(urlInput());
  await userEvent.type(urlInput(), url);
  await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
}

describe('ImageUrlsField', () => {
  it('adds a valid url as a loading row and clears the input', async () => {
    render(<Harness />);

    await add('https://example.com/a.png');

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('Cargando…');
    expect(rows()[0]).toHaveTextContent('https://example.com/a.png');
    expect(urlInput()).toHaveValue('');
  });

  it('rejects an invalid url', async () => {
    render(<Harness />);

    await add('ftp://example.com/a.png');

    expect(screen.getByText('Ingresa una URL válida (http o https).')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
  });

  it('clears the error as soon as the url is edited', async () => {
    render(<Harness />);
    await add('nota-url');

    await userEvent.type(urlInput(), 'x');

    expect(screen.queryByText('Ingresa una URL válida (http o https).')).not.toBeInTheDocument();
  });

  it('rejects a duplicate url', async () => {
    render(<Harness initial={['https://example.com/a.png']} />);

    await add('https://example.com/a.png');

    expect(screen.getByText('Esa imagen ya está agregada.')).toBeInTheDocument();
    expect(rows()).toHaveLength(1);
  });

  it('rejects an eleventh url', async () => {
    const ten = Array.from({ length: 10 }, (_, index) => `https://example.com/${index}.png`);
    render(<Harness initial={ten} />);

    await add('https://example.com/extra.png');

    expect(screen.getByText('Puedes agregar hasta 10 imágenes.')).toBeInTheDocument();
    expect(rows()).toHaveLength(10);
  });

  it('removes a url', async () => {
    render(<Harness initial={['https://example.com/a.png', 'https://example.com/b.png']} />);

    await userEvent.click(screen.getByRole('button', { name: 'Quitar imagen 1' }));

    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('https://example.com/b.png');
  });

  it('marks each url as OK or No carga from its image events', () => {
    const { container } = render(
      <Harness initial={['https://example.com/a.png', 'https://example.com/rota.png']} />,
    );
    const probe = (src: string) => container.querySelector(`img[src="${src}"]`) as Element;

    fireEvent.load(probe('https://example.com/a.png'));
    fireEvent.error(probe('https://example.com/rota.png'));

    expect(rows()[0]).toHaveTextContent('OK');
    expect(rows()[1]).toHaveTextContent('No carga');
  });
});
