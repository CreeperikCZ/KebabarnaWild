import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createPopupContent = (venue, onOpenDetail) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'map-popup';

    const name = document.createElement('strong');
    name.textContent = venue.name;
    name.style.display = 'block';

    const address = document.createElement('span');
    address.textContent = venue.address || 'Adresa neznámá';
    address.style.display = 'block';
    address.style.marginBottom = '4px';

    const rating = document.createElement('span');
    rating.textContent = `Hodnocení: ${venue.rating?.overall || 'Zatím nehodnoceno'} / 5`;
    rating.style.display = 'block';
    rating.style.marginBottom = '8px';

    const detailBtn = document.createElement('button');
    detailBtn.textContent = 'Zobrazit detail';
    detailBtn.style.padding = '6px 10px';
    detailBtn.style.background = 'var(--accent)';
    detailBtn.style.color = 'white';
    detailBtn.style.border = 'none';
    detailBtn.style.borderRadius = '4px';
    detailBtn.style.cursor = 'pointer';
    detailBtn.style.width = '100%';
    detailBtn.style.fontWeight = 'bold';

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

            <div className="map-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <ul className="venue-list" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '10px' }}>
                    {venues.map((venue) => {
                        const isSelected = selectedVenue?.id === venue.id;
                        return (
                            <li key={venue.id} className={isSelected ? 'is-selected' : ''} style={{ marginBottom: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedVenue(venue)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        width: '100%',
                                        height: 'auto',
                                        minHeight: 'fit-content',
                                        padding: '12px 16px',
                                        gap: '4px',
                                        boxSizing: 'border-box',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '1.1rem' }}>{venue.name}</strong>
                                        <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                            ⭐ {venue.rating?.overall || '-'}
                                        </span>
                                    </div>
                                    {/* Adresa prodejny v listu */}
                                    <span style={{ color: '#666', fontSize: '0.9rem', display: 'block', marginTop: '2px' }}>
                                        {venue.address || 'Adresa neznámá'}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {selectedVenue && (
                    <div className="venue-detail" style={{ flexShrink: 0, padding: '1rem', borderTop: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedVenue.name}</h3>

                        {/* Přidána adresa i do malého okna pod seznamem */}
                        <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
                            {selectedVenue.address || 'Adresa neznámá'}
                        </p>

                        <button
                            type="button"
                            className="venue-detail-action"
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                fontSize: '1rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--accent)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Zobrazit detail
                        </button>
                    </div>
                )}
            </div>

            {/* Velké modální okno */}
            {isModalOpen && selectedVenue && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="venue-detail"
                        style={{
                            backgroundColor: '#fff',
                            padding: '2rem',
                            borderRadius: '12px',
                            maxWidth: '550px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            position: 'relative',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem', right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                lineHeight: 1,
                                color: 'var(--muted)'
                            }}
                        >
                            ✖
                        </button>

                        <h3 style={{ marginTop: 0, paddingRight: '2rem', marginBottom: '0.5rem' }}>{selectedVenue.name}</h3>
                        <span style={{ display: 'block', color: 'var(--muted, #666)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {selectedVenue.address || 'Adresa neznámá'}
                        </span>

                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-dark)' }}>Parametry kebabu</h4>
                        <dl style={{ margin: '0 0 1.5rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Cena:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.priceCzk ? `${selectedVenue.priceCzk} Kč` : 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Velikost:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.size || 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Křupavost (chleba/tortilla):</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.crispy || 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Poměr maso/salát:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>
                                    {selectedVenue.saladMeatRatio !== null
                                        ? `${selectedVenue.saladMeatRatio <= 1 ? selectedVenue.saladMeatRatio * 100 : selectedVenue.saladMeatRatio} %`
                                        : 'Neuvedeno'}
                                </dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Pálivost:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>
                                    {selectedVenue.spicy === 3 ? '🌶️🌶️🌶️' :
                                        selectedVenue.spicy === 2 ? '🌶️🌶️' :
                                            selectedVenue.spicy === 1 ? '🌶️' : 'Nepálivý'}
                                </dd>
                            </div>
                        </dl>

                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-dark)' }}>Hodnocení (1-5)</h4>
                        <dl style={{ margin: '0 0 1.5rem 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Chuť jídla:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.rating?.categories?.taste ? `${selectedVenue.rating.categories.taste} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Obsluha a rychlost:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.rating?.categories?.service ? `${selectedVenue.rating.categories.service} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Cena / Velikost:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold' }}>{selectedVenue.rating?.categories?.value ? `${selectedVenue.rating.categories.value} / 5` : 'Neuvedeno'}</dd>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                                <dt style={{ fontWeight: 'normal', color: 'var(--muted)' }}>Celkové hodnocení:</dt>
                                <dd style={{ margin: 0, fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                    {selectedVenue.rating?.overall ? `${selectedVenue.rating.overall} / 5` : 'Bez hodnocení'}
                                </dd>
                            </div>
                        </dl>

                        {selectedVenue.reviews && selectedVenue.reviews.some(r => r.note) && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-dark)' }}>Co říkají ostatní:</h4>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedVenue.reviews.filter(r => r.note).map((review, i) => (
                                        <li key={i} style={{ fontSize: '0.95rem', background: '#f9f9f9', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                                            <em>"{review.note}"</em>
                                            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
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
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                fontSize: '1rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--accent)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
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