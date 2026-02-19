class StringFormats {
    static normalizeStepTitle(title) {
        if (title.length === 0)
            return title;
        return title
            .trim()
            .split(/\s+/)
            .map((word) => word[0]?.toUpperCase() + word.slice(1))
            .join(" ");
    }
}
export default StringFormats;
