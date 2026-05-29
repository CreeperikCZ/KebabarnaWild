import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pomocná funkce pro vygenerování obsahu popupu na mapě.
// Dělám to přes vanilla JS DOM elementy, protože Leaflet popupy
// nativně úplně nespolupracují s React komponentami.
const createPopupContent = (venue, onOpenDetail) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'map-popup';

    const name = document.createElement('strong');
    name.className = 'map-popup-name';
    name.textContent = venue.name;

    const address = document.createElement('span');
    address.className = 'map-popup-address';
    address.textContent = venue.address || 'Adresa neznámá';

    const rating = document.createElement('span');
    rating.className = 'map-popup-rating';
    rating.textContent = `Hodnocení: ${venue.rating?.overall || 'Zatím nehodnoceno'} / 5`;

    const detailBtn = document.createElement('button');
    detailBtn.className = 'map-popup-btn';
    detailBtn.textContent = 'Zobrazit detail';

    // Po kliku na tlačítko v popupu zavolám callback, co otevře velkej modál
    detailBtn.onclick = () => {
        onOpenDetail(venue);
    };

    wrapper.append(name, address, rating, detailBtn);
    return wrapper;
};

export default function KebabMap({ venues, selectedVenue, setSelectedVenue, onReviewVenue }) {
    // Reference, abych si udržel instanci mapy a divu, kam se mapa vykreslí
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    // Tady si schovávám vytvořené markery, abych s nima mohl manipulovat
    // (např. otevírat popupy zvenku)
    const markersRef = useRef({});

    // Stav pro to, jestli je zobrazený velký detail kebabu (modál)
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. Inicializace mapy (běží jen jednou po mountu)
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        // Nahodím mapu, vycentruju na Plzeň
        mapRef.current = L.map(mapContainerRef.current).setView([49.7475, 13.3776], 14);

        // Klasický OpenStreetMap dlaždice
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        // Cleanup funkce - když komponenta umře, zničím i mapu, ať z toho nejsou memory leaky
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 2. Vykreslení markerů (pokaždé, když se změní seznam podniků)
    useEffect(() => {
        if (!mapRef.current) return;

        // Nejdřív musím vyčistit mapu od starých markerů, jinak by se mi tam kupily
        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                mapRef.current.removeLayer(layer);
            }
        });

        markersRef.current = {};

        // Projdu všechny kebaby a pokud mají souřadnice, plácnu je na mapu
        venues.forEach((venue) => {
            if (venue.coordinates && venue.coordinates.lat && venue.coordinates.lng) {
                const marker = L.circleMarker([venue.coordinates.lat, venue.coordinates.lng], {
                    radius: 8,
                    fillColor: "#d35400", // Oranžová barva kebabu :D
                    color: "#9f3f00",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.85
                })
                    .addTo(mapRef.current)
                    .bindPopup(
                        createPopupContent(venue, () => {
                            setSelectedVenue(venue);
                            setIsModalOpen(true);
                        })
                    );

                // Uložím si referenci na marker pod jeho ID
                markersRef.current[venue.id] = marker;

                // Když kliknu na bodík na mapě, chci, aby se ten podnik vybral i v bočním panelu
                marker.on('click', () => {
                    setSelectedVenue(venue);
                });
            }
        });
    }, [venues, setSelectedVenue]);

    // 3. Reakce na vybrání podniku (kliknutí v bočním panelu nebo na mapě)
    useEffect(() => {
        if (!mapRef.current || !selectedVenue) return;

        const { lat, lng } = selectedVenue.coordinates || {};

        if (lat && lng) {
            // Přejedu na dané místo (s animací, ať to vypadá hezky)
            mapRef.current.setView([lat, lng], 16, { animate: true });

            const activeMarker = markersRef.current[selectedVenue.id];
            if (activeMarker) {
                // Timeout tu mám proto, abych počkal, až dojede animace kamery,
                // jinak se popup otevře blbě nebo se mapa cukne
                setTimeout(() => {
                    activeMarker.openPopup();
                }, 250);
            }
        }
    }, [selectedVenue]);

    return (
        <div className="map-layout">
            {/* Kontejner pro samotnou Leaflet mapu */}
            <div ref={mapContainerRef} className="kebab-map" />

            {/* Boční panel se seznamem všech podniků */}
            <div className="map-sidebar">
                <ul className="venue-list">
                    {venues.map((venue) => {
                        const isSelected = selectedVenue?.id === venue.id;
                        return (
                            <li key={venue.id} className={isSelected ? 'is-selected' : ''}>
                                <button
                                    type="button"
                                    className="venue-list-btn"
                                    onClick={() => setSelectedVenue(venue)}
                                >
                                    <div className="venue-list-item-header">
                                        <strong className="venue-list-name">{venue.name}</strong>
                                        <span className="venue-list-rating">
                                            ⭐ {venue.rating?.overall || '-'}
                                        </span>
                                    </div>
                                    <span className="venue-list-address">
                                        {venue.address || 'Adresa neznámá'}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Rychlé info o vybraném podniku dole v panelu */}
                {selectedVenue && (
                    <div className="venue-detail sidebar-detail">
                        <h3 className="venue-detail-title">{selectedVenue.name}</h3>

                        <p className="venue-detail-address">
                            {selectedVenue.address || 'Adresa neznámá'}
                        </p>

                        <button
                            type="button"
                            className="venue-detail-action"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Zobrazit detail
                        </button>
                    </div>
                )}
            </div>

            {/* Velké modální okno s detailními informacemi o kebabu */}
            {isModalOpen && selectedVenue && (
                // Kliknutím na overlay zavřu modál
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    {/* stopPropagation zabrání tomu, abych modál zavřel kliknutím do něj */}
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                            ✖
                        </button>

                        <h3 className="modal-title">{selectedVenue.name}</h3>
                        <span className="modal-address">
                            {selectedVenue.address || 'Adresa neznámá'}
                        </span>

                        <h4 className="modal-subtitle">Parametry kebabu</h4>
                        <dl className="modal-params">
                            <div className="param-row">
                                <dt>Cena:</dt>
                                <dd>{selectedVenue.priceCzk ? `${selectedVenue.priceCzk} Kč` : 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Velikost:</dt>
                                <dd>{selectedVenue.size || 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Křupavost (chleba/tortilla):</dt>
                                <dd>{selectedVenue.crispy || 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Poměr maso/salát:</dt>
                                <dd>
                                    {/* Přepočet na procenta, pokud je to desetinné číslo <= 1 */}
                                    {selectedVenue.saladMeatRatio !== null
                                        ? `${selectedVenue.saladMeatRatio <= 1 ? selectedVenue.saladMeatRatio * 100 : selectedVenue.saladMeatRatio} %`
                                        : 'Neuvedeno'}
                                </dd>
                            </div>
                            <div className="param-row">
                                <dt>Pálivost:</dt>
                                <dd>
                                    {/* Trochu vizuálu pro pálivost ať to není jen číslo */}
                                    {selectedVenue.spicy === 3 ? '🌶️🌶️🌶️' :
                                        selectedVenue.spicy === 2 ? '🌶️🌶️' :
                                            selectedVenue.spicy === 1 ? '🌶️' : 'Nepálivý'}
                                </dd>
                            </div>
                        </dl>

                        <h4 className="modal-subtitle">Hodnocení (1-5)</h4>
                        <dl className="modal-params">
                            <div className="param-row">
                                <dt>Chuť jídla:</dt>
                                <dd>{selectedVenue.rating?.categories?.taste ? `${selectedVenue.rating.categories.taste} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Obsluha a rychlost:</dt>
                                <dd>{selectedVenue.rating?.categories?.service ? `${selectedVenue.rating.categories.service} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Cena / Velikost:</dt>
                                <dd>{selectedVenue.rating?.categories?.value ? `${selectedVenue.rating.categories.value} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div className="param-row">
                                <dt>Celkové hodnocení:</dt>
                                <dd className="highlight-value">
                                    {selectedVenue.rating?.overall ? `${selectedVenue.rating.overall} / 5` : 'Bez hodnocení'}
                                </dd>
                            </div>
                        </dl>

                        {/* Vykreslím recenze jen když nějaké existují a mají napsaný text (note) */}
                        {selectedVenue.reviews && selectedVenue.reviews.some(r => r.note) && (
                            <div className="modal-reviews">
                                <h4 className="modal-subtitle">Co říkají ostatní:</h4>
                                <ul className="review-list">
                                    {selectedVenue.reviews.filter(r => r.note).map((review, i) => (
                                        <li key={i} className="review-item">
                                            <em>"{review.note}"</em>
                                            <div className="review-author">
                                                - {review.author || 'Anonym'}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            type="button"
                            className="venue-detail-action"
                            onClick={() => {
                                // Vyvolám akci pro zapsání recenze a rovnou tenhle modál zavřu
                                onReviewVenue(selectedVenue.id);
                                setIsModalOpen(false);
                            }}
                        >
                            Napsat recenzi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}