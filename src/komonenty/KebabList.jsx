import { useState } from 'react';
import { createReview } from '../data/kebabRepository';

// Přidali jsme nový prop "onNavigateToMap"
const KebabList = ({ venues, onAddReview, selectedVenueId, showNewVenuePopup, closeNewVenuePopup, onNavigateToMap }) => {
    const [message, setMessage] = useState('');

    // Kdyz prichazim z mapy nebo porovnani, tak se tady predvybere spravna prodejna.
    const initialVenueId = selectedVenueId || venues[0]?.id || '';

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const venueId = formData.get('venueId');

        const selectedVenue = venues.find(v => v.id === venueId);

        onAddReview(venueId, createReview(formData));

        event.currentTarget.reset();

        // Zobrazíme hlášku včetně informace o přesměrování
        setMessage(`Díky! Recenze pro podnik "${selectedVenue?.name || 'Kebab'}" byla úspěšně uložena. Přesměrovávám zpět na mapu...`);

        // Počkáme 2 sekundy a pak přesměrujeme
        setTimeout(() => {
            setMessage('');
            if (onNavigateToMap) {
                onNavigateToMap();
            }
        }, 2000);
    };

    return (
        <section className="panel" style={{ position: 'relative' }}>

            {/* VYSKAKOVACÍ OKNO PO VYTVOŘENÍ NOVÉ PRODEJNY V ADMINU */}
            {showNewVenuePopup && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '450px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, color: 'var(--accent-dark)' }}>🎉 Prodejna založena!</h2>
                        <p style={{ fontSize: '1.05rem', margin: '1rem 0 1.5rem', lineHeight: '1.5' }}>
                            Kebabárna byla úspěšně přidána do systému. Nyní je potřeba jí napsat <strong>první úvodní recenzi</strong>, aby měla nějaké hodnocení a zobrazovaly se u ní hodnoty!
                        </p>
                        <button
                            type="button"
                            onClick={closeNewVenuePopup}
                            style={{
                                padding: '0.8rem 1.5rem',
                                fontSize: '1.1rem',
                                background: 'var(--accent)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                width: '100%'
                            }}
                        >
                            Napsat první recenzi
                        </button>
                    </div>
                </div>
            )}

            <h2>Napsat novou recenzi</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                Vyber ze seznamu plzeňských kebabáren, vyplň parametry a pomoz komunitě vybrat ten nejlepší durum!
            </p>

            <form onSubmit={handleSubmit}>
                {/* 1. SEKCE: Výběr podniku a autor */}
                <div className="review-form">
                    <label className="review-form-note">
                        Vyber prodejnu (Adresa) *
                        <select name="venueId" defaultValue={initialVenueId} key={initialVenueId} required>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.name} ({venue.address})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="review-form-note">
                        Tvoje jméno / Přezdívka
                        <input type="text" name="author" placeholder="Anonym" />
                    </label>
                </div>

                {/* 2. SEKCE: Parametry kebabu (Cena, Velikost, Maso a doplňky) */}
                <div className="review-form" style={{ marginTop: '0.5rem' }}>
                    <label>
                        Velikost
                        <select name="size" defaultValue="Velký">
                            <option value="Malý">Malý</option>
                            <option value="Standardní">Standardní</option>
                            <option value="Velký">Velký</option>
                            <option value="Mega">Mega</option>
                        </select>
                    </label>
                    <label>
                        Cena (Kč) *
                        <input type="number" name="priceCzk" min="0" step="1" placeholder="Např. 150" required />
                    </label>
                    <label>
                        Salát / Maso
                        <input type="number" name="saladMeatRatio" min="0" max="100" step="1" placeholder="Např. 80 (v %)" />
                    </label>
                    <label>
                        Křupavost
                        <select name="crispy" defaultValue="Trochu jo">
                            <option value="Ano">Ano</option>
                            <option value="Trochu jo">Trochu jo</option>
                            <option value="Ne">Ne</option>
                        </select>
                    </label>
                    <label>
                        Pálivost
                        <select name="spicy" defaultValue="1">
                            <option value="0">Bez pálivosti (-)</option>
                            <option value="1">Jemně pálí (🌶️)</option>
                            <option value="2">Střední nálož (🌶️🌶️)</option>
                            <option value="3">Peklo / Ostré (🌶️🌶️🌶️)</option>
                        </select>
                    </label>
                </div>

                {/* 3. SEKCE: Číselné hodnocení (Hvězdičky 1-5) */}
                <h3 style={{ fontSize: '1.1rem', margin: '1.5rem 0 0.5rem', color: 'var(--accent-dark)' }}>Bodové hodnocení (1 = nejhorší, 5 = nejlepší)</h3>
                <div className="review-form">
                    <label>
                        Chuť *
                        <input type="number" name="taste" min="1" max="5" defaultValue="4" required />
                    </label>
                    <label>
                        Obsluha a rychlost *
                        <input type="number" name="service" min="1" max="5" defaultValue="4" required />
                    </label>
                </div>

                {/* 4. SEKCE: Slovní poznámka */}
                <div className="review-form" style={{ marginTop: '0.5rem' }}>
                    <label className="review-form-note" style={{ gridColumn: 'span 4' }}>
                        Slovní komentář (Co ti chutnalo / nechutnalo)
                        <textarea name="note" rows="3" placeholder="Zde můžeš napsat podrobnosti..." />
                    </label>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                        🚀 Odeslat recenzi do systému
                    </button>
                </div>
            </form>

            {message && (
                <p className="form-message" style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffaf5', borderRadius: '6px', border: '1px solid var(--accent)' }}>
                    ✅ {message}
                </p>
            )}
        </section>
    );
};

export default KebabList;