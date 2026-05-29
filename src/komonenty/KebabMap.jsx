import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

    detailBtn.onclick = () => {
        onOpenDetail(venue);
    };

    wrapper.append(name, address, rating, detailBtn);
    return wrapper;
};

export default function KebabMap({ venues, selectedVenue, setSelectedVenue, onReviewVenue }) {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markersRef = useRef({});

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        mapRef.current = L.map(mapContainerRef.current).setView([49.7475, 13.3776], 14);

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

    useEffect(() => {
        if (!mapRef.current) return;

        mapRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                mapRef.current.removeLayer(layer);
            }
        });

        markersRef.current = {};

        venues.forEach((venue) => {
            if (venue.coordinates && venue.coordinates.lat && venue.coordinates.lng) {
                const marker = L.circleMarker([venue.coordinates.lat, venue.coordinates.lng], {
                    radius: 8,
                    fillColor: "#d35400",
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

                markersRef.current[venue.id] = marker;

                marker.on('click', () => {
                    setSelectedVenue(venue);
                });
            }
        });
    }, [venues, setSelectedVenue]);

    useEffect(() => {
        if (!mapRef.current || !selectedVenue) return;

        const { lat, lng } = selectedVenue.coordinates || {};

        if (lat && lng) {
            mapRef.current.setView([lat, lng], 16, { animate: true });

            const activeMarker = markersRef.current[selectedVenue.id];
            if (activeMarker) {
                setTimeout(() => {
                    activeMarker.openPopup();
                }, 250);
            }
        }
    }, [selectedVenue]);

    return (
        <div className="map-layout">
            <div ref={mapContainerRef} className="kebab-map" />

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

            {/* Velké modální okno */}
            {isModalOpen && selectedVenue && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
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
                                    {selectedVenue.saladMeatRatio !== null
                                        ? `${selectedVenue.saladMeatRatio <= 1 ? selectedVenue.saladMeatRatio * 100 : selectedVenue.saladMeatRatio} %`
                                        : 'Neuvedeno'}
                                </dd>
                            </div>
                            <div className="param-row">
                                <dt>Pálivost:</dt>
                                <dd>
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