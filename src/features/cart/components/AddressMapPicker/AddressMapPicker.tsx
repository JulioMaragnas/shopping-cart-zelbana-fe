import React, { useState } from 'react';
import type { ShippingCoordinates } from '../../types';
import styles from './AddressMapPicker.module.css';

interface AddressMapPickerProps {
  coordinates?: ShippingCoordinates | null;
  onChangeCoordinates: (coords: ShippingCoordinates) => void;
  disabled?: boolean;
}

export function AddressMapPicker({
  coordinates,
  onChangeCoordinates,
  disabled = false,
}: AddressMapPickerProps) {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const currentCoords = coordinates || { lat: 6.2081, lng: -75.5684 };

  const handleSimulateDrag = () => {
    if (disabled) return;
    // Simular pequeño desplazamiento de precisión del pin
    const newCoords: ShippingCoordinates = {
      lat: Number((currentCoords.lat + (Math.random() * 0.001 - 0.0005)).toFixed(6)),
      lng: Number((currentCoords.lng + (Math.random() * 0.001 - 0.0005)).toFixed(6)),
    };
    onChangeCoordinates(newCoords);
  };

  return (
    <div className={styles.mapWrapper} data-testid="map-pin-picker">
      <div className={styles.mapHeader}>
        <span className={styles.mapTitle}>
          <span>📍</span> Complemento de ubicación en mapa
          <span className={styles.optionalBadge}>Opcional</span>
        </span>
        <button
          type="button"
          className={styles.toggleMapBtn}
          onClick={() => setIsMapExpanded((prev) => !prev)}
          data-testid="toggle-map-btn"
          aria-expanded={isMapExpanded}
        >
          {isMapExpanded ? 'Ocultar mapa' : 'Afinar ubicación con Pin'}
        </button>

      </div>

      {isMapExpanded ? (
        <>
          <div
            className={styles.mapContainer}
            onClick={handleSimulateDrag}
            data-testid="map-interactive-area"
            title="Haz clic o arrastra para ubicar el pin en la entrada o portería exacta"
          >
            <div
              className={styles.mapPin}
              data-testid="map-pin-marker"
              onClick={(e) => {
                e.stopPropagation();
                handleSimulateDrag();
              }}
            >
              <div className={styles.pinIcon}>📍</div>
              <div className={styles.pinPulse} />
              <div className={styles.pinLabel}>Entrada / Portería</div>
            </div>
          </div>

          <div className={styles.coordsInfo} data-testid="coords-display">
            Coordenadas GPS: {currentCoords.lat}, {currentCoords.lng}
          </div>
        </>
      ) : null}

      <p className={styles.fallbackNotice}>
        <span>ℹ️</span> Si el mapa no carga o prefieres no usarlo, tu dirección en texto es 100% suficiente para procesar la entrega.
      </p>
    </div>
  );
}
