import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createPopupContent = (venue) => {
    // Popup radeji skladam pres elementy, aby se do nej nedal omylem nacpat HTML kod z nazvu podniku.
    const wrapper = document.createElement('div');
    wrapper.className = 'map-popup';

    const name = document.createElement('strong');
    name.textContent = venue.name;

    const address = document.createElement('span');
    address.textContent = venue.address || 'Adresa neznama';

    const rating = document.createElement('span');
    rating.textContent = `Hodnoceni: ${venue.rating?.overall || 'Zatim nehodnoceno'} / 5`;

    wrapper.append(name, address, rating);
    return wrapper;
};

export default function KebabMap({ venues, selectedVenue, setSelectedVenue, onReviewVenue }) {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    // Objekt, do kterého si schováme reference na vytvořené markery, abychom je mohli otevírat na dálku
    const markersRef = useRef({});

    // 1. Inicializace mapy (spustí se pouze jednou při načtení komponenty)
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        // Vytvoření mapy vycentrované na Plzeň
        mapRef.current = L.map(mapContainerRef.current).setView([49.7475, 13.3776], 14);

        // Načtení mapových podkladů z OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 2. Kreslení markerů (bodů) na mapu při změně seznamu venues
    useEffect(() => {
        if (!mapRef.current) return;

        // Vyčistit všechny staré markery z mapy
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                mapRef.current.removeLayer(layer);
            }
        });

        // Vyčistíme i naše uložené reference
        markersRef.current = {};

        // Vykreslit nové markery pro všechny kebaby, které mají souřadnice
        venues.forEach((venue) => {
            if (venue.coordinates && venue.coordinates.lat && venue.coordinates.lng) {

                // Použijeme vestavěný kruhový marker s barvami tvého webu
                const marker = L.circleMarker([venue.coordinates.lat, venue.coordinates.lng], {
                    radius: 8,             // Velikost bodu
                    fillColor: "#d35400",   // Hlavní oranžová barva (--accent)
                    color: "#9f3f00",       // Tmavě oranžový obrys (--accent-dark)
                    weight: 2,              // Tloušťka obrysu
                    opacity: 1,
                    fillOpacity: 0.85       // Průhlednost vnitřku
                })
                    .addTo(mapRef.current)
                    .bindPopup(createPopupContent(venue));

                // Schováme si marker pod ID kebabu pro pozdější otevírání z lišty
                markersRef.current[venue.id] = marker;

                // Po kliknutí na bod na mapě ho označíme jako vybraný a posuneme mapu
                marker.on('click', () => {
                    setSelectedVenue(venue);
                });
            }
        });
    }, [venues, setSelectedVenue]);

    // 3. Centrování mapy A OTEVŘENÍ POPUPU, když se změní selectedVenue (kliknutím v seznamu nebo na mapě)
    useEffect(() => {
        if (!mapRef.current || !selectedVenue) return;

        const { lat, lng } = selectedVenue.coordinates || {};

        if (lat && lng) {
            // Posuneme mapu na vybraný kebab
            mapRef.current.setView([lat, lng], 16, { animate: true });

            // Vytáhneme si příslušný marker z naší paměti a s mírným zpožděním (kvůli animaci mapy) ho otevřeme
            const activeMarker = markersRef.current[selectedVenue.id];
            if (activeMarker) {
                setTimeout(() => {
                    activeMarker.openPopup();
                }, 250); // 250 milisekund počká, než se mapa přesune, a pak vyhodí bublinu
            }
        }
    }, [selectedVenue]);

    return (
        <div className="map-layout">
            {/* Div, do kterého Leaflet vykreslí samotnou mapu */}
            <div ref={mapContainerRef} className="kebab-map" />

            {/* Pravý boční panel (Sidebar) se seznamem a detailem */}
            <div className="map-sidebar">
                <ul className="venue-list">
                    {venues.map((venue) => {
                        const isSelected = selectedVenue?.id === venue.id;
                        return (
                            <li key={venue.id} className={isSelected ? 'is-selected' : ''}>
                                <button type="button" onClick={() => setSelectedVenue(venue)}>
                                    <strong>{venue.name}</strong>
                                    <span>{venue.address || 'Adresa neznámá'}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Spodní detail vybraného kebabu */}
                {selectedVenue && (
                    <div className="venue-detail">
                        <h3>{selectedVenue.name}</h3>
                        <dl>
                            <div>
                                <dt>Cena:</dt>
                                <dd>{selectedVenue.priceCzk ? `${selectedVenue.priceCzk} Kč` : 'Neuvedeno'}</dd>
                            </div>
                            <div>
                                <dt>Křupavost (chleba/tortilla):</dt>
                                <dd>{selectedVenue.crispy || 'Neuvedeno'}</dd>
                            </div>
                            <div>
                                <dt>Poměr maso/salát:</dt>
                                <dd>{selectedVenue.saladMeatRatio !== null ? `${selectedVenue.saladMeatRatio * 100}%` : 'Neuvedeno'}</dd>
                            </div>
                            <div>
                                <dt>Pálivost:</dt>
                                <dd>
                                    {selectedVenue.spicy === 3 ? '🌶️🌶️🌶️' :
                                        selectedVenue.spicy === 2 ? '🌶️🌶️' :
                                            selectedVenue.spicy === 1 ? '🌶️' : 'Nepálivý'}
                                </dd>
                            </div>
                            <div>
                                <dt>Celkové hodnocení:</dt>
                                <dd style={{ color: 'var(--accent)' }}>
                                    {selectedVenue.rating?.overall ? `${selectedVenue.rating.overall} / 5` : 'Bez hodnocení'}
                                </dd>
                            </div>
                        </dl>
                        <button
                            type="button"
                            className="venue-detail-action"
                            onClick={() => onReviewVenue(selectedVenue.id)}
                        >
                            Napsat recenzi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}