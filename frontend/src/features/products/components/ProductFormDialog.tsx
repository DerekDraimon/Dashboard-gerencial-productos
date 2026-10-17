import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { ApiError } from '../../../shared/api/api-error';
import { FormDialog } from '../../../shared/components/form-dialog';
import { useNotify } from '../../../shared/feedback/use-notify';
import { createProduct, type Product, type ProductInput } from '../api/products-api';
import { useCategories } from '../hooks/useCategories';

export interface ProductFormValues {
  title: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  images: string[];
}

export interface ProductFormDialogProps {
  open: boolean;
  mode: 'create';
  onClose: () => void;
  onSaved: (product: Product) => void;
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
  return /^\d+$/.test(value.trim()) || 'El stock debe ser un número entero mayor o igual a 0.';
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

function validationDetails(error: unknown): { path: string; message: string }[] {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return [];
  return Array.isArray(error.details) ? (error.details as { path: string; message: string }[]) : [];
}

export function ProductFormDialog({ open, onClose, onSaved }: ProductFormDialogProps) {
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

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const product = await createProduct(toProductInput(values));
      notify.success('Producto creado');
      onSaved(product);
      onClose();
    } catch (error) {
      const fieldErrors = validationDetails(error).flatMap(({ path, message }) => {
        const name = FIELDS.find((field) => field === path.split('.')[0]);
        return name ? [{ name, message }] : [];
      });
      if (fieldErrors.length === 0) {
        notify.error(error instanceof ApiError ? error.message : UNEXPECTED_ERROR);
      }
      fieldErrors.forEach(({ name, message }) => setError(name, { message }));
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
      title="Nuevo producto"
      subtitle="Completa los datos del producto."
      submitLabel="Guardar producto"
      submitting={isSubmitting}
      onClose={onClose}
      onSubmit={(event) => void submit(event)}
      maxWidth="md"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' },
          gap: 3.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pt: 1 }}>
          <TextField label="Título" {...textField('title', requiredText('título', 120))} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
        </Box>
        <Box data-slot="product-preview" />
      </Box>
    </FormDialog>
  );
}
