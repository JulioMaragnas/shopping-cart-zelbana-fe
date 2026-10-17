import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '../store/useCartStore';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
import type { OrderDetail, UserAddress, ConfirmPaymentPayload } from '../types';


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CheckoutPage - Gestión de Direcciones de Entrega y Maps (Fase 5.4)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useCartStore.setState({
      cart: [{ id: 'p1', name: 'Jabón Cacao', priceWhenAdded: 15, quantity: 2 }],
    });
  });

  const defaultOrder: OrderDetail = {
    id: 'ord-addr-test',
    status: 'RESERVED',
    totalAmount: 50.0,
    subtotalAmount: 65.0,
    discountAmount: 15.0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    customerEmail: 'julio@ejemplo.com',
    shippingAddress: null,
    items: [
      {
        productId: '1',
        name: 'Jabón de coco',
        quantity: 2,
        unitPrice: 20.0,
        salePrice: 12.5,
        discountPercentage: 37,
        lineSubtotal: 40.0,
        lineTotal: 25.0,
      },
    ],
  };

  const renderComponent = (savedAddresses: UserAddress[] = []) => {
    server.use(
      http.get('*/storefront/api/user/addresses', () => {
        return HttpResponse.json(savedAddresses);
      })
    );

    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[{ pathname: '/checkout/ord-addr-test', state: { order: defaultOrder } }]}>
            <Routes>
              <Route path="/checkout/:orderId" element={<CheckoutPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>
    );
  };

  it('TC-ORD-ADDR-1: Deshabilita el botón de pago si un usuario nuevo no ha completado los campos requeridos', async () => {
    renderComponent([]); // 0 direcciones guardadas

    await waitFor(() => {
      expect(screen.getByTestId('address-form')).toBeInTheDocument();
    });

    // Botón de pago debe estar deshabilitado
    const payBtn = screen.getByTestId('confirm-pay-button');
    expect(payBtn).toBeDisabled();

    // Muestra aviso de dirección requerida
    expect(screen.getByTestId('address-required-alert')).toBeInTheDocument();
  });

  it('TC-ADDR-1: Renderiza chips de sugerencias rápidas ("Casa", "Oficina", "Padres", "Pareja", "Otro")', async () => {
    renderComponent([]);

    await waitFor(() => {
      expect(screen.getByTestId('quick-chips-row')).toBeInTheDocument();
    });

    expect(screen.getByTestId('chip-casa')).toBeInTheDocument();
    expect(screen.getByTestId('chip-oficina')).toBeInTheDocument();
    expect(screen.getByTestId('chip-padres')).toBeInTheDocument();
    expect(screen.getByTestId('chip-pareja')).toBeInTheDocument();
    expect(screen.getByTestId('chip-otro')).toBeInTheDocument();

    // Al seleccionar "Otro", despliega campo para etiqueta personalizada
    fireEvent.click(screen.getByTestId('chip-otro'));
    expect(screen.getByTestId('custom-label-input')).toBeInTheDocument();
  });

  it('TC-ADDR-2: El checkbox "Guardar como mi dirección principal" está marcado por defecto (checked = true)', async () => {
    renderComponent([]);

    await waitFor(() => {
      const checkbox = screen.getByTestId('save-default-address-checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  it('TC-ADDR-3 & TC-ADDR-4: Google Maps Pin Picker como complemento de precisión opcional con fallback resiliente', async () => {
    renderComponent([]);

    await waitFor(() => {
      expect(screen.getByTestId('map-pin-picker')).toBeInTheDocument();
    });

    // Fallback visible informando que la dirección en texto es 100% suficiente
    expect(screen.getByText(/tu dirección en texto es 100% suficiente/i)).toBeInTheDocument();

    // Al expandir mapa, permite afinar ubicación y capturar coordenadas
    const toggleMapBtn = screen.getByTestId('toggle-map-btn');
    fireEvent.click(toggleMapBtn);

    expect(screen.getByTestId('map-interactive-area')).toBeInTheDocument();
    expect(screen.getByTestId('coords-display')).toHaveTextContent(/Coordenadas GPS:/i);

    // Clic en pin para simular ajuste de precisión
    const pin = screen.getByTestId('map-pin-marker');
    fireEvent.click(pin);
    expect(screen.getByTestId('coords-display')).toHaveTextContent(/Coordenadas GPS:/i);
  });

  it('TC-ADDR-5: Muestra dirección predeterminada y permite cambiar entre múltiples direcciones guardadas', async () => {
    const mockSaved: UserAddress[] = [
      {
        id: 'addr-casa',
        label: 'Casa',
        receiverName: 'Julio Cano',
        receiverPhone: '+57 300 111 2233',
        city: 'Medellín',
        department: 'Antioquia',
        addressLine: 'Carrera 65A # 1 sur - 10',
        additionalInfo: 'Torre 2, Apto 402',
        coordinates: { lat: 6.2081, lng: -75.5684 },
        isDefault: true,
      },
      {
        id: 'addr-oficina',
        label: 'Oficina',
        receiverName: 'Julio Cano',
        receiverPhone: '+57 310 999 8877',
        city: 'Medellín',
        department: 'Antioquia',
        addressLine: 'Calle 10 # 43E - 20',
        additionalInfo: 'Piso 5',
        coordinates: { lat: 6.21, lng: -75.57 },
        isDefault: false,
      },
    ];

    renderComponent(mockSaved);

    // Muestra la tarjeta seleccionada inicial (Casa - Principal)
    await waitFor(() => {
      expect(screen.getByTestId('selected-address-card')).toBeInTheDocument();
      expect(screen.getByText('Casa')).toBeInTheDocument();
      expect(screen.getByText('Principal')).toBeInTheDocument();
    });

    // Botón de pago debe estar habilitado ya que hay dirección seleccionada
    const payBtn = screen.getByTestId('confirm-pay-button');
    expect(payBtn).not.toBeDisabled();

    // Clic en cambiar dirección
    const changeBtn = screen.getByTestId('change-address-btn');
    fireEvent.click(changeBtn);

    // Lista de direcciones guardadas
    expect(screen.getByTestId('saved-addresses-list')).toBeInTheDocument();
    expect(screen.getByTestId('address-option-addr-oficina')).toBeInTheDocument();

    // Selecciona la oficina
    fireEvent.click(screen.getByTestId('address-option-addr-oficina'));

    // Ahora la tarjeta activa muestra la Oficina
    await waitFor(() => {
      expect(screen.getByTestId('selected-address-card')).toBeInTheDocument();
      expect(screen.getByText('Oficina')).toBeInTheDocument();
      expect(screen.getByText(/Calle 10 # 43E - 20/i)).toBeInTheDocument();
    });
  });

  it('TC-ORD-ADDR-2: Al completar el formulario, habilita el botón y envía shippingAddress obligatoria a confirm', async () => {
    let capturedBody: ConfirmPaymentPayload | null = null;
    server.use(

      http.post('*/storefront/api/checkout/confirm/:orderId', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: 'Pago consolidado en Kardex.' });
      })
    );

    renderComponent([]); // 0 direcciones guardadas

    await waitFor(() => {
      expect(screen.getByTestId('address-form')).toBeInTheDocument();
    });

    const payBtn = screen.getByTestId('confirm-pay-button');
    expect(payBtn).toBeDisabled();

    // Completar campos mínimos
    fireEvent.change(screen.getByTestId('receiver-name-input'), { target: { value: 'Andrea Restrepo' } });
    fireEvent.change(screen.getByTestId('receiver-phone-input'), { target: { value: '+57 320 555 4433' } });
    fireEvent.change(screen.getByTestId('city-input'), { target: { value: 'Envigado' } });
    fireEvent.change(screen.getByTestId('department-input'), { target: { value: 'Antioquia' } });
    fireEvent.change(screen.getByTestId('address-line-input'), { target: { value: 'Transversal 35 Sur # 32-15' } });
    fireEvent.change(screen.getByTestId('additional-info-input'), { target: { value: 'Casa 4' } });

    // Botón de pago debe habilitarse reactivamente
    await waitFor(() => {
      expect(payBtn).not.toBeDisabled();
    });

    // Confirmar pago
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/order-success/ord-addr-test', expect.any(Object));
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.shippingAddress).toContain('Transversal 35 Sur # 32-15');
      expect(capturedBody.shippingAddress).toContain('Envigado');
      expect(capturedBody.shippingAddress).toContain('Andrea Restrepo');
    });
  });
});
