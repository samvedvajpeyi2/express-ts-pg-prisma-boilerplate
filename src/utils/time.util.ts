export const parseDurationMs = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);
    const value = parseInt(match[1]);
    const units: Record<string, number> = {
        s: 1_000,
        m: 60_000,
        h: 3_600_000,
        d: 86_400_000,
    };
    return value * units[match[2]];
};
