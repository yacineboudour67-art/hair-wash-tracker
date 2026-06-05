// Persistence & business logic — no DOM access here

const Store = (() => {
  const KEY = 'washDates';

  function load() {
    return (JSON.parse(localStorage.getItem(KEY) || '[]'))
      .map(t => new Date(t))
      .sort((a, b) => b - a);
  }

  function save(dates) {
    localStorage.setItem(KEY, JSON.stringify(dates.map(d => d.getTime())));
  }

  // ── Date helpers ──────────────────────────────────────────
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function sameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
  }

  function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);
  }

  function mondayOfWeek(d) {
    const x = new Date(d);
    const offset = (x.getDay() + 6) % 7; // 0 = Mon
    x.setDate(x.getDate() - offset);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  }

  // ── Business rules ────────────────────────────────────────
  function canWash(dates, target = new Date()) {
    if (dates.some(d => sameDay(d, target)))
      return { ok: true, reason: 'Déjà lavé ce jour ✓' };

    const prior = dates.filter(d => startOfDay(d) < startOfDay(target));

    if (prior.length > 0) {
      const gap = daysBetween(prior[0], target);
      if (gap < 3) {
        const r = 3 - gap;
        return { ok: false, reason: `Encore ${r} jour${r > 1 ? 's' : ''} à attendre (min. 3 jours)` };
      }
    }

    const thisWeek = mondayOfWeek(target);
    const weekCount = prior.filter(d => mondayOfWeek(d) === thisWeek).length;
    if (weekCount >= 2)
      return { ok: false, reason: 'Limite de 2 lavages cette semaine atteinte' };

    return { ok: true, reason: "Tu peux laver aujourd'hui !" };
  }

  // ── Mutations ─────────────────────────────────────────────
  function addWash(dates, date = new Date()) {
    if (dates.some(d => sameDay(d, date))) return dates;
    const next = [...dates, date].sort((a, b) => b - a);
    save(next);
    return next;
  }

  function removeWash(dates, index) {
    const next = dates.filter((_, i) => i !== index);
    save(next);
    return next;
  }

  // ── Formatters ────────────────────────────────────────────
  function formatDate(d) {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function relativeDate(d) {
    const n = daysBetween(d, new Date());
    if (n === 0) return "Aujourd'hui";
    if (n === 1) return 'Hier';
    return `Il y a ${n} jours`;
  }

  return { load, sameDay, daysBetween, canWash, addWash, removeWash, formatDate, relativeDate };
})();
