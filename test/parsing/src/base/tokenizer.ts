export namespace tokenizer {

    export interface Token {
        name: string
        content: string

        [x: string]: any
    }

    export interface Context {
        tokenBuffer: Token[]
        tokenBufferMaxLength: number
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
        enable?: (ctx: Context) => boolean
        onMatch?: (ctx: Context) => void
    }

    export class GenericTokenizer {
        log = console;
        rulesInInsertionOrder: Rule[];

        constructor(rules: Rule[]) {
            this.rulesInInsertionOrder = rules;
        }

        * tokenize(raw: string, context: any = {}): Generator<Token> {
            let toTokenize = raw.slice();

            let prevIndex = null;
            let nextIndex = 0;

            context.tokenBuffer ??= [];
            context.tokenBufferMaxLength ??= 1;

            /*
             * continue to tokenize until the complete string is tokenized
             * or no more text is tokenized
             */
            while (nextIndex < toTokenize.length && nextIndex != prevIndex) {
                prevIndex = nextIndex;

                for (const rule of this.rulesInInsertionOrder) {
                    if (rule.enable && !rule.enable(context)) {
                        continue;
                    }
                    let flags = rule.regex.flags;
                    if (!flags.includes("y")) {
                        flags += "y"
                    }
                    const regex = new RegExp(rule.regex, flags);
                    regex.lastIndex = nextIndex;
                    const matches = regex.exec(toTokenize);
                    /*
                     * if matches is null or the match start index is not correct, then NO MATCH
                     */
                    if (!matches /*|| regex.lastIndex.index != prevIndex // USE STICKY */) {
                        continue
                    }
                    /*
                     * update next index
                     */
                    nextIndex = nextIndex + matches[0].length;
                    if (rule.onMatch) {
                        context.rule = rule;
                        context.matches = matches;
                        rule.onMatch(context)
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

            if (nextIndex < toTokenize.length) {
                this.log.error(`Text not fully tokenized, ${toTokenize.length - nextIndex} chars left, unknown token:\n${toTokenize.slice(nextIndex, nextIndex + 25)}`);
            }
        }
    }

    export function tokenizer(rules: Rule[]) {
        return new GenericTokenizer(rules);
    }

    export namespace onMatch {
        export function ignore(ctx: tokenizer.Context) {

        }

        export function concatSameLabel(ctx: tokenizer.Context) {
            let top = ctx.tokenBuffer[ctx.tokenBuffer.length - 1];
            let label = ctx.rule.label;
            if (top && top.name === label) {
                top.content += ctx.matches[0];
            } else {
                ctx.tokenBuffer.push({
                    name: label,
                    content: ctx.matches[0]
                });
            }
        }
    }

}