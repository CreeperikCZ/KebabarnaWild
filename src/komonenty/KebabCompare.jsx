import { useMemo, useState } from 'react';
import { formatPeppers } from '../data/kebabRepository';

const metricDefinitions = [
    // --- HODNOTÍCÍ METRIKY ---
    { key: 'overall', label: 'Celkové hodnocení', suffix: ' / 5', higherIsBetter: true },
    { key: 'taste', label: 'Chuť jídla', suffix: ' / 5', higherIsBetter: true },
    { key: 'value', label: 'Cena / Velikost', suffix: ' / 5', higherIsBetter: true },
    { key: 'service', label: 'Obsluha a rychlost', suffix: ' / 5', higherIsBetter: true },

    // --- INFORMATIVNÍ ÚDAJE A PARAMETRY ---
    { key: 'priceCzk', label: 'Cena', suffix: ' Kč', higherIsBetter: false },
    { key: 'size', label: 'Velikost', suffix: '', higherIsBetter: null },
    { key: 'saladMeatRatio', label: 'Salát / Maso', suffix: '', higherIsBetter: null },
    { key: 'crispy', label: 'Křupavost', suffix: '', higherIsBetter: null },
    { key: 'spicy', label: 'Pálivost', suffix: '', higherIsBetter: null },
];

const getMetricValue = (venue, key) => {
    // Některé hodnoty jsou přímo na podniku a některé jsou schované v rating.categories.
    if (!venue) return null;

    if (key === 'overall') return venue.rating?.overall ?? null;
    if (key in (venue.rating?.categories || {})) return venue.rating.categories[key];

    return venue[key] ?? null;
};

const formatMetricValue = (value, metric) => {
    if (value === null || value === undefined || value === '') {
        return 'Neuvedeno';
    }

    if (metric.key === 'spicy') {
        return formatPeppers(value);
    }

    // Pokud je to text (např. velikost 'Mega' nebo křupavost 'Ano'), vrátíme ho rovnou
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' && Number.isNaN(value)) {
        return 'Neuvedeno';
    }

    const displayValue = metric.transform ? metric.transform(value) : value;
    return `${Number(displayValue).toFixed(displayValue % 1 === 0 ? 0 : 1)}${metric.suffix}`;
};

const getWinner = (leftValue, rightValue, metric) => {
    // U ceny je lepší menší číslo, u hodnocení zase větší číslo. U textů je to informativní.
    if (metric.higherIsBetter === null) return null;
    if (leftValue === null || leftValue === undefined || rightValue === null || rightValue === undefined) return null;
    if (leftValue === rightValue) return 'draw';

    // Pro textové hodnoty, které by se sem náhodou dostaly a mají higherIsBetter true/false
    if (typeof leftValue === 'string' || typeof rightValue === 'string') return null;

    const leftWins = metric.higherIsBetter ? leftValue > rightValue : leftValue < rightValue;
    return leftWins ? 'left' : 'right';
};

const KebabCompare = ({ venues, onReviewVenue }) => {
    // Na začátku vyberu první dvě prodejny, aby tabulka nebyla prázdná.
    const selectableVenues = useMemo(() => venues.filter((venue) => venue.rating?.reviewCount > 0), [venues]);
    const [leftVenueId, setLeftVenueId] = useState(selectableVenues[0]?.id || venues[0]?.id || '');
    const [rightVenueId, setRightVenueId] = useState(selectableVenues[1]?.id || venues[1]?.id || selectableVenues[0]?.id || venues[0]?.id || '');

    const leftVenue = venues.find((venue) => venue.id === leftVenueId) || venues[0];
    const rightVenue = venues.find((venue) => venue.id === rightVenueId) || venues.find((venue) => venue.id !== leftVenue?.id) || venues[0];

    const sortedVenues = useMemo(
        // Žebříček řadím podle celkového hodnocení od nejlepšího.
        () => [...venues].sort((a, b) => (b.rating?.overall ?? 0) - (a.rating?.overall ?? 0)),
        [venues]
    );

    if (venues.length < 2) {
        return (
            <section className="panel">
                <h2>Porovnání prodejen</h2>
                <p className="compare-empty">Pro porovnání jsou potřeba alespoň dvě prodejny.</p>
            </section>
        );
    }

    return (
        <section className="panel compare-panel">
            <div className="compare-header">
                <div>
                    <h2>Porovnání prodejen</h2>
                    <p>Vyber dvě kebabárny a porovnej jejich hodnocení, cenu i parametry z recenzí.</p>
                </div>
                <div className="compare-selectors">
                    <label>
                        První prodejna
                        <select value={leftVenue?.id || ''} onChange={(event) => setLeftVenueId(event.target.value)}>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Druhá prodejna
                        <select value={rightVenue?.id || ''} onChange={(event) => setRightVenueId(event.target.value)}>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="compare-cards">
                {/* ZDE JE OPRAVA: Přidán index (i) do klíče, aby byly karty vždy unikátní */}
                {[leftVenue, rightVenue].map((venue, i) => (
                    <article key={`${venue.id}-${i}`} className="compare-card">
                        <span>{venue.address || 'Adresa neuvedena'}</span>
                        <h3>{venue.name}</h3>
                        <strong>{venue.rating?.overall ? `${venue.rating.overall} / 5` : 'Bez hodnocení'}</strong>
                        <small>{venue.rating?.reviewCount || 0} recenzí</small>
                        <button type="button" className="compare-card-action" onClick={() => onReviewVenue(venue.id)}>
                            Napsat recenzi
                        </button>
                    </article>
                ))}
            </div>

            <div className="compare-table-wrap">
                <table className="compare-table">
                    <thead>
                    <tr>
                        <th>Metrika</th>
                        <th>{leftVenue.name}</th>
                        <th>{rightVenue.name}</th>
                        <th>Lepší vychází</th>
                    </tr>
                    </thead>
                    <tbody>
                    {metricDefinitions.map((metric) => {
                        const leftValue = getMetricValue(leftVenue, metric.key);
                        const rightValue = getMetricValue(rightVenue, metric.key);
                        const winner = getWinner(leftValue, rightValue, metric);

                        return (
                            <tr key={metric.key}>
                                <td>{metric.label}</td>
                                <td className={winner === 'left' ? 'is-winner' : ''}>{formatMetricValue(leftValue, metric)}</td>
                                <td className={winner === 'right' ? 'is-winner' : ''}>{formatMetricValue(rightValue, metric)}</td>
                                <td>
                                    {winner === 'left' && leftVenue.name}
                                    {winner === 'right' && rightVenue.name}
                                    {winner === 'draw' && 'Remíza'}
                                    {winner === null && 'Informativní'}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <h3 className="compare-ranking-title">Celkový žebříček</h3>
            <ol className="compare-ranking">
                {sortedVenues.map((venue) => (
                    <li key={venue.id}>
                        <span>{venue.name}</span>
                        <strong>{venue.rating?.overall ? `${venue.rating.overall} / 5` : 'Bez hodnocení'}</strong>
                        <button type="button" onClick={() => onReviewVenue(venue.id)}>
                            Recenze
                        </button>
                    </li>
                ))}
            </ol>
        </section>
    );
};

export default KebabCompare;