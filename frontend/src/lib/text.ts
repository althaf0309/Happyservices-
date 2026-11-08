/** "AC Service" -> "AC service", "Refrigerator Repair" -> "refrigerator repair" (mid-sentence form). */
export function servicePhrase(name: string): string {
  return name
    .split(' ')
    .map((word) => (word.length > 1 && word === word.toUpperCase() ? word : word.toLowerCase()))
    .join(' ');
}

/** Sentence-start form: "AC service", "Refrigerator repair". */
export function serviceLabel(name: string): string {
  const phrase = servicePhrase(name);
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** The appliance/trade noun: "AC Service" -> "AC", "Washing Machine Repair" -> "washing machine". */
export function serviceNoun(name: string): string {
  const stripped = name.replace(/\s+(Service|Services|Repair|Installation)$/i, '');
  return servicePhrase(stripped);
}
