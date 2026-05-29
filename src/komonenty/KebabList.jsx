import { useState } from 'react';
import { createReview } from '../data/kebabRepository';

const KebabList = ({ venues, onAddReview, selectedVenueId }) => {
    const [message, setMessage] = useState('');
    // Kdyz prichazim z mapy nebo porovnani, tak se tady predvybere spravna prodejna.
    const initialVenueId = selectedVenueId || venues[0]?.id || '';

    const handleSubmit = (event) => {
        event.preventDefault();
        // FormData mi vytahne vsechny inputy podle jejich name.
        const formData = new FormData(event.currentTarget);
        const venueId = formData.get('venueId');

        // Najdeme jméno podniku jen pro hezčí hlášku
        const selectedVenue = venues.find(v => v.id === venueId);

        // Voláme uložení z App.jsx
        // Ulozeni je v App.jsx, protoze tam jsou vsechny podniky ve state.
        onAddReview(venueId, createReview(formData));

        event.currentTarget.reset();
        setMessage(`Díky! Recenze pro podnik "${selectedVenue?.name || 'Kebab'}" byla úspěšně uložena.`);

        // Hláška po 4 sekundách sama zmizí
        setTimeout(() => setMessage(''), 4000);
    };

    return (
        <section className="panel">
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
                        <input type="number" name="saladMeatRatio" min="0" max="1" step="0.1" placeholder="Např. 0.8" />
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
                        Cena / Velikost *
                        <input type="number" name="value" min="1" max="5" defaultValue="4" required />
                    </label>
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

            {/* Úspěšná hláška */}
            {message && (
                <p className="form-message" style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffaf5', borderRadius: '6px', border: '1px solid var(--accent)' }}>
                    {message}
                </p>
            )}
        </section>
    );
};

export default KebabList;