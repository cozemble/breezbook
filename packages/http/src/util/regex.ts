export class Regex {
    matched: (RegExpExecArray | null)[] = [];
    nonMatched: string[] = [];

    constructor(private pattern: string) {
        this.matched = [];
        this.nonMatched = [];
    }

    match(against: string) {
        return new RegExp(this.pattern).exec(against)
    }

    * matches(against: string): Iterable<RegExpExecArray | null> {
        const regex = new RegExp(this.pattern, 'g');
        let start = 0;
        let nonMatch = '';
        // let rest = '';
        let match;
        while (match = regex.exec(against)) {
            if (match) {
                const end = against.indexOf(match[0]);
                nonMatch = against.slice(start, end);
                start = end + match[0].length;
                // rest = against.slice(start);
                this.matched.push(match);
                this.nonMatched.push(nonMatch);

                yield match;
            }
        }
    }
}
