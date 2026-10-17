import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { ApiError } from '../../../shared/api/api-error';
import { FormDialog } from '../../../shared/components/form-dialog';
import { ErrorState, LoadingState } from '../../../shared/components/states';
import { useNotify } from '../../../shared/feedback/use-notify';
import {
  createProduct,
  getProduct,
  updateProduct,
  type Product,
  type ProductInput,
} from '../api/products-api';
import { useCategories } from '../hooks/useCategories';
import { ImageUrlsField } from './ImageUrlsField';
import { ProductFormPreview } from './ProductFormPreview';

export interface ProductFormValues {
  title: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  images: string[];
}

export type ProductFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (product: Product) => void;
} & ({ mode: 'create' } | { mode: 'edit'; productId: string });

interface LoadedProduct {
  key: string;
  values: ProductFormValues | null;
  error: unknown;
}

interface ValidationDetail {
  path: string;
  message: string;
}

const EMPTY_VALUES: ProductFormValues = {
  title: '',
  price: '',
  stock: '',
  category: '',
  description: '',
  images: [],
};

const FIELDS = Object.keys(EMPTY_VALUES) as FieldPath<ProductFormValues>[];
const UNEXPECTED_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

function normalizeDecimal(value: string): string {
  return value.trim().replace(',', '.');
}

function requiredText(label: string, max: number, feminine = false) {
  return (value: string) => {
    const text = value.trim();
    if (text === '')
      return `${feminine ? 'La' : 'El'} ${label} es obligatori${feminine ? 'a' : 'o'}.`;
    return (
      text.length <= max || `${feminine ? 'La' : 'El'} ${label} admite máximo ${max} caracteres.`
    );
  };
}

function validatePrice(value: string) {
  const price = normalizeDecimal(value);
  if (!DECIMAL_PATTERN.test(price) || Number(price) <= 0) return 'El precio debe ser mayor a 0.';
  return !/\.\d{3,}$/.test(price) || 'Usa máximo 2 decimales.';
}

function validateStock(value: string) {
  const stock = value.trim();
  const valid = /^\d+$/.test(stock) && Number(stock) <= Number.MAX_SAFE_INTEGER;
  return valid || 'El stock debe ser un número entero mayor o igual a 0.';
}

function toProductInput(values: ProductFormValues): ProductInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    price: Number(Number(normalizeDecimal(values.price)).toFixed(2)),
    category: values.category.trim(),
    images: values.images,
    stock: Number.parseInt(values.stock.trim(), 10),
  };
}

function toFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    price: product.price.toFixed(2),
    stock: String(product.stock),
    category: product.category,
    description: product.description,
    images: product.images,
  };
}

function changedFields(next: ProductInput, original: ProductInput): Partial<ProductInput> {
  const keys = Object.keys(next) as (keyof ProductInput)[];
  const changed = keys.filter((key) => JSON.stringify(next[key]) !== JSON.stringify(original[key]));
  return Object.fromEntries(changed.map((key) => [key, next[key]]));
}

function isValidationDetail(detail: unknown): detail is ValidationDetail {
  if (typeof detail !== 'object' || detail === null) return false;
  const { path, message } = detail as Record<string, unknown>;
  return typeof path === 'string' && typeof message === 'string';
}

function validationDetails(error: unknown): ValidationDetail[] {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return [];
  return Array.isArray(error.details) ? error.details.filter(isValidationDetail) : [];
}

export function ProductFormDialog(props: ProductFormDialogProps) {
  const { open, onClose, onSaved } = props;
  const productId = props.mode === 'edit' ? props.productId : null;
  const notify = useNotify();
  const { categories } = useCategories();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({ defaultValues: EMPTY_VALUES });

  const [attempt, setAttempt] = useState(0);
  // Every opening gets its own load key, so a reopened dialog never shows the previous data.
  const [opening, setOpening] = useState({ open, count: 0 });
  if (opening.open !== open) {
    setOpening((current) => ({ open, count: open ? current.count + 1 : current.count }));
  }
  const [loaded, setLoaded] = useState<LoadedProduct>({ key: '', values: null, error: null });
  const loadKey = productId === null ? '' : `${productId}:${opening.count}:${attempt}`;
  const current = open && loaded.key === loadKey;
  const loadError = current ? loaded.error : null;
  const ready = productId === null || (current && loaded.values !== null);

  useEffect(() => {
    if (!open) return;
    if (productId === null) {
      reset(EMPTY_VALUES);
      return;
    }
    const controller = new AbortController();
    getProduct(productId, { signal: controller.signal }).then(
      (product) => {
        if (controller.signal.aborted) return;
        const values = toFormValues(product);
        reset(values);
        setLoaded({ key: loadKey, values, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setLoaded({ key: loadKey, values: null, error });
      },
    );
    return () => controller.abort();
  }, [open, productId, loadKey, reset]);

  async function save(values: ProductFormValues): Promise<void> {
    const input = toProductInput(values);
    if (productId === null) {
      onSaved(await createProduct(input));
      notify.success('Producto creado');
    } else {
      const patch = changedFields(input, toProductInput(loaded.values ?? EMPTY_VALUES));
      // Nothing changed: closing silently is the expected outcome, not an error.
      if (Object.keys(patch).length > 0) {
        onSaved(await updateProduct(productId, patch));
        notify.success('Producto actualizado');
      }
    }
    onClose();
  }

  const submit = handleSubmit(async (values) => {
    try {
      await save(values);
    } catch (error) {
      const details = validationDetails(error);
      const unmatched: string[] = [];
      for (const { path, message } of details) {
        const name = FIELDS.find((field) => field === path.split('.')[0]);
        if (name) setError(name, { message });
        else unmatched.push(message);
      }
      if (details.length === 0) {
        notify.error(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
      } else if (unmatched.length > 0) {
        notify.error(unmatched.join(' '));
      }
    }
  });

  function textField(
    name: 'title' | 'price' | 'stock' | 'description',
    validate: (value: string) => string | true,
  ) {
    const { ref, ...rest } = register(name, { validate });
    return {
      ...rest,
      inputRef: ref,
      error: Boolean(errors[name]),
      helperText: errors[name]?.message,
      fullWidth: true,
    };
  }

  return (
    <FormDialog
      open={open}
      title={productId === null ? 'Nuevo producto' : 'Editar producto'}
      subtitle="Completa los datos del producto."
      submitLabel={productId === null ? 'Guardar producto' : 'Guardar cambios'}
      submitting={isSubmitting}
      onClose={onClose}
      onSubmit={(event) => {
        if (ready) void submit(event);
      }}
      maxWidth="md"
    >
      {!ready &&
        (loadError ? (
          <ErrorState
            title="No pudimos cargar el producto"
            error={loadError}
            onRetry={() => setAttempt((value) => value + 1)}
          />
        ) : (
          <LoadingState label="Cargando producto…" />
        ))}
      {ready && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' },
            gap: 3.5,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 1 }}>
            <TextField label="Título" {...textField('title', requiredText('título', 120))} />
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Precio"
                {...textField('price', validatePrice)}
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                }}
              />
              <TextField
                label="Stock"
                {...textField('stock', validateStock)}
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
            </Box>
            <Controller
              name="category"
              control={control}
              rules={{ validate: requiredText('categoría', 60, true) }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  freeSolo
                  options={categories}
                  inputValue={field.value}
                  onInputChange={(_, value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categoría"
                      error={Boolean(fieldState.error)}
                      helperText={
                        fieldState.error?.message ?? 'Elige una existente o escribe una nueva.'
                      }
                    />
                  )}
                />
              )}
            />
            <TextField
              label="Descripción"
              multiline
              minRows={3}
              {...textField('description', requiredText('descripción', 2000, true))}
            />
            <Controller
              name="images"
              control={control}
              render={({ field, fieldState }) => (
                <ImageUrlsField
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </Box>
          <ProductFormPreview control={control} />
        </Box>
      )}
    </FormDialog>
  );
}
