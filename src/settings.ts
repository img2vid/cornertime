export interface Settings {
    // Fraction of changed pixels in the most active 6-by-6 camera tile.
    threshold: number;
    name: string;
    preparationSeconds: number;
    cooldownSeconds: number;
}

const defaultSettings: Settings = {
    name: 'Anonymous',
    threshold: 0.15,
    preparationSeconds: 10,
    cooldownSeconds: 5,
};


export default function getSettings(): Settings {
    if (typeof localStorage !== 'undefined') {
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            return { ...defaultSettings, ...JSON.parse(storedSettings) };
        }
    }

    return defaultSettings;
}
