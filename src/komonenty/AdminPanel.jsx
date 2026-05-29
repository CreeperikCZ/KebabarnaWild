import database from '../data/kebabDatabase.json';

const AdminPanel = ({ venues, setVenues, onReviewVenue }) => {
    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const name = formData.get('name').trim();

        // Vygenerujeme unikátní ID z názvu
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        // Vytvoříme prázdný podnik bez hodnocení
        const newVenue = {
            id: id || `kebab-${Date.now()}`,
            name: name,
            category: "kebab",
            city: "Plzeň",
            address: formData.get('address').trim(),
            coordinates: formData.get('lat') && formData.get('lng') ? {
                lat: Number(formData.get('lat')),
                lng: Number(formData.get('lng'))
            } : null,
            size: null,
            priceCzk: null,
            saladMeatRatio: null,
            spicy: 0,
            crispy: null,
            rating: {
                overall: null,
                reviewCount: 0,
                categories: {
                    taste: null,
                    portion: null,
                    service: null,
                    value: null
                }
            },
            reviews: []
        };

        setVenues((currentVenues) => [...currentVenues, newVenue]);

        event.target.reset();

        // Rovnou zavoláme přesměrování z App.jsx
        if (onReviewVenue) {
            onReviewVenue(newVenue.id);
        }
    };

    return (
        <section className="panel">
            <h2>Administrační panel</h2>

            {/* Statistiky databáze */}
            <div className="database-summary">
                <div>
                    <strong>Datový zdroj</strong>
                    <span>src/data/kebabDatabase.json</span>
                </div>
                <div>
                    <strong>Podniky</strong>
                    <span>{venues.length}</span>
                </div>
                <div>
                    <strong>Recenze</strong>
                    <span>{venues.reduce((total, venue) => total + venue.reviews.length, 0)}</span>
                </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            <h3>Založit nový kebab (bez recenzí)</h3>

            <form onSubmit={handleSubmit}>
                {/* 1. Řada: Základní info */}
                <div className="review-form">
                    <label className="review-form-note">
                        Název prodejny *
                        <input type="text" name="name" placeholder="Např. Kebab u Rondelu" required />
                    </label>
                </div>

                {/* 2. Řada: Lokalita podniku */}
                <div className="review-form">
                    <label className="review-form-note">
                        Adresa v Plzni *
                        <input type="text" name="address" placeholder="Např. Americká 42" required />
                    </label>
                    <label>
                        Zeměpisná šířka (Lat)
                        <input type="number" step="any" name="lat" placeholder="Např. 49.745" />
                    </label>
                    <label>
                        Zeměpisná délka (Lng)
                        <input type="number" step="any" name="lng" placeholder="Např. 13.378" />
                    </label>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <button type="submit">➕ Založit kebabárnu</button>
                </div>
            </form>
        </section>
    );
};

export default AdminPanel;