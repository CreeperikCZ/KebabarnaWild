import database from './kebabDatabase.json';

const STORAGE_KEY = 'durum-kebab-venues';

// Pomocné funkce pro validaci
// Tady si hlidam, aby cisla nebyla uplne mimo rozsah.
const clampRating = (value) => Math.min(5, Math.max(1, Number(value)));
const roundToOneDecimal = (value) => Number(value.toFixed(1));

const optionalNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

// Pomocné převody pro křupavost (Text <-> Číslo pro průměrování)
// Krupavost je text, ale pro prumer ji potrebuju na chvili prevest na cislo.
const crispyTextToScore = { 'Ne': 0, 'Trochu jo': 0.5, 'Ano': 1 };
const crispyScoreToText = (score) => {
    if (score === null || !Number.isFinite(score)) return null;
    if (score >= 0.67) return 'Ano';
    if (score >= 0.33) return 'Trochu jo';
    return 'Ne';
};

// Obecná funkce pro výpočet průměru z pole hodnot
// Normalni prumer, prazdne hodnoty preskakuju.
const average = (values) => {
    const numericValues = values
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map(Number)
        .filter((value) => Number.isFinite(value));

    if (numericValues.length === 0) {
        return null;
    }

    return roundToOneDecimal(
        numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
    );
};

// Spočítá celkový průměr z hvězdiček jedné konkrétní recenze
// U jedne recenze zprumeruju hvezdicky dohromady.
const averageRatingOfReview = (ratings) => average(Object.values(ratings ?? {}));

// Pročistí a zkontroluje strukturu jedné recenze
// Tady si recenzi srovnam do jednoho tvaru, aby se s tim dal pocitat prumer.
const normalizeReview = (review) => ({
    id: review.id || `review-${Date.now()}-${Math.random()}`,
    author: review.author || 'Anonym',
    date: review.date || null,
    priceCzk: optionalNumber(review.priceCzk),
    saladMeatRatio: optionalNumber(review.saladMeatRatio),
    spicy: Math.min(3, Math.max(0, Number(review.spicy) || 0)),
    crispy: review.crispy || null,
    ratings: {
        taste: clampRating(review.ratings?.taste ?? 4),
        portion: clampRating(review.ratings?.portion ?? 4),
        service: clampRating(review.ratings?.service ?? 4),
        value: clampRating(review.ratings?.value ?? 4),
    },
    note: review.note || ''
});

// HLAVNÍ FUNKCE: Vezme podnik a spočítá živé průměry POUZE z jeho pole reviews
// Hlavni funkce pro podnik: vezme recenze a udela z nich aktualni prumery.
const aggregateVenueReviews = (venue) => {
    const reviews = (venue.reviews || []).map(normalizeReview);
    const reviewCount = reviews.length;

    // Pokud podnik nemá vůbec žádné recenze, vrátíme čisté prázdné hodnoty
    if (reviewCount === 0) {
        return {
            id: venue.id,
            name: venue.name,
            category: venue.category || "kebab",
            city: venue.city || "Plzen",
            address: venue.address,
            coordinates: venue.coordinates || null,
            priceCzk: optionalNumber(venue.priceCzk),
            saladMeatRatio: optionalNumber(venue.saladMeatRatio),
            spicy: optionalNumber(venue.spicy) ?? 0,
            crispy: venue.crispy || null,
            rating: {
                overall: null,
                reviewCount: 0,
                categories: { taste: null, portion: null, service: null, value: null },
            },
            reviews: [],
        };
    }

    // Spočítáme průměry jednotlivých kategorií hvězdiček ze všech recenzí
    const categories = {
        taste: average(reviews.map((r) => r.ratings.taste)),
        portion: average(reviews.map((r) => r.ratings.portion)),
        service: average(reviews.map((r) => r.ratings.service)),
        value: average(reviews.map((r) => r.ratings.value)),
    };

    // Spočítáme celkové hlavní hodnocení (průměr průměrů jednotlivých recenzí)
    const overallScore = average(reviews.map((r) => averageRatingOfReview(r.ratings)));

    // Spočítáme průměr pro textovou křupavost
    const crispyScores = reviews.map((r) => crispyTextToScore[r.crispy]).filter(v => v !== null && v !== undefined);
    const avgCrispyScore = crispyScores.length > 0 ? crispyScores.reduce((a, b) => a + b, 0) / crispyScores.length : null;

    return {
        id: venue.id,
        name: venue.name,
        category: venue.category || "kebab",
        city: venue.city || "Plzen",
        address: venue.address,
        coordinates: venue.coordinates || null,
        // Živé průměry počítané POUZE z pole reviews:
        priceCzk: average(reviews.map((r) => r.priceCzk)),
        saladMeatRatio: average(reviews.map((r) => r.saladMeatRatio)),
        spicy: average(reviews.map((r) => r.spicy)) ?? 0,
        crispy: crispyScoreToText(avgCrispyScore),
        rating: {
            overall: overallScore,
            reviewCount,
            categories,
        },
        reviews,
    };
};

export const getInitialVenues = () => {
    const storedVenues = window.localStorage.getItem(STORAGE_KEY);

    if (!storedVenues) {
        return database.venues.map(aggregateVenueReviews);
    }

    try {
        return JSON.parse(storedVenues).map(aggregateVenueReviews);
    } catch {
        return database.venues.map(aggregateVenueReviews);
    }
};

export const saveVenues = (venues) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));
};

export const formatPeppers = (spicy) => {
    const level = Math.round(Math.min(3, Math.max(0, Number(spicy) || 0)));
    if (level === 0) return '-';
    return '🌶️'.repeat(level);
};

export const createReview = (formData) => ({
    id: `review-${Date.now()}`,
    author: formData.get('author').trim() || 'Anonym',
    date: new Date().toISOString().slice(0, 10),
    priceCzk: optionalNumber(formData.get('priceCzk')),
    saladMeatRatio: optionalNumber(formData.get('saladMeatRatio')),
    ratings: {
        taste: clampRating(formData.get('taste')),
        portion: clampRating(formData.get('portion')),
        service: clampRating(formData.get('service')),
        value: clampRating(formData.get('value')),
    },
    spicy: Math.min(3, Math.max(0, Number(formData.get('spicy')) || 0)),
    crispy: formData.get('crispy'),
    note: formData.get('note').trim(),
});

export const addReviewToVenue = (venues, venueId, review) =>
    venues.map((venue) => {
        if (venue.id !== venueId) {
            return venue;
        }

        return aggregateVenueReviews({
            ...venue,
            reviews: [...(venue.reviews || []), review],
        });
    });
