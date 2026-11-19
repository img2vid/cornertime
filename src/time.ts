export function formatDuration(seconds: number): string {
    let sign = '';
    if (seconds < 0) {
        sign = '-';
        seconds = -seconds;
    }

    let minutes = Math.floor(seconds / 60);
    seconds %= 60;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    let hours = Math.floor(minutes / 60);
    minutes %= 60;

    if (hours) {
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${sign}${hours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
        return `${sign}${minutes}:${formattedSeconds}`;
    }
}

export function durationLabel(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    const remainder = seconds % 60;
    return [hours && hours + 'h', minutes && minutes + 'm', remainder && remainder + 's']
        .filter(Boolean).join(' ') || '0s';
}
