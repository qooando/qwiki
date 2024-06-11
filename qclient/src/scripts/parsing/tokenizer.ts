export namespace tokenizer {

    export interface Token {
        label: string
        content: string

        [x: string]: any
    }

    export interface Context {
        tokenBuffer: Token[]
        tokenBufferMaxLength: number
        prevIndex: number
        nextIndex: number
        rule?: Rule
        matches?: any[]

        [x: string]: any
    }

    /*
     * Rules are a simple set of regex and relative things to do on match
     * you must specify the regex and the label/onMatch
     */
    export interface Rule {
        label?: string
        regex: RegExp
        onMatch?: (ctx: Context) => void
    }

    export class GenericTokenizer {
        log = console;
        rulesInInsertionOrder: Rule[];

        constructor(rules: Rule[]) {
            this.rulesInInsertionOrder = rules;
        }

        * tokenize(raw: string, ctx: any = {}): Generator<Token> {
            let toTokenize = raw.slice();

            let context: Context = Object.assign({
                prevIndex: null,
                nextIndex: 0,
                tokenBuffer: [],
                tokenBufferMaxLength: 1,
                rule: null
            }, ctx)

            /*
             * continue to tokenize until the complete string is tokenized
             * or no more text is tokenized
             */
            while (context.nextIndex != toTokenize.length && context.nextIndex != context.prevIndex) {
                for (const rule of this.rulesInInsertionOrder) {
                    const regex = rule.regex;
                    regex.lastIndex = context.prevIndex;
                    // @ts-ignore
                    regex.sticky = true;
                    const matches = rule.regex.exec(toTokenize);
                    /*
                     * if matches is null or the match start index is not correct, then NO MATCH
                     */
                    if (!matches || matches.index != context.prevIndex) {
                        continue
                    }
                    /*
                     * update next index
                     */
                    context.prevIndex = context.nextIndex;
                    context.nextIndex = regex.lastIndex;
                    if (rule.onMatch) {
                        rule.onMatch(Object.assign({}, context, {rule: rule, matches: matches}))
                    } else if (rule.label) {
                        context.tokenBuffer.push({
                            label: rule.label,
                            content: matches[0]
                        });
                    } else {
                        throw new Error(`label or onMatch must be provided`);
                    }
                    break;
                }

                /*
                 * if buffer grows, just output older tokens
                 */
                while (context.tokenBuffer.length > context.tokenBufferMaxLength) {
                    yield context.tokenBuffer.shift();
                }
            }

            /*
             * output remaining tokens
             */
            while (context.tokenBuffer.length) {
                yield context.tokenBuffer.shift();
            }

            if (context.nextIndex < toTokenize.length) {
                this.log.error(`Text not fully tokenized, ${toTokenize.length - context.nextIndex} chars left, unknown token:\n${toTokenize.slice(context.nextIndex, context.nextIndex + 25)}`);
            }
        }
    }

    export function tokenizer(rules: Rule[]) {
        return new GenericTokenizer(rules);
    }

}