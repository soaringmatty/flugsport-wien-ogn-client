export function getTimeAgoString(isoTimestamp: string): string {
  const timestamp = new Date(isoTimestamp).getTime();
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  const intervals: { [key: string]: number } = {
    'Tag': 86400,
    'Stunde': 3600,
    'Minute': 60,
    'Sekunde': 1,
  };

  for (const unit in intervals) {
    const counter = Math.floor(seconds / intervals[unit]);
    if (counter > 0) {
      const pluralPostfix = unit === 'Tag' ? 'en' : 'n';
      const plural = counter === 1 ? '' : pluralPostfix;
      return `vor ${counter} ${unit}${plural}`;
    }
  }

  return 'gerade eben';
}