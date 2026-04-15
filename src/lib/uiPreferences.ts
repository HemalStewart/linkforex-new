'use client';

export type UiSettings = {
    tableFontSizePx: number;
    toastMessageTimerMs: number;
};

const UI_SETTINGS_KEY = 'uiSettings';

const defaultSettings: UiSettings = {
    tableFontSizePx: 14,
    toastMessageTimerMs: 3000,
};

const LEGACY_PRESET_TO_PX: Record<string, number> = {
    small: 12,
    medium: 14,
    large: 17,
};

const normalizeToastTimerMs = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return defaultSettings.toastMessageTimerMs;
    return Math.max(1000, Math.min(10000, Math.round(num / 500) * 500));
};

const normalizeTableFontPx = (value: unknown): number => {
    if (typeof value === 'string' && value in LEGACY_PRESET_TO_PX) {
        return LEGACY_PRESET_TO_PX[value];
    }
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return defaultSettings.tableFontSizePx;
    return Math.max(10, Math.min(20, Math.round(num)));
};

export const getStoredUiSettings = (): UiSettings => {
    if (typeof window === 'undefined') return defaultSettings;
    const raw = window.localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return defaultSettings;

    try {
        const parsed = JSON.parse(raw) as Partial<UiSettings>;
        return {
            tableFontSizePx: normalizeTableFontPx((parsed as any)?.tableFontSizePx ?? (parsed as any)?.tableFontSize),
            toastMessageTimerMs: normalizeToastTimerMs((parsed as any)?.toastMessageTimerMs ?? (parsed as any)?.toastTimerMs),
        };
    } catch {
        return defaultSettings;
    }
};

export const applyUiSettings = (settings: UiSettings): void => {
    if (typeof window === 'undefined') return;

    const normalized: UiSettings = {
        tableFontSizePx: normalizeTableFontPx(settings.tableFontSizePx),
        toastMessageTimerMs: normalizeToastTimerMs(settings.toastMessageTimerMs),
    };

    const root = document.documentElement;
    const headPx = Math.max(10, normalized.tableFontSizePx - 2);

    root.style.setProperty('--table-font-size', `${normalized.tableFontSizePx}px`);
    root.style.setProperty('--table-head-font-size', `${headPx}px`);

    window.localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('ui-settings-change'));
};
