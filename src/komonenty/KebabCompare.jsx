import { useMemo, useState } from 'react';
import { formatPeppers } from '../data/kebabRepository';

const metricDefinitions = [
    // Tady mam seznam veci, ktere chci mezi dvema podniky porovnavat.
    { key: 'overall', label: 'Celkove hodnoceni', suffix: ' / 5', higherIsBetter: true },
    { key: 'taste', label: 'Chut jidla', suffix: ' / 5', higherIsBetter: true },
    { key: 'portion', label: 'Velikost porce', suffix: ' / 5', higherIsBetter: true },
    { key: 'service', label: 'Obsluha a rychlost', suffix: ' / 5', higherIsBetter: true },
    { key: 'value', label: 'Cena / vykon', suffix: ' / 5', higherIsBetter: true },
    { key: 'priceCzk', label: 'Cena', suffix: ' Kc', higherIsBetter: false },
    { key: 'saladMeatRatio', label: 'Podil masa', suffix: ' %', higherIsBetter: true, transform: (value) => value * 100 },
    { key: 'spicy', label: 'Palivost', suffix: '', higherIsBetter: null },
];

const getMetricValue = (venue, key) => {
    // Nektere hodnoty jsou primo na podniku a nektere jsou schovane v rating.categories.
    if (!venue) return null;

    if (key === 'overall') return venue.rating?.overall ?? null;
    if (key in (venue.rating?.categories || {})) return venue.rating.categories[key];

    return venue[key] ?? null;
};

const formatMetricValue = (value, metric) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return 'Neuvedeno';
    }

    if (metric.key === 'spicy') {
        return formatPeppers(value);
    }

    const displayValue = metric.transform ? metric.transform(value) : value;
    return `${Number(displayValue).toFixed(displayValue % 1 === 0 ? 0 : 1)}${metric.suffix}`;
};

const getWinner = (leftValue, rightValue, metric) => {
    // U ceny je lepsi mensi cislo, u hodnoceni zase vetsi cislo.
    if (metric.higherIsBetter === null) return null;
    if (leftValue === null || leftValue === undefined || rightValue === null || rightValue === undefined) return null;
    if (leftValue === rightValue) return 'draw';

    const leftWins = metric.higherIsBetter ? leftValue > rightValue : leftValue < rightValue;
    return leftWins ? 'left' : 'right';
};

const KebabCompare = ({ venues, onReviewVenue }) => {
    // Na zacatku vyberu prvni dve prodejny, aby tabulka nebyla prazdna.
    const selectableVenues = useMemo(() => venues.filter((venue) => venue.rating?.reviewCount > 0), [venues]);
    const [leftVenueId, setLeftVenueId] = useState(selectableVenues[0]?.id || venues[0]?.id || '');
    const [rightVenueId, setRightVenueId] = useState(selectableVenues[1]?.id || venues[1]?.id || selectableVenues[0]?.id || venues[0]?.id || '');

    const leftVenue = venues.find((venue) => venue.id === leftVenueId) || venues[0];
    const rightVenue = venues.find((venue) => venue.id === rightVenueId) || venues.find((venue) => venue.id !== leftVenue?.id) || venues[0];

    const sortedVenues = useMemo(
        // Zebricek radim podle celkoveho hodnoceni od nejlepsiho.
        () => [...venues].sort((a, b) => (b.rating?.overall ?? 0) - (a.rating?.overall ?? 0)),
        [venues]
    );

    if (venues.length < 2) {
        return (
            <section className="panel">
                <h2>Porovnani prodejen</h2>
                <p className="compare-empty">Pro porovnani jsou potreba alespon dve prodejny.</p>
            </section>
        );
    }

    return (
        <section className="panel compare-panel">
            <div className="compare-header">
                <div>
                    <h2>Porovnani prodejen</h2>
                    <p>Vyber dve kebabarny a porovnej jejich hodnoceni, cenu i parametry z recenzi.</p>
                </div>
                <div className="compare-selectors">
                    <label>
                        Prvni prodejna
                        <select value={leftVenue?.id || ''} onChange={(event) => setLeftVenueId(event.target.value)}>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Druha prodejna
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
                {[leftVenue, rightVenue].map((venue) => (
                    <article key={venue.id} className="compare-card">
                        <span>{venue.address || 'Adresa neuvedena'}</span>
                        <h3>{venue.name}</h3>
                        <strong>{venue.rating?.overall ? `${venue.rating.overall} / 5` : 'Bez hodnoceni'}</strong>
                        <small>{venue.rating?.reviewCount || 0} recenzi</small>
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
                            <th>Lepse vychazi</th>
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
                                        {winner === 'draw' && 'Remiza'}
                                        {winner === null && 'Informativni'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <h3 className="compare-ranking-title">Celkovy zebricek</h3>
            <ol className="compare-ranking">
                {sortedVenues.map((venue) => (
                    <li key={venue.id}>
                        <span>{venue.name}</span>
                        <strong>{venue.rating?.overall ? `${venue.rating.overall} / 5` : 'Bez hodnoceni'}</strong>
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
