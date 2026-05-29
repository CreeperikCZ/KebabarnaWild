import { useEffect, useState } from 'react';
import KebabMap from './komonenty/KebabMap'; // zkontroluj si případně překlep v názvu složky (komonenty vs komponenty)
import KebabList from './komonenty/KebabList';
import AdminPanel from './komonenty/AdminPanel';
import KebabCompare from './komonenty/KebabCompare';
import { addReviewToVenue, getInitialVenues, saveVenues } from './data/kebabRepository';

const App = () => {
    // Tohle ridi, jaka cast aplikace se zrovna ukazuje.
    const [view, setView] = useState('map');
    const [venues, setVenues] = useState(getInitialVenues);
    const [activeVenueId, setActiveVenueId] = useState(null);
    const [reviewVenueId, setReviewVenueId] = useState(null);
    // Admin login je jen jednoducha ochrana pro tuhle appku, neni to realne zabezpeceni serveru.
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminLoginError, setAdminLoginError] = useState('');

    const studentInfo = { name: 'Jan Wild', id: 'A25B0290P' };

    useEffect(() => {
        // Po kazde zmene ulozim podniky do localStorage, aby nezmizely po refreshi.
        saveVenues(venues);
    }, [venues]);

    const handleAddReview = (venueId, review) => {
        // Recenze se prida k jednomu podniku a potom se prepocitaji prumery.
        setVenues((currentVenues) => addReviewToVenue(currentVenues, venueId, review));
    };

    const handleReviewVenue = (venueId) => {
        // Sem se jde z mapy nebo porovnani, aby byl formular rovnou na spravny kebab.
        setReviewVenueId(venueId);
        setView('list');
    };

    const handleAdminLogin = (event) => {
        event.preventDefault();

        // Beru hodnoty z formulare, React state tady neni potreba.
        const formData = new FormData(event.currentTarget);
        const login = formData.get('login');
        const password = formData.get('password');

        if (login === 'admin' && password === 'admin') {
            setIsAdminLoggedIn(true);
            setAdminLoginError('');
            event.currentTarget.reset();
            return;
        }

        setAdminLoginError('Spatne jmeno nebo heslo.');
    };

    const getDistance = (lat1, lng1, lat2, lng2) => {
        // Neni to presna vzdalenost v metrech, ale na nalezeni nejblizsiho bodu na mape to staci.
        const dLat = lat1 - lat2;
        const dLng = lng1 - lng2;
        return Math.sqrt(dLat * dLat + dLng * dLng);
    };
    const handleFindNearestKebab = () => {
        // Prohlizec se nejdriv zepta uzivatele, jestli muze pouzit jeho polohu.
        if (!navigator.geolocation) {
            alert('Smůla, tvůj prohlížeč nepodporuje zjišťování polohy.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                let nearestVenue = null;
                let minDistance = Infinity;

                venues.forEach((venue) => {
                    // Pocitam jen podniky, ktere maji souradnice.
                    if (venue.coordinates && venue.coordinates.lat && venue.coordinates.lng) {
                        const dist = getDistance(userLat, userLng, venue.coordinates.lat, venue.coordinates.lng);
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestVenue = venue;
                        }
                    }
                });

                if (nearestVenue) {
                    setView('map');
                    setActiveVenueId(nearestVenue.id);
                    alert(`Nejbližší kebab je: ${nearestVenue.name}! Mapa tě na něj teď navede.`);
                } else {
                    alert('Chyba, nebyla nalezena žádná prodejna...');
                }
            },
            () => {
                alert('Nepodařilo se získat tvou polohu. Povol GPS v nastavení prohlížeče.');
            }
        );
    };

    return (
        <div className="app">
            <header className="app-header">
                <div>
                    <h1>Durum Kebab Komunita</h1>
                    <p>{studentInfo.name} ({studentInfo.id})</p>
                </div>
                <nav>
                    <button onClick={() => setView('map')}>Mapa</button>
                    <button onClick={() => setView('compare')}>Porovnání</button>
                    <button onClick={() => setView('admin')}>Admin</button>
                    <button
                        onClick={handleFindNearestKebab}
                        style={{ backgroundColor: '#fffae6', color: '#241f1a', fontWeight: 'bold' }}
                    >
                        📍 Najít nejbližší!
                    </button>
                    <button onClick={() => alert('Tato aplikace byla vytvořena se záměrem, usnadnit hledání dobrých kebabů. Zatím nemá backend, data jsou pouze testovací a nemají žádnou hodnotu. Vytvořil Jan Wild jako seminární práci na UUR (KIV-ZČU).')}>O aplikaci</button>
                </nav>
            </header>

            <main>
                {view === 'map' && (
                    <KebabMap
                        venues={venues}
                        activeVenueId={activeVenueId}
                        clearActiveVenue={() => setActiveVenueId(null)}
                        // TADY JSOU TY NOVÉ ŘÁDKY PRO PROPOJENÍ DETAILŮ:
                        selectedVenue={venues.find(v => v.id === activeVenueId) || venues[0]}
                        setSelectedVenue={(venue) => setActiveVenueId(venue?.id || null)}
                        onReviewVenue={handleReviewVenue}
                    />
                )}
                {view === 'list' && (
                    <KebabList
                        venues={venues}
                        onAddReview={handleAddReview}
                        selectedVenueId={reviewVenueId}
                    />
                )}
                {view === 'compare' && <KebabCompare venues={venues} onReviewVenue={handleReviewVenue} />}
                {view === 'admin' && (
                    isAdminLoggedIn ? (
                        <AdminPanel venues={venues} setVenues={setVenues} />
                    ) : (
                        <section className="panel admin-login-panel">
                            <h2>Admin prihlaseni</h2>
                            <form onSubmit={handleAdminLogin} className="admin-login-form">
                                <label>
                                    Jmeno
                                    <input type="text" name="login" autoComplete="username" required />
                                </label>
                                <label>
                                    Heslo
                                    <input type="password" name="password" autoComplete="current-password" required />
                                </label>
                                <button type="submit">Prihlasit</button>
                            </form>
                            {adminLoginError && <p className="form-message">{adminLoginError}</p>}
                        </section>
                    )
                )}
            </main>

            <footer>
                &copy; Jan Wild - semestrální práce UUR, KIV ZČU
            </footer>
        </div>
    );
};

export default App;
